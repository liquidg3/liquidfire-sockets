define(['altair/facades/declare',
    'altair/Lifecycle',
    'apollo/_HasSchemaMixin'
], function (declare, Lifecycle, _HasSchemaMixin) {

    return declare([Lifecycle, _HasSchemaMixin], {

        _js: null,

        /**
         * We will attach any js to the current web server's router. we will statically route /public/__sockets
         *
         * @param server
         * @returns {*|Promise}
         */
        configureWebServer: function (server) {

            var router = server.router(),
                routes = server.appConfig.routes,
                js = [],
                dfd;

            if (this._js) {

                //everything will be
                server.serveStatically(this.parent.resolvePath('public'), '/public/_sockets');
                dfd = router.attachMedia(routes, { js: this._js });

            } else {
                dfd = new this.Deferred();
                dfd.resolve();
            }

            return dfd.then(function () {
                return this;
            }.bind(this));

        }



    });

});