var expect = require('chai').expect;
var compileExpression = require('../');

describe('filtrex', function() {
    it('evaluates simple numeric expressions', function() {
        expect(compileExpression('1 + 2 * 3')()).to.equal(7);
        expect(compileExpression('2 * 3 + 1')()).to.equal(7);
        expect(compileExpression('1 + (2 * 3)')()).to.equal(7);
        expect(compileExpression('(1 + 2) * 3')()).to.equal(9);
        expect(compileExpression('(4 * 5) / 2')()).to.equal(10);
        expect(compileExpression('((1 + 2) * 3 / 2 + 1 - 4 + (2 ^ 3)) * -2')()).to.equal(-19);
        expect(compileExpression('1.4 * 1.1')()).to.equal(1.54);
        expect(compileExpression('97 % 10')()).to.equal(7);
    });

    it('binds to data', function() {
        var something = compileExpression('1 + foo * bar');
        expect(something({foo:5, bar:2})).to.equal(11);
        expect(something({foo:2, bar:1})).to.equal(3);
    });

    it('evaluates basic math functions', function() {
        expect(compileExpression('abs(-5)')()).to.equal(5);
        expect(compileExpression('abs(5)')()).to.equal(5);
        expect(compileExpression('ceil(4.1)')()).to.equal(5);
        expect(compileExpression('ceil(4.6)')()).to.equal(5);
        expect(compileExpression('floor(4.1)')()).to.equal(4);
        expect(compileExpression('floor(4.6)')()).to.equal(4);
        expect(compileExpression('round(4.1)')()).to.equal(4);
        expect(compileExpression('round(4.6)')()).to.equal(5);
        expect(compileExpression('sqrt(9)')()).to.equal(3);
    });

    it('evaluates functions with multiple args', function() {
        expect(compileExpression('min(2)')()).to.equal(2);
        expect(compileExpression('max(2)')()).to.equal(2);
        expect(compileExpression('min(2, 5)')()).to.equal(2);
        expect(compileExpression('max(2, 5)')()).to.equal(5);
        expect(compileExpression('min(2, 5, 6)')()).to.equal(2);
        expect(compileExpression('max(2, 5, 6)')()).to.equal(6);
        expect(compileExpression('min(2, 5, 6, 1)')()).to.equal(1);
        expect(compileExpression('max(2, 5, 6, 1)')()).to.equal(6);
        expect(compileExpression('min(2, 5, 6, 1, 9)')()).to.equal(1);
        expect(compileExpression('max(2, 5, 6, 1, 9)')()).to.equal(9);
        expect(compileExpression('min(2, 5, 6, 1, 9, 12)')()).to.equal(1);
        expect(compileExpression('max(2, 5, 6, 1, 9, 12)')()).to.equal(12);
    });

    it('evaluates nested properties', function() {
        var vars = { foo: { bar: { baz: 10 }, things: ['one', 'two', 'three'] } };
        expect(compileExpression('(foo.bar.baz + 6) / 2')(vars)).to.equal(8);
        expect(compileExpression('foo.bar.baz + foo.things.2')(vars)).to.equal('10three');
        expect(compileExpression('foo.things.0 + " + " + foo.things[1]')(vars)).to.equal('one + two');
        expect(compileExpression('foo.bar.unknown')(vars)).to.be.undefined;
        expect(compileExpression('foo.unknown')(vars)).to.be.undefined;
        expect(compileExpression('foo[bar]')(vars)).to.eql({ baz: 10 });
        expect(compileExpression('foo[bar][baz]')(vars)).to.equal(10);
        expect(compileExpression('foo.things[2]')(vars)).to.equal('three');
        expect(compileExpression('foo.things.length')(vars)).to.equal(3);
        expect(compileExpression('foo[bar][baz] > 5')(vars)).to.equal(1);
        expect(compileExpression('foo.things has "one"')(vars)).to.be.true;
        expect(compileExpression('not foo.things has "one"')(vars)).to.equal(0);
        expect(compileExpression('foo.fn(foo)').bind(null, vars)).to.throw;
    });
    
    it('evaluates nested properties using get', function() {
        var vars = { key: 'bar', idx: 2, foo: { bar: { baz: 10 }, things: ['one', 'two', 'three'] } };
        expect(compileExpression('get(foo, key)')(vars)).to.eql({ baz: 10 });
        expect(compileExpression('get(foo, key, "baz") * 2')(vars)).to.eql(20);
        expect(compileExpression('get(foo.things, idx)')(vars)).to.equal('three');
        expect(compileExpression('get(foo.things, 1 + 1)')(vars)).to.equal('three');
        expect(compileExpression('get(foo.things, max(2))')(vars)).to.equal('three');
        expect(compileExpression('get(foo.things, 0 or 1)')(vars)).to.equal('two');
        expect(compileExpression('get(foo, "things", 1 + 1)')(vars)).to.eql('three');
        expect(compileExpression('get(foo, "things", foo.things.length - 1)')(vars)).to.eql('three');
    });

    it('evaluates boolean logic', function() {
        expect(compileExpression('0 and 0')()).to.equal(0);
        expect(compileExpression('0 and 1')()).to.equal(0);
        expect(compileExpression('1 and 0')()).to.equal(0);
        expect(compileExpression('1 and 1')()).to.equal(1);
        expect(compileExpression('0 or 0')()).to.equal(0);
        expect(compileExpression('0 or 1')()).to.equal(1);
        expect(compileExpression('1 or 0')()).to.equal(1);
        expect(compileExpression('1 or 1')()).to.equal(1);
        expect(compileExpression('not 0')()).to.equal(1);
        expect(compileExpression('not 1')()).to.equal(0);
        expect(compileExpression('(0 and 1) or 1')()).to.equal(1);
        expect(compileExpression('0 and (1 or 1)')()).to.equal(0);
        expect(compileExpression('0 and 1 or 1')()).to.equal(1); // or is higher precedence
        expect(compileExpression('1 or 1 and 0')()).to.equal(1); // or is higher precedence
        expect(compileExpression('not 1 and 0')()).to.equal(0); // not is higher precedence
    });

    it('evaluates comparisons', function() {
        expect(compileExpression('foo == 4')({foo:4})).to.equal(1);
        expect(compileExpression('foo == 4')({foo:3})).to.equal(0);
        expect(compileExpression('foo == 4')({foo:-4})).to.equal(0);
        expect(compileExpression('foo != 4')({foo:4})).to.equal(0);
        expect(compileExpression('foo != 4')({foo:3})).to.equal(1);
        expect(compileExpression('foo != 4')({foo:-4})).to.equal(1);
        expect(compileExpression('foo > 4')({foo:3})).to.equal(0);
        expect(compileExpression('foo > 4')({foo:4})).to.equal(0);
        expect(compileExpression('foo > 4')({foo:5})).to.equal(1);
        expect(compileExpression('foo >= 4')({foo:3})).to.equal(0);
        expect(compileExpression('foo >= 4')({foo:4})).to.equal(1);
        expect(compileExpression('foo >= 4')({foo:5})).to.equal(1);
        expect(compileExpression('foo < 4')({foo:3})).to.equal(1);
        expect(compileExpression('foo < 4')({foo:4})).to.equal(0);
        expect(compileExpression('foo < 4')({foo:5})).to.equal(0);
        expect(compileExpression('foo <= 4')({foo:3})).to.equal(1);
        expect(compileExpression('foo <= 4')({foo:4})).to.equal(1);
        expect(compileExpression('foo <= 4')({foo:5})).to.equal(0);
    });

    it('evaluates in / not in expressions', function() {
        expect(compileExpression('5 in (1, 2, 3, 4)')()).to.equal(false);
        expect(compileExpression('3 in (1, 2, 3, 4)')()).to.equal(true);
        expect(compileExpression('5 not in (1, 2, 3, 4)')()).to.equal(true);
        expect(compileExpression('3 not in (1, 2, 3, 4)')()).to.equal(false);
    });

    it('evaluates string expressions', function() {
        expect(compileExpression('foo == "hello"')({foo:'hello'})).to.equal(1);
        expect(compileExpression('foo == "hello"')({foo:'bye'})).to.equal(0);
        expect(compileExpression('foo != "hello"')({foo:'hello'})).to.equal(0);
        expect(compileExpression('foo != "hello"')({foo:'bye'})).to.equal(1);
        expect(compileExpression('foo in ("aa", "bb")')({foo:'aa'})).to.equal(true);
        expect(compileExpression('foo in ("aa", "bb")')({foo:'c'})).to.equal(false);
        expect(compileExpression('foo not in ("aa", "bb")')({foo:'aa'})).to.equal(false);
        expect(compileExpression('foo not in ("aa", "bb")')({foo:'cc'})).to.equal(true);
    });

    it('evaluates has expressions', function() {
        var vars = { foo: { bar: 'baz' }, value: 'two', things: ['one', 'two', 'three'] };
        expect(compileExpression('things has "one"')(vars)).to.be.true;
        expect(compileExpression('foo has "bar"')(vars)).to.be.true;
        expect(compileExpression('not things has "one"')(vars)).to.equal(0);
        expect(compileExpression('things has "four"')(vars)).to.be.false;
        expect(compileExpression('not things has "four"')(vars)).to.equal(1);
        expect(compileExpression('things has value')(vars)).to.be.true;
        expect(compileExpression('"two" in ("one", value)')(vars)).to.be.true;
    });
    
    it('evaluates basic regexp match expressions', function() {
        expect(compileExpression('"xyz" match /z$/')()).to.be.true;
        expect(compileExpression('"xyz" ~ /^x/')()).to.be.true;
        expect(compileExpression('"xyz" match /y$/')()).to.be.false;
        expect(compileExpression('123 match /^[0-9]+/')()).to.be.true;
        expect(compileExpression('"abc" match /^[0-9]+/')()).to.be.false;
        expect(compileExpression('foo match /^bar/')({foo:'barz'})).to.be.true;
        expect(compileExpression('foo ~ /^bar/')({foo:'barz'})).to.be.true;
        expect(compileExpression('foo match /^bar/i')({foo:'BARZ'})).to.be.true;
        expect(compileExpression('not "xyz" match /y$/')()).to.equal(1);
        expect(compileExpression('("/path/to/file" match /^\\/path\\/to\\/f/) or ("xyz" ~ /^x/)')()).to.equal(1);
    });

    it('evaluates a ? b : c', function() {
        expect(compileExpression('1 > 2 ? 3 : 4')()).to.equal(4);
        expect(compileExpression('1 < 2 ? 3 : 4')()).to.equal(3);
    });

    it('evaluates complex expression', function() {
        var kitchenSink = compileExpression('4 > lowNumber * 2 and (max(a, b) < 20 or foo) ? 1.1 : 9.4');
        expect(kitchenSink({lowNumber:1.5, a:10, b:12, foo:false})).to.equal(1.1);
        expect(kitchenSink({lowNumber:3.5, a:10, b:12, foo:false})).to.equal(9.4);
    });

    it('evaluates symbols with dots', function() {
        expect(compileExpression('hello.world.foo')({'hello.world.foo': 123})).to.equal(123);
        expect(compileExpression('order.gooandstuff')({'order.gooandstuff': 123})).to.equal(123);
    });

    it('evaluates custom functions', function() {
        function triple(x) { return x * 3; };
        expect(compileExpression('triple(v)', {triple:triple})({v:7})).to.equal(21);
    });
    
    it('returns the raw function source', function() {
        expect(compileExpression('1 + 1', {}, true)).to.be.a.string;
    });
    
});
