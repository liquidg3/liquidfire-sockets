define(['altair/facades/declare',
    './_Base',
    'altair/plugins/node!socket.io',
    'altair/plugins/config!./schema.json',
    'lodash'
], function (declare, _Base, io, schema, _) {

    io = io();

    return declare([_Base], {

        _schema:            schema,
        _client:            io,
        _activeConnections: null,
        _activeListeners:   null,

        /**
         * Setup the socket adapter.
         *
         * @param options
         * @returns {altair.Promise}
         */
        startup: function (options) {

            var _options = options || this.options || {};

            //so we can track everyone who is connected
            this._activeConnections = [];

            //all event listeners set from a client
            this._activeListeners   = [];

            this.log('starting socket.io');

            //let normal startup run, then create server
            return this.inherited(arguments).then(function () {

                //our js with path host settings, etc.
                this._js = ['https://cdn.socket.io/socket.io-1.0.6.js', '/public/_sockets/js/Sockets.js', '/public/_sockets/js/Socket.io.js?url=' + this.get('host') + ':' + this.get('port')];

                //if we are in server modes
                if (this.get('mode') === 'server' || this.get('mode') === 'relay') {
                    this.startupServer();
                }

                return this.all({
                    _cleaner: this.parent.forge('util/EventCleaner')
                });

            }.bind(this)).then(function (deps) {

                declare.safeMixin(this, deps);

                return this;

            }.bind(this));

        },

        /**
         * Startup the socket server
         *
         * @returns {sockets.strategies._Base}
         */
        startupServer: function () {

            //events
            this._client.on('connection', function (conn) {

                this._activeConnections.push(conn);

                //emit our connect event
                this.parent.emit('did-connect', {
                    connection: conn,
                    strategy:   this
                });

                //remote end is registering for an event
                conn.on('register-listener', function (message, callback) {
                    this.registerEventListener(conn, message, callback);
                }.bind(this));

                conn.on('error', function (err) {
                    this.log(err);
                }.bind(this));

                //emit close event
                conn.on('disconnect', function () {

                    this.parent.emit('did-disconnect', {
                        connection: conn,
                        strategy:   this
                    });

                    this.unRegisterEventListeners(conn);
                    this._activeConnections.splice(this._activeConnections.indexOf(conn), 1);

                }.bind(this));

            }.bind(this));

            return this;
        },

        /**
         * Attach to and start http server if one is not started.
         */
        execute: function () {

            if (this._client) {
                this._client.listen(this.get('port'));
            }

            return this.inherited(arguments);

        },

        /**
         * Registers a callback for the event for the passed "connection"
         *
         * @param connection
         * @param data { id: "aoeuKOE", event: "titan:Alfred::did-receive-request", query: '{}'
         */
        registerEventListener: function (connection, data, callback) {

            data.connection = connection;

            data.deferred = this.parent.on(data.event, function (e) {

                var d = _.clone(e.data);
                d.event = data.event;
                d.id    = data.id;
                d       = this._cleaner.cleanEventData(d);

                connection.emit('dispatch-event', d);

            }.bind(this),  data.query);

            this._activeListeners.push(data);
            callback(true);

        },

        /**
         * Removes all event listeners set by this connection
         *
         * @param connection
         * @returns {sockets.strategies._Base}
         */
        unRegisterEventListeners: function (connection) {

            this._activeListeners = _.filter(this._activeListeners, function (data) {

                if (data.connection === connection) {

                    this.parent.removeEventListener(data.event, data.deferred);

                    return false;


                } else {
                    return data;
                }

            }, this);

            return this;

        }


    });

});