/**
 * Filtrex provides compileExpression() to compile user expressions to JavaScript.
 *
 * See https://github.com/joewalnes/filtrex for tutorial, reference and examples.
 * MIT License.
 *
 * Includes Jison by Zachary Carter. See http://jison.org/
 *
 * -Joe Walnes
 */
module.exports = function compileExpression(expression, extraFunctions /* optional */, source /* optional */) {
    
    var get = function(o, s) {
        if (typeof o !== 'object') return o;
        var args = Array.prototype.slice.call(arguments, 1);
        if (args.length > 1) {
            var a = args;
        } else if (typeof s === 'string') {
            s = s.replace(/\[(\w+)\]/g, '.$1');  // convert indexes to properties
            s = s.replace(/^\./, ''); // strip leading dot
            var a = s.split('.');
        } else {
            var a = [s];
        }
        while (a.length) {
            var n = a.shift();
            if (n in o) {
                o = o[n];
            } else {
                return;
            }
        }
        return o;
    };
    
    var has = function(o, v) {
        if (Object.prototype.toString.call(o) === '[object Array]') {
            return o.indexOf(v) > -1;
        } else if (typeof o === 'object') {
            return o.hasOwnProperty(v);
        } else {
            return false;
        }
    };
    
    var parser = require('./parser');

    var functions = {
        abs: Math.abs,
        ceil: Math.ceil,
        floor: Math.floor,
        log: Math.log,
        max: Math.max,
        min: Math.min,
        random: Math.random,
        round: Math.round,
        sqrt: Math.sqrt,
        get: get,
        has: has
    };
    if (extraFunctions) {
        for (var name in extraFunctions) {
            if (extraFunctions.hasOwnProperty(name)) {
                functions[name] = extraFunctions[name];
            }
        }
    }
    var tree = parser.parse(expression);
    
    var js = [];
    js.push('return ');
    function toJs(node) {
        if (Array.isArray(node)) {
            node.forEach(toJs);
        } else {
            js.push(node);
        }
    }
    tree.forEach(toJs);
    js.push(';');
    
    function unknown(funcName) {
        throw 'Unknown function: ' + funcName + '()';
    }
    
    if (source) return js.join('');
    
    var func = new Function('functions', 'data', 'unknown', js.join(''));
    
    return function(data) {
        return func(functions, data, unknown);
    };
}
