define(['altair/facades/declare',
        './_Base',
        'altair/plugins/node!sockjs',
        'altair/plugins/node!http',
        'altair/plugins/config!./schema.json'
], function (declare,
             _Base,
             sockjs,
             http,
             schema) {

    return declare([_Base], {

        _schema: schema,
        _server: null,
        _http:   null,
        _customServer: false,
        _activeConnections: null,

        /**
         * Setup the socket adapter.
         *
         * @param options
         * @returns {altair.Promise}
         */
        startup: function (options) {

            var _options = options || this.options || {};

            this._js = ['http://cdn.sockjs.org/sockjs-0.3.min.js', ''];

            //so we can track everyone who is connected
            this._activeConnections = [];

            this.log('starting Sockjs');

            //let normal startup run, then create server
            return this.inherited(arguments).then(function () {

                //create a socket server
                this._server = sockjs.createServer(options);

                //did we receive an http server?
                if(options.http) {
                    this.log('using existing http server');
                    this._http = options.http;
                } else {
                    this.log('creating http server');
                    this._http = http.createServer();
                    this._customServer = true;
                }

                //events
                this._http.on('connection', function(conn) {

                    //emit our connect event
                    this.parent.emit('did-connect', {
                        connection: conn,
                        strategy: this
                    });

                    conn.on('data', function(message) {

                        conn.write(message);

                    }.bind(this));

                    //emit close event
                    conn.on('close', function() {

                        this.parent.emit('did-disconnect', {
                            connection: conn,
                            strategy: this
                        });

                    }.bind(this));

                }.bind(this));

                return this;

            }.bind(this));

        },

        /**
         * Attach to and start http server if one is not started.
         */
        execute: function () {

            var options = {};

            if(this.get('path')) {
                options.prefix = this.get('path');
            }

            this.log('installing socket handlers');

            this._server.installHandlers(this._http, options);

            if(this._customServer) {
                this.log('starting http server.');
                this._http.listen(this.get('port'), '0.0.0.0');
            }

        },

        /**
         * @param connection
         * @param message
         */
        onMessage: function (e) {


        }


    });

});