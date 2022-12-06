const tap = require('tap');
const DrupalAttributes = require('../src');

tap.test('toString', function(test) {
  test.plan(3);

  test.test('should return an empty string when no attribute has been set', function (test) {
    let attribute = new DrupalAttributes();

    test.equal(attribute.toString(), '');
    test.end();
  });

  test.test('should return a valid HTML attribute string when at least one attribute has been set', function (test) {
    let attribute = new DrupalAttributes();

    attribute
      .setAttribute('foo', 'bar')
      .setAttribute('bar', 'foo')
      .setAttribute('foo-bar', ['foo', 'bar'])
    ;

    test.equal(attribute.toString(), ' foo="bar" bar="foo" foo-bar="foo bar"');
    test.end();
  });

  test.test('should have properties cohersed to strings in comparisons', function (test) {
    let attribute = new DrupalAttributes({ 'name': 'Drupal' });

    test.ok(attribute.get("name") == 'Drupal');
    test.end();
  });
});
