import { render as renderElement } from "./render";
export { h, withState } from "./element";

export function render(element, node) {
  node.innerHTML = "";
  renderElement(element, node);
}
