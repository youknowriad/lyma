const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;

export function applyProp(node, prop, old, value) {
  // the key prop is not meant to be applied
  if (prop === "key") {
    return;
  }

  // if the ref callback change, unset the old one and trigger the new ref call
  if (prop === "ref") {
    if (old) old(null);
    if (value) value(node);
    return;
  }

  // Do not handle the "class" prop for now
  if (prop === "className") {
    node.className = value || "";
    return;
  }

  // Only handle object style prop
  if (prop === "style") {
    if (!value) node.style.cssText = "";
    else {
      if (old) {
        for (let i in old) if (!(i in value)) node.style[i] = "";
      }
      for (let i in value) {
        node.style[i] =
          typeof value[i] === "number" && IS_NON_DIMENSIONAL.test(i) === false
            ? value[i] + "px"
            : value[i];
      }
    }
    return;
  }

  if (prop === "dangerouslySetInnerHTML") {
    if (value) node.innerHTML = value.__html || "";
    return;
  }

  // Use an event proxy to avoid memory issues
  if (prop[0] === "o" && prop[1] === "n") {
    const useCapture = prop !== (prop = prop.replace(/Capture$/, ""));
    const eventName = prop.toLowerCase().substring(2);
    if (value) {
      if (!old) node.addEventListener(eventName, eventProxy, useCapture);
    } else {
      node.removeEventListener(eventName, eventProxy, useCapture);
    }
    (node._listeners || (node._listeners = {}))[eventName] = value;
    return;
  }

  // Node props
  if (prop !== "list" && prop !== "type" && prop in node) {
    setProperty(node, prop, value == null ? "" : value);
    if (value == null || value === false) node.removeAttribute(prop);
    return;
  }

  // Attributes
  if (value == null || value === false) {
    node.removeAttribute(prop);
  } else if (typeof value !== "function") {
    node.setAttribute(prop, value);
  }
}

function setProperty(node, name, value) {
  try {
    node[name] = value;
  } catch (e) {}
}

function eventProxy(e) {
  return this._listeners[e.type](e);
}
