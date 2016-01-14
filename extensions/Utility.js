define(['altair/facades/declare',
        'altair/cartridges/extension/extensions/_Base',
        'altair/Deferred',
        'altair/plugins/node!path',
        'altair/facades/mixin'],

    function (declare,
              _Base,
              Deferred,
              pathUtil,
              mixin) {

        return declare([_Base], {

            name: 'controller-utilities',
            _handles: ['controller', 'app', 'module'],
            extend: function (Module) {

                Module.extendOnce({
                    utilityPath: './utilities',
                    utility: function (named, options, config) {

                        var _p = named.search(':') === -1 ?  this.resolvePath(pathUtil.join(this.utilityPath, named)) : '',
                            _c = mixin({
                                type: 'utility',
                                cache: true,
                                name: this.name.split('/')[0] + '/utilities/' + named
                            }, config || {});

                        //if it's a nexus name, pass it off
                        if (named.search(':') > 0) {

                            var parts  = named.split('/'),
                                parent = parts.shift(),
                                _p,
                                name   = parts.pop();

                            _p = this.nexus(parent);

                            if (!_p) {
                                throw new Error('Could not resolve ' + parent);
                            }

                            return _p.utility(name, options, config);

                        }

                        return this.forgeSync(_p, options, _c);

                    }
                });

                return this.inherited(arguments);
            }

        });


    });