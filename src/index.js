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
  constructor(it) {
    super();
    it && it.forEach((v, k) => this.setAttribute(k, v));
  }

  addClass(...args) {
    const classes = args.flat();

    if (this.has("class") && this.get("class") instanceof AttributeArray) {
      this.get("class").value = [...this.get("class").value, ...classes];
    } else {
      this.setAttribute("class", classes);
    }

    return this;
  }

  removeClass(...args) {
    if (this.has("class") && this.get("class") instanceof AttributeArray) {
      const classes = args.flat();

      this.get("class").value = this.get("class").value.filter((v) => !classes.includes(v));
    }

    return this;
  }

  hasClass(value) {
    if (this.has("class") && this.get("class") instanceof AttributeArray) {
      return this.get("class").value.contains(value);
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
    return Array.from(this.values(), (v) => v.render())
      .filter((x) => x)
      .join(" ");
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
