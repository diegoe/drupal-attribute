const tap = require('tap');
const DrupalAttribute = require('../src');

tap.test('constructor', function (test) {
  test.plan(4);

  test.test('should support being passed no parameter', function (test) {
    let attribute = new DrupalAttribute();

    test.ok(attribute);
    test.end();
  });

  test.test('should support being passed an object', function (test) {
    let attribute = new DrupalAttribute({
      'foo': 'bar',
      'bar': 'foo',
    });

    test.equal(attribute.get('foo'), 'bar');
    test.equal(attribute.get('bar'), 'foo');
    test.end();
  });

  test.test('should support being passed an iterable', function (test) {
    let attribute = new DrupalAttribute([
      ['foo', 'bar'],
      ['bar', 'foo']
    ]);

    test.equal(attribute.get('foo'), 'bar');
    test.equal(attribute.get('bar'), 'foo');
    test.end();
  });

  test.test('should support being passed a map', function (test) {
    const map = new Map([
      ['foo', 'bar'],
      ['bar', 'foo']
    ]);
    let attribute = new DrupalAttribute(map);

    test.equal(attribute.get('foo'), 'bar');
    test.equal(attribute.get('bar'), 'foo');
    test.end();
  });
});
