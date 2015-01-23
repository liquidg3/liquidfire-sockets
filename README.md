# liquidfire:Sockets
A strategy based approach to sockets. Currently only supports Socket.io (0.9.x), but implementing other socket libraries is easy enough.


## Starting a server
To start a server when you start up `Altair`, add the following to your `modules.json` or `modules-dev.json`.

```json

{
    "liquidfire:Sockets": {
        "sockets": [
            {
                "name": "socketio",
                "options": {
                    "port": 9999,
                    "model": "server",
                    "host": "http://my-server-location.com",
                    "path": "/"
                }
            },
            
            {
                "name": "socketio",
                "options": {
                    "port": 9999,
                    "model": "server",
                    "host": "http://my-server-location.com",
                    "path": "/a-namespace"
                }
            }
        ]
    }
}

```
Now when you startup `Altair`, your socket servers will start for you. To listen in on connections at particular paths, add the following to the `startup()` of your `Controller` or `App` in `Alfred`.

```js
startup: function () {
    
    //listen in on the first socket server
    this.on('liquidfire:Sockets::did-connect', {
        path: '/'
    }).then(this.hitch('onMainSocketConnection'));
    
    //listen in on the second one
    this.on('liquidfire:Sockets::did-connect', {
        path: '/a-namespace'
    }).then(this.hitch('onNamespacedSocketConnection'));
    
    this.on('liquidfire:Sockets::did-connect', {
        path: '/a-namespace'
    }).then(this.hitch('onMainSocketConnection'));
    
    return this.inherited(arguments);

},

onMainSocketConnection: function (e) {

    //the connection is a native to whatever socket adapter you are using
    //right now socketio uses socket.io 0.9.x
    var connection = e.get('connection');
    
    connection.on('some-event', this.hitch('onSomeEvent', connection)); //i bound connection as the first parameter so the callback

},

onNamespacedSocketConnection: function (e) {

    var connection = e.get('connection');
    
    connection.emit('connection-made', { foo: 'bar' });
    
},

//invoked when `some-event` is emitted from a client on the server connection whose path is '\'.
onSomeEvent: function (connection, data) {

}

```
Since the socket.io adapter is currently 0.9.x, you'll need to use the [docs here](https://github.com/Automattic/socket.io/tree/0.9.17).