#Utilities
Utilities are simple classes with methods that do helpful things in a one off manner. Sometimes I use a `Password` utility
to hash passwords. It looks something like this:

```js
var pass = this.utility('Password');

pass.hash('my-password-things').then(function () { ... });

``

If you need a one off piece of logic that you have to use all over the place, drop it in a `Utility`.