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
        'altair/modules/commandcentral/mixins/_HasCommandersMixin',
        './mixins/_HasSocketStrategiesMixin'
], function (declare,
             _HasCommandersMixin,
             _HasSocketStrategiesMixin) {

    return declare([_HasCommandersMixin, _HasSocketStrategiesMixin], {

        _strategies: null,

        /*
         * @param options
         * @returns {altair.Promise}
         */
        startup: function (options) {

            //use the options that were passed in, or the ones we have by default; avoid mutating options
            var _options = options || this.options || {};

            this.on('titan:Alfred::did-execute-server').then(this.hitch('onDidExecuteServer'));
            this.on('titan:Alfred::will-render-theme').then(this.hitch('onWillRenderTheme'));

            //let any mixin run their startup
            return this.inherited(arguments);
        },

        /**
         * Make sure the socket listener is in place
         */
        onDidExecuteServer: function (e) {



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
         * When a theme is going to be rendered, lets drop in our public lib
         *
         * @param e
         */
        onWillRenderTheme: function (e) {


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
         * Factory for creating and starting sockets, use this
         *
         * @param named
         * @param options
         */
        startupSocket: function (named, options) {

            var alfred      = this.nexus('titan:Alfred'),
                _options    = options,
                activeServer;

            //if there is an active server in alfred, use its http server
            if(alfred) {

                activeServer = alfred.activeServers().pop();

                if(activeServer) {
                    _options.http = activeServer.http();
                }

            }

            return this.forge(this._strategies[named], _options).then(function (strategy) {

                return strategy.execute();

            });

        }

    });
});