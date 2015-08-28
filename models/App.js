define(['altair/facades/declare',
        'altair/Lifecycle',
        'altair/mixins/_AssertMixin',
        'altair/events/Emitter',
        'lodash',
        'altair/plugins/node!fs',
        'altair/plugins/node!path'
], function (declare,
             Lifecycle,
             Emitter,
             _AssertMixin,
             _,
             fs,
             pathUtil) {

    return declare([Lifecycle, Emitter, _AssertMixin], {

        server:         null,
        _controllers:   null,

        //callbacks
        onConnection:       function (e) {

            _.each(this._controllers, function (c) {
                c.onConnection(e);
            });


        },
        onDisconnect:       function (e) {

            _.each(this._controllers, function (c) {
                c.onDisconnect(e);
            });

        },

        startup: function (options) {

            this.assert(options, 'You must pass your app model some options.');
            this.assert(options.server, 'You must pass your app model a live socket server.');

            //setup listeners for stubbed callbacks
            this.on('liquidfire:Sockets::did-connect').then(this.hitch('onConnection'));
            this.on('liquidfire:Sockets::did-disconnect').then(this.hitch('onDisconnect'));

            //where to look for controllers, relative to ourselves
            var path = this.resolvePath('controllers');

            //we start with no controllers
            this._controllers = [];

            //startup as normal
            return this.inherited(arguments).then(function () {

                return this.promise(fs, 'readdir', path);

            }.bind(this)).then(function (files) {

                var controllers = [];

                _.each(files, function (file) {

                    if (file.substr(-3) === '.js') {

                        var name = pathUtil.join(path, file).replace('.js', '');
                        controllers.push(this.forgeController(name));

                    }

                }, this);

                return this.all(controllers);

            }.bind(this)).then(function (controllers) {

                this._controllers = controllers;

                return this;

            }.bind(this));

        },

        forgeController: function (named, options) {

            var _options = options || this.options,
                appPath  = this.nexus('Altair').resolvePath('.'),
                fullName = this.name + named.replace(appPath, '').replace('.js', '');

            this.log('forging ' + fullName);

            return this.forge(named, _options, { type: 'controller', name: fullName, foundry: function (Class, options, config) {

                Class.extendOnce({
                    appPath: appPath,
                    dir:     appPath
                });

                return config.defaultFoundry(Class, options, config);


            }});

        },

        execute: function (options) {

            _.each(this._controllers, function (c) {
                c.execute();
            });

            this.log('Socket app ready and waiting.');
        }




    });

});