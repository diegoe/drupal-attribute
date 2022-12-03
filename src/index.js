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

class DrupalAttribute extends Map {
  constructor(it) {
    super();
    it.forEach((v, k) => this.setAttribute(k, v));
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

  toString() {
    return Array.from(this.values(), (v) => v.render())
      .filter((x) => x)
      .join(" ");
  }
}

module.exports = DrupalAttribute;
