/**
 * Bridges the event gap between front and back end.
 *
 * @author:     Taylor
 * @license:    MIT
 * @vendor:     liquidfire
 * @module:     Sockets
 * @nexus:      this.nexus("liquidfire:Sockets")
 *
 */

define(['altair/facades/declare',
        'altair/mixins/_AssertMixin',
        'altair/modules/commandcentral/mixins/_HasCommandersMixin',
        'apollo/_HasSchemaMixin',
        './mixins/_HasSocketStrategiesMixin',
        './extensions/Entity',
        './extensions/Model',
        'lodash',
        'altair/plugins/node!path'
], function (declare,
             _AssertMixin,
             _HasCommandersMixin,
             _HasSchemaMixin,
             _HasSocketStrategiesMixin,
             EntityExtension,
             ModelExtension,
             _,
             path) {

    return declare([_AssertMixin, _HasCommandersMixin, _HasSocketStrategiesMixin, _HasSchemaMixin], {

        _strategies:    null,
        _activeSockets: null,
        _staticServer:  null,

        /*
         * @param options
         * @returns {altair.Promise}
         */
        startup: function (options) {

            //use the options that were passed in, or the ones we have by default; avoid mutating options
            var _options = options || this.options || {};

            //reset active servers
            this._activeSockets = [];

            //getSocketValues extension
            var extensions      = this.nexus('cartridges/Extension'),
                entity          = new EntityExtension(extensions),
                model           = new ModelExtension(extensions);

            extensions.addExtensions([entity, model]);

            //whenever a web server is booted, make sure each strategy is notified so it can copy css/js if needed
            if (this.nexus('titan:Alfred')) {
                this.on('titan:Alfred::did-execute-server').then(this.hitch('onDidExecuteAlfredWebServer'));
            }

            //let any mixin run their startup
            return this.inherited(arguments);

        },

        /**
         * Module is being executed, by waiting until now to check our options for sockets is so all other modules
         * have had a chance to start up
         *
         * @returns {*|Promise}
         */
        execute: function () {

            return this.inherited(arguments).then(this.hitch(function () {

                var options = this.options || {};

                //did someone pass some sockets settings?
                if (options.sockets) {

                    this.refreshStrategies().then(function () {

                        //loop through each and start them up
                        _.each(options.sockets, function (socket) {

                            this.startupSocket(socket.name, socket.options).otherwise(this.hitch('log'));

                        }, this);

                    }.bind(this)).otherwise(this.log.bind(this));

                }
                //we have a full fledged app
                else if (options.app) {

                    this.startupApp(options.app.strategies, options.app.options);

                }

                return this;

            }));

        },

        startupApp: function (socketOptions, appOptions) {

            this.log('Starting up socket app.');

            this.assertArray(socketOptions, 'socket options must be an array');

            //load latest strategies
            return this.refreshStrategies().then(function () {

                return this.all(_.map(socketOptions, function (options) {

                    return this.startupSocket(options.name, options.options);

                }, this));

            }.bind(this)).then(function (servers) {

                var app     = this.nexus('Altair').resolvePath('./App'),
                    name    = appOptions.vendor + ':*';

                appOptions.servers = servers;

                return this.forge(app, appOptions, { type: 'app', name: name, parent: null });

            }.bind(this)).then(function (app) {

                //so nexus can resolve our app
                this._nexus.set(app.name, app);

                return app.execute();

            }.bind(this)).otherwise(function (err) {

                this.err(err);

            }.bind(this));

        },

        /**
         * Make sure the sockets get a chance to configure the alfred web server (this will only do anything if socket
         * is started before alfred).
         *
         * @param e {altair.events.Emitter}
         */
        onDidExecuteAlfredWebServer: function (e) {

            _.each(this._activeSockets, function (server) {
                server.configureWebServer(e.get('server'));
            });

        },

        /**
         * All the socket server strategies we have available
         *
         * @returns {altair.Deferred}
         */
        refreshStrategies: function () {

            return this.emit('register-socket-strategies').then(this.hitch(function (e) {

                var _strategies = {};

                _.each(e.results(), function (obj) {
                    _.merge(_strategies, obj);
                });

                this._strategies = _strategies;

                return _strategies;

            }));

        },

        /**
         * Gets you all current strategies, key is name, value is path
         *
         * @returns {{}}
         */
        strategies: function () {
            return this._strategies;
        },

        /**
         * Factory for creating and starting sockets, use this.refreshStrategies before starting up anything to make
         * sure you have the latest (unless you know you do, then don't refresh them)
         *
         * @param named
         * @param options
         */
        startupSocket: function (named, options) {

            var alfred      = this.nexus('titan:Alfred'),
                _options    = options,
                host        = this.get('host'),
                port        = this.get('port'),
                staticPath  = this.get('serveStaticPath'),
                staticUrl   = this.get('serveStaticUrl'),
                activeServer;

            //if there is an active server in alfred, use its http server (maybe support more later if needed)
            if (alfred) {

                activeServer = alfred.activeServers()[0];

                if (activeServer) {
                    _options.http = activeServer.http();
                }

            }

            //supply a host and port if the socket does not have theyr own
            if (staticPath && staticUrl) {

                if (!this._staticServer) {

                    require(['altair/plugins/node!node-static', 'altair/plugins/node!http', 'altair/plugins/node!https'], function (nodeStatic, http, https) {

                        var file = new nodeStatic.Server(staticPath);

                        this.log('Statically serving', staticPath, 'at', host + ':' + port);

                        this._staticServer = http.createServer(function (request, response) {

                            request.addListener('end', function () {
                                file.serve(request, response);
                            }).resume();

                        }).listen(port, host);

                    }.bind(this));

                }

                _options.http = this._staticServer

            }


            if (!_options.host) {

            }

            if (!this._strategies) {
                throw new Error('You must call refreshStrategies() on liquidfire:Sockets before you can startup a socket server.');
            }

            if (!_.has(this._strategies, named)) {
                throw new Error('No socket strategy named "' + named + '" available. Options are: ' + Object.keys(this._strategies).join(', '));

            }

            //forge the socket strategy
            return this.forge(this._strategies[named], _options).then(function (strategy) {

                //keep list of all active server
                this._activeSockets.push(strategy);

                if (alfred) {
                    activeServer = alfred.activeServers()[0];
                }

                //if there is a web server,
                if (activeServer) {
                    strategy.configureWebServer(activeServer, this.options);
                }

                return strategy.execute();

            }.bind(this));

        },

        teardown: function () {

            return this.all(_.map(this._activeSockets, function (s) {
                return s.teardown();
            }));

        },

        activeSockets: function () {
            return this._activeSockets;
        }



    });
});