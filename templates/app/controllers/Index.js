define(['altair/facades/declare',
    'altair/Lifecycle',
    'altair/mixins/_AssertMixin',
    'altair/events/Emitter'
], function (declare,
             Lifecycle,
             _AssertMixin,
             Emitter) {

    return declare([Lifecycle, _AssertMixin, Emitter], {


        startup: function (options) {

            //listen for connections on any path
            this.on('liquidfire:Sockets::did-connect', { path: '/' }).then(this.hitch('onConnection'));
            //this.on('liquidfire:Sockets::did-disconnect', { path: '/admin' }).then(this.hitch('onDisconnect'));

            return this.inherited(arguments);

        },

        onConnection: function (e) {

            //get the connection
            var connection = e.get('connection');

            //listen for events
            //connection.on('event-name', this.hitch('callbackWithAcknowledgement'));
            //connection.on('event-name', { path: '/admin' }, this.hitch('callbackWithAcknowledgement'));
            //connection.on('event-name', this.hitch('callbackWithoutAcknowledgement'));
            //connection.on('event-name', this.hitch('callbackWithConnection', connection));


        },

        callbackWithAcknowledgement: function (data, cb) {
            //call cb() when you are done the client will get the response.
            //all you have to do is add cb() as the last argument and socket.io will require
            //it to be invoked before the client can move on.
        },

        callbackWithoutAcknowledgement: function (data) {
            //run whatever you want, the client has moved on
        },

        callbackWithConnection: function (connection, data) {
            //will pass the connection with
        },

        //Whenever a socket connection is lost or disconnected
        onDisconnect: function (e) {}

    });

});