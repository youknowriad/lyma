import { castArray, isArray } from "./utils";

export function h(node, props, ...children) {
  const { children: childrenProp, ...remainingProps } = props || {};
  let flattendChildren = [];
  for (let i = 0; i < children.length; i++) {
    const nextChildren = isArray(children[i]) ? [children[i]] : children[i];
    flattendChildren = flattendChildren.concat(nextChildren);
  }
  return {
    type: node,
    children: flattendChildren.length
      ? flattendChildren
      : childrenProp ? castArray(childrenProp) : [],
    props: remainingProps
  };
}

export const withState = (initial, reducer, sideeffects) => render => ({
  type: "component",
  initial,
  reducer,
  render,
  sideeffects
});
