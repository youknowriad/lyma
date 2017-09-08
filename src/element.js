import { castArray } from "./utils";

export function h(node, props = {}, children = []) {
  return {
    type: node,
    children: castArray(children),
    props
  };
}

export const withState = (initial, reducer) => render => ({
  type: "component",
  initial,
  reducer,
  render
});
