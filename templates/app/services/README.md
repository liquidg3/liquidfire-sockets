#Services
Need to communicate with an external system, service, or API? Building an Installer? An Updater? Drop it into a service. 
Emails, text messages, Slack notifications? Drop it into a service. The thing about services is they probably need some 
configuring, so it would be best to front load them in your `App` so they are available. Lemme show you:

`configs/sockets.json`
```json

{
    "host": "0.0.0.0",
    "port": 8080,
    "app": {
        "options": {
            "vendor": "vendorname",
            "notifications": {
                "username": "foo",
                "apiKey": "bar"
            }
        },
        "strategies": { ... }
    }

}

```
Notice everything inside of `app.options.notifications`. I want all those settings to be passed to my `Notification` service.


`App.js`

```js
notifications: null,

startup: function (options) {
    
    //options is everything ins
    this.mixinDependencies({
        notifications: this.service('Notification', options.notifications);
    });
    
    return this.inherited(arguments);

},
```

`controllers/Admin.js`
```js

signupUser: function (values, cb) {

    //some logic to handle signup
    ...
    cb(null, true);
    
    //notify someone a new signup occurred
    this.parent.notifications.alert('A user signed up');
    
}

``