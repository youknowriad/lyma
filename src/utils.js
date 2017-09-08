export function isArray(value) {
  return Array.isArray(value);
}

export function isString(value) {
  return typeof value === "string" || value instanceof String;
}

export function isFunction(value) {
  return typeof value === "function";
}

export function isEmptyOrBoolean(value) {
  return (
    value === undefined || value === null || value === true || value === false
  );
}

export function castArray(value) {
  return isArray(value) ? value : [value];
}

export function range(start, end) {
  const array = [];
  for (let i = start; i < end; i++) {
    array.push(i);
  }
  return array;
}
