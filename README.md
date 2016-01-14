# liquidfire:Sockets
Need to build a headless, socket based app? How about a socket based app using htmlA strategy based approach to sockets. Currently only supports Socket.io (~1.3.7), but implementing other socket libraries is easy enough.

## Building an app
If you want to build a headless socket based app with a nice `Controller`, `Model`, `Service`, `Utility` structure. Before building your
socket app, you need to setup the environment and install `Sockets`.

```bash
$ altair forge app
```

Once you build your app, install `Sockets`.

```bash
$ altair lodge install liquidfire:Sockets
```

Now lets forge the socket app.

```bash
$ altair sockets app
```

Follow the prompts until it creates your app. 

### What got created
Besides the files that got created when the [app was created](https://github.com/liquidg3/altair/blob/master/docs/app.md), here are the new things.

- `configs/sockets.json`: The settings for your app for all environments
- `configs/sockets-dev.json`: Settings just for dev
- `controllers/Index.js`: Sample controller
- `controllers/Admin.js`: Another sample controller
- `controllers/README.md`: More details on controllers
- `App.js`: The main app model
- `models`: An empty directory for your models
- `models/README.md`: More details on models (hint, don't think databases)
- `utilities`: An empty directory for your utilities
- `utilities/README.md`: More details on utilities
- `services`: An empty directory for your services
- `services/README.md`: More details on services
- `web`: An empty directory for your web assets
- `web/index.html`: Hello world
- `web/README.md`: More details on services

Use the sample `Index` controller to get started.

## Starting a server (standalone)
To start a server when you start up `Altair`, add the following to your `modules.json` or `modules-dev.json`.

```json

{
    "liquidfire:Sockets": {
        "sockets": [
            {
                "name": "socketio",
                "options": {
                    "port": 9999,
                    "mode": "server",
                    "host": "http://my-server-location.com"
                }
            },
            
            {
                "name": "socketio",
                "options": {
                    "port": 9999,
                    "mode": "server",
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
    }).then(this.hitch('onSocketConnection'));
    
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

## Emitting Events Server Side to Everyone (or by namespace)
```js

var sockets = this.nexus('liquidfire:Sockets');

//emit to first socket server
sockets.socket().emit('event-name', { ... });

//emit by namespace
sockets.socket('/admin').emit('event-name', { ... });

```

## Using Socket Browser Side
Connecting client side is done using whatever strategy you have chosen. Socket.io client documentation is [here](http://socket.io/docs/client-api/).

##SSL
Getting socket connections to work via SSL means configuring the `Sockets` module. You can do that
in your `modules.json` or your `modules-dev.json`.

```json
{
    "liquidfire:Sockets": {
        "sockets": [
            {
                "name": "socketio",
                "options": {
                    "port": 9999,
                    "mode": "server",
                    "host": "http://my-server-location.com",
                    "privateKeyPath":  "../ssl/server.com.key",
                    "certificatePath": "../ssl/server.com.crt",
                    "ca":              ["../ssl/rapidssl_ca_1.pem", "../ssl/rapidssl_ca_2.pem"]
                }
            }
        ]
    }
}

```

##Disabling JS includes
You may not want the includes that come with the `Sockets` module. Here is what includes could look like by default (versions may differ):

```html
<script src="https://cdn.socket.io/socket.io-1.3.5.js"></script>
<script src="/public/_sockets/js/Sockets.js"></script>
<script src="/public/_sockets/js/Socket.io.js?url=https://taysmacbookpro.local:8080false"></script>
```

If you don't want any of those included, add this to your `modules.json`.
{
    "liquidfire:Sockets": {
        "includeMedia": false,
        "sockets": [
            {
                "name": "socketio",
                "options": {
                    "port": 9999,
                    "mode": "server",
                    "host": "http://my-server-location.com",
                    "privateKeyPath":  "../ssl/server.com.key",
                    "certificatePath": "../ssl/server.com.crt",
                    "ca":              ["../ssl/rapidssl_ca_1.pem", "../ssl/rapidssl_ca_2.pem"]
                }
            }
        ]
    }
}

## Sharing an http server between Sockets and Alfred
If you want to share 1 http server between `Alfred` and `Sockets` so you can have sockets and web browsing on the same port, simple match up your settings and tell `Alfred` not to start.

Set `listenOnStart` to `false` in your `alfred.json` like so:
```json

{
    "site": {
        "strategy": "express3",
        "options":  {
            "port": 80,
            "vendor": "spruce",
            "domain": "website.com",
            "listenOnStart": false,
            "media":  {
                ....
            },
            "routes": {
                ....
            }

        }
    }
}
```

Then make sure the settings for `Sockets` matches in your `modules.json`:

```json
"liquidfire:Sockets": {
    "sockets": [
        {
            "name": "socketio",
            "options": {
                "port": 80,
                "mode": "server",
                "host": "http://website.com"
            }
        }

    ]
}
```

Now your sockets and http requests all go through the same port and connection!

#Serving pages without `Alfred`
If you want the `Sockets` module to serve files for you, modify your config like so


```json
"liquidfire:Sockets": {
    "host": "0.0.0.0",
    "port: 8080,
    "serveStaticPath": "./path/to/html/files",
    "serveStaticUrl: "/"
    "sockets": [
        {
            "name": "socketio",
            "options": {
                "mode": "server"
            }
        }

    ]
}
```

Then make sure you have an `index.html` file inside of `./path/to/html/files'.