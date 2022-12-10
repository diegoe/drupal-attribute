class AttributeValueBase {
  constructor(name, value) {
    this.name = name;
    this.value = value;
    this.renderEmptyAttribute = true;
  }

  render() {
    const valueString = this.toString();

    // PHP does `!empty(valueString)` to test for an empty `string`.
    // Javascript considers `""` (empty string) to be `false`, so this
    // works as a replacement.
    if ((this.value && this.renderEmptyAttribute) || valueString) {
      return `${this.name}="${valueString}"`;
    }
  }
  toString() {}
}

class AttributeArray extends AttributeValueBase {
  constructor(name, value) {
    super(name, Array.isArray(value) ? value : []);
    this.renderEmptyAttribute = false;
  }

  toString() {
    const unique = new Set(this.value.filter((v) => v));
    return Array.from(unique).join(" ");
  }
}

class AttributeBoolean extends AttributeValueBase {
  render() {
    return this.toString();
  }
  toString() {
    return this.value === false ? "" : this.name;
  }
}

class AttributeString extends AttributeValueBase {
  toString() {
    return this.value;
  }
}

const mergeDeepArray = (...args) => {
  const result = new Map();

  args.forEach((arg) => {
    Object.entries(arg).forEach(([k, v]) => {
      if (result.has(k) && Array.isArray(result.get(k)) && Array.isArray(v)) {
        result.set(k, result.get(k).concat(v));
      } else {
        result.set(k, v);
      }
    });
  });

  return result;
};

class DrupalAttribute extends Map {
  constructor(iterable) {
    super();

    let preMap;

    if (Array.isArray(iterable)) {
      // [key, value] pairs
      preMap = new Map(iterable);
    } else if (typeof iterable === "object" && iterable.constructor == Object) {
      // { key: value } object
      preMap = new Map(Object.entries(iterable));
    } else if (typeof iterable === "object" && iterable.constructor == Map) {
      // Map() object
      preMap = iterable;
    } else {
      preMap = new Map();
    }

    preMap.forEach((v, k) => this.setAttribute(k, v));
  }

  /*
   * get(key):
   * Extend `Map.prototype.get()` to return the internal `.value` of the
   * attribute object.
   *
   * This method is for compatibility when used in `Twing`, so users
   * don't have to write `.value` after every reference to a key.
   *
   * TwigPHP has the benefit of implicit string conversions calling
   * `__toString()` methods of the different `Attribute` classes. So,
   * comparisons like `attributes.name == "some-key"` convert the `name`
   * property to a string implicitly, calling `__toString()` which in
   * turn exposes `->value`. This is not working as expected in JS,
   * probably due to Twing internals, but we do not need this level of
   * compatibility anyway. Work around the issue by explicitly exposing
   * `.value` when `get()` happens.
   *
   * NOTE: If you want to modify the `Attribute` object contained in
   * `key`, you have to use `super.get()`.
   *
   * NOTE: We do `["method"]()` syntax to avoid highlighting noise in
   * editors that expect `get` to be in `get prop()` syntax.
   *
   * FIXME: Ideally we should do this just like PHP, and depend on
   * string cohersion (`toString()` calls).
   *
   * See:
   * - https://github.com/drupal/drupal/blob/9.5.x/core/lib/Drupal/Core/Template/TwigExtension.php#L538
   */
  ["get"](key) {
    const value = super.get(key);
    return value ? value.value : value;
  }

  addClass(...args) {
    const classes = args.flat().filter((x) => x);

    if (this.has("class") && super.get("class") instanceof AttributeArray) {
      super.get("class").value = [...new Set(this.get("class").concat(classes))];
    } else {
      this.setAttribute("class", classes);
    }

    return this;
  }

  removeClass(...args) {
    if (this.has("class") && super.get("class") instanceof AttributeArray) {
      const classes = args.flat();

      super.get("class").value = this.get("class").filter((v) => !classes.includes(v));
    }

    return this;
  }

  hasClass(value) {
    if (this.has("class") && super.get("class") instanceof AttributeArray) {
      return this.get("class").includes(value);
    } else {
      return false;
    }
  }

  setAttribute(key, value) {
    if (key == "class" && !Array.isArray(value)) {
      value = [value];
    }

    let newAttribute;

    if (Array.isArray(value)) {
      newAttribute = new AttributeArray(key, value);
    } else if (typeof value == "boolean") {
      newAttribute = new AttributeBoolean(key, value);
    } else {
      newAttribute = new AttributeString(key, value);
    }

    this.set(key, newAttribute);

    return this;
  }

  removeAttribute(key) {
    this.delete(key);

    return this;
  }

  // PHP array() is used here as JS' Object, with string keys
  toArray() {
    const array = {};
    this.forEach((v, k) => (array[k] = v.value));
    return array;
  }

  toString() {
    const builtString = Array.from(this.values(), (v) => v.render())
      .filter((x) => x)
      .join(" ");

    // Drupal expects these strings to be padded with a leading space,
    // so it can be used like `<element{{ attributes }}/>`. Empty
    // strings, however, should still be empty.
    return builtString ? " " + builtString : "";
  }

  merge(collection) {
    const merged = mergeDeepArray(this.toArray(), collection.toArray());

    merged.forEach((v, k) => {
      this.setAttribute(k, v);
    });

    return this;
  }
}

module.exports = DrupalAttribute;
