define(['altair/facades/declare',
    'altair/modules/commandcentral/mixins/_IsCommanderMixin'
], function (declare,
             _IsCommanderMixin) {

    return declare([_IsCommanderMixin], {

        /**
         * Refresh all socket startegies so schemaForCommand can drop them is as choices.
         *
         * @returns {altair.Promise}
         */
        startup: function () {
            var _args = arguments;
            return this.parent.refreshStrategies().then(this.hitch(function () {
                return this.inherited(_args);
            }));
        },

        /**
         * Startup a socket server
         */
        start: function (options) {

            var named = options.strategy || this.parent.get('defaultStrategy');

            //refresh strategies
            return this.parent.refreshStrategies().then(this.hitch(function (strategies) {

                return this.forge(strategies[named], null, {startup: false});

            })).then(this.hitch(function (strategy) {

                //prompt user for schema
                return this.form(strategy.schema());

            })).then(this.hitch(function (values) {

                //start the new server
                return this.parent.startupSocket(named, values).otherwise(this.hitch('log'));

            }));

        },

        create: function (options) {

            return this.parent.forge('foundries/App').then(function (app) {

                return app.forge(options);

            }).step(function (msg) {

                this.writeLine(msg);

            }.bind(this)).then(function (values) {

                this.writeLine('app created at: ' + values.destination);
                this.writeLine('run the following commands:', 'h1');
                this.writeLine('-----------------------');
                this.writeLine('| $cd ' + values.destination);
                this.writeLine('| $altair');
                this.writeLine('-----------------------');


            }.bind(this));

        },

        /**
         * Update schema at runtime
         *
         * @param named
         */
        schemaForCommand: function (command) {

            var schema = this.inherited(arguments),
                strategies;

            //the newModule command has some choices that need updating (destination dir)
            if (command.callback === 'start') {

                strategies = this.parent.strategies();
                schema.setOptionFor('strategy', 'choices', strategies);

            }


            return schema;
        }

    });
});