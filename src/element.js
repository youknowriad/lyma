import { castArray } from "./utils";

export function h(node, props, children) {
  const { children: childrenProp, ...remainingProps } = props || {};
  return {
    type: node,
    children:
      children !== undefined
        ? castArray(children)
        : childrenProp ? castArray(childrenProp) : [],
    props: remainingProps
  };
}

export const withState = (initial, reducer) => render => ({
  type: "component",
  initial,
  reducer,
  render
});
