define(['altair/facades/declare',
        'altair/Lifecycle',
        'apollo/_HasSchemaMixin'
], function (declare,
             Lifecycle,
             _HasSchemaMixin) {

    return declare([Lifecycle, _HasSchemaMixin], {

        _js: null,




    });

});