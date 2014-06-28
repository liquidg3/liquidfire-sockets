;
(function (altair) {

    //help me to parse settings
    function decodeQueryString(string) {

        var query = string,
            vars = query.split('&'),
            results = {};

        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            results[pair[0]] = pair[1];
        }

        return results;
    }

    //give each listener a unique id
    function makeId() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 10; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    var Event = function (name, data) {
        this.name = name;
        this.data = data;
        this.get = function (name, defaultValue) {
            return this.data[name] || defaultValue;
        };
    };

    //read config
    var scripts = document.getElementsByTagName('script'),
        index = scripts.length - 1,
        script = scripts[index],
        options = decodeQueryString(script.src.split('?')[1]);

    if (!options || !altair.sockets || !io) {
        throw new Error('The Socket.io file cannot be manually include. Use the liquidfire:Sockets module to use it properly.');
    }


    var Adapter = function (options) {
        this._url = options.url;
        this._client = null;
        this._listeners = {};

    };

    //connect to socket using adapter
    Adapter.prototype.connect = function () {

        //create new client
        this._client = new io(this._url);

        //attach all listeners that may have been set before connect was called
        this.on('connect', this.attachListeners.bind(this));
        this.on('dispatch-event', this.onServerEvent.bind(this));
    };

    Adapter.prototype.send = function (message) {
        this._client.emit('message', message);
    };

    Adapter.prototype.emit = function (name, data, callback) {
        this._client.emit(name, data, callback);

    };

    Adapter.prototype.onServerEvent = function (data) {

        var listener = this._listeners[data.id],
            e;

        if(listener) {
            e = new Event(data.event, data);
            listener.callback(e);
        }

    };

    Adapter.prototype.onMessage = function (data) {
        console.log('on message', data);
    };

    /**
     * (re)Attaches all listeners to the server. This is called whenever a new connection is
     * made in case the connection had dropped
     */
    Adapter.prototype.attachListeners = function () {

        var events = Object.keys(this._listeners),
            i,
            listener;

        for (i = 0; i < events.length; i++) {

            listener = this._listeners[events[i]];

            this.emit('register-listener', {
                event: listener.event,
                query: listener.query,
                id:    listener.id
            }, function (pass) {

                if(!pass) {
                    throw new Error('Could not listen into event ' + listener.event + '. Make sure the proper events are configured for sockets.');
                }

            });

        }

    };

    /**
     * Add an event listener that will be passed through to the server
     * @param event
     * @param query
     * @param callback
     */
    Adapter.prototype.on = function (event, query, callback) {

        if (['connect', 'event', 'disconnect', 'dispatch-event'].indexOf(event) > -1) {
            return this._client.on(event, callback || query);
        }

        //query
        if (!callback) {
            callback = query;
            query = undefined;
        }

        var listener = {
            event:    event,
            id:       makeId(),
            callback: callback,
            query:    query
        };


        this._listeners[listener.id] = listener;

        if (this._client) {

            this.emit('register-listener', {
                event: listener.event,
                query: listener.query,
                id:    listener.id
            }, function (pass) {

                if(!pass) {
                    throw new Error('Could not listen into event ' + listener.event + '. Make sure the proper events are configured for sockets.');
                }

            });

        }

    };

    //create adapter and pass it to sockets.
    altair.sockets.setAdapter(new Adapter(options));

    //start the server... dick move?
    altair.sockets.connect();


})(window.altair);