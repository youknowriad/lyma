import {
  range,
  isEmptyOrBoolean,
  isArray,
  isString,
  isFunction
} from "./utils";
import { applyProp } from "./dom";

function getMappingType(element) {
  if (isEmptyOrBoolean(element)) {
    return "none";
  }
  if (isArray(element)) {
    return "array";
  }
  if (isString(element)) {
    return "string";
  }
  if (isString(element.type)) {
    return "single";
  }
  if (isFunction(element.type)) {
    return "function";
  }
  if (element && element.type && element.type.type === "component") {
    return "component";
  }

  throw "Error: Invalid element ".element;
}

export function diff(element, mapping) {
  const mappingType = getMappingType(element);

  if (mappingType !== mapping.type) {
    return { type: "replace", mapping, element };
  }

  switch (mappingType) {
    case "none":
      return;
    case "string":
      if (element !== mapping.element) {
        return { type: "string", mapping, element };
      }
      return;
    case "array": {
      if (element === mapping.element) {
        return;
      }

      function keyedChildren(children) {
        const keyed = {};
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const key =
            child && child.props && child.props.key !== undefined
              ? child.props.key
              : i;
          keyed[key] = { index: i, child };
        }
        return keyed;
      }
      const keyedPreviousChildren = keyedChildren(mapping.element);
      const keyedNextChildren = keyedChildren(element);

      let removedChildren = [];
      const order = [];
      for (let i = 0; i < element.length; i++) {
        const child = element[i];
        const key =
          child && child.props && child.props.key !== undefined
            ? child.props.key
            : i;
        const previous = keyedPreviousChildren[key];
        if (previous) {
          const previousMapping = mapping.children[previous.index];
          order.push({
            chunk: diff(child, previousMapping),
            old: previous.index
          });
        } else {
          order.push({ element: child });
        }
      }

      let unset = [];
      for (let key in keyedPreviousChildren) {
        const next = keyedNextChildren[key];
        const previous = keyedPreviousChildren[key];
        if (!next) {
          const previousMapping = mapping.children[previous.index];
          unset = unset.concat(previousMapping.nodes);
        }
      }

      return {
        type: "array",
        order,
        unset,
        mapping,
        element
      };
    }
    case "single": {
      function diffProps(previousProps, nextProps) {
        if (previousProps === nextProps) {
          return false;
        }
        const unset = [];
        for (let prop in previousProps) {
          if (!nextProps[prop]) {
            unset.push(prop);
          }
        }

        const set = [];
        for (let prop in nextProps) {
          if (!previousProps[prop] || previousProps[prop] !== nextProps[prop]) {
            set.push({
              prop,
              value: nextProps[prop],
              old: previousProps[prop]
            });
          }
        }

        return set.length || unset.length ? { set, unset } : false;
      }
      if (
        mapping.element.props !== element.props ||
        mapping.element.children !== element.children
      ) {
        return {
          type: "single",
          props: diffProps(mapping.element.props, element.props),
          children: diff(element.children, mapping.children),
          element,
          mapping
        };
      }
      return;
    }
    case "function": {
      if (
        mapping.element.props !== element.props ||
        mapping.element.children !== element.children ||
        mapping.element.type !== element.type
      ) {
        const subElement = element.type({
          ...element.props,
          children: element.children
        });
        return {
          type: "function",
          mapping,
          element,
          content: diff(subElement, mapping.content)
        };
      }
      return;
    }
    case "component": {
      const { type, props, children } = element;
      let state = mapping.state;
      if (mapping.element.type !== type) {
        return { type: "replace", mapping, element };
      }
      if (
        mapping.element.props !== element.props ||
        mapping.element.children !== element.children ||
        mapping.previousState !== mapping.state
      ) {
        const ownProps = { ...props, children };
        const subElement = type.render(
          ownProps,
          mapping.state,
          mapping.dispatch
        );
        return {
          type: "component",
          mapping,
          element,
          content: diff(subElement, mapping.content)
        };
      }
      return;
    }
  }
}

export function commit(chunk) {
  switch (chunk.type) {
    case "replace": {
      const { mapping, element } = chunk;
      removeNodes(mapping.parent.childNodes, mapping.index, mapping.next);
      unmountComponents(mapping);
      return render(element, mapping.parent, mapping.index);
    }
    case "string": {
      const { mapping, element } = chunk;
      mapping.node.nodeValue = element;
      return {
        ...mapping,
        element
      };
    }
    case "single": {
      const { props, children, element, mapping } = chunk;
      if (props && props.unset) {
        props.unset.forEach(unset => {
          delete mapping.node[unset];
        });
      }
      if (props && props.set) {
        props.set.forEach(set => {
          applyProp(mapping.node, set.prop, set.old, set.value);
        });
      }
      let newChildren = mapping.children;
      if (children) {
        newChildren = commit(children);
      }

      return {
        ...mapping,
        element,
        children: newChildren
      };
    }
    case "array": {
      const { order, unset, mapping, element } = chunk;
      let offset = 0;
      const children = [];
      let newNodes = [];
      order.forEach(({ chunk, element, old }, index) => {
        let subMapping;
        if (old === undefined) {
          subMapping = render(element, mapping.parent, offset);
        } else {
          if (chunk) {
            subMapping = commit(chunk);
          } else {
            subMapping = mapping.children[old];
          }
          if (offset !== subMapping.startIndex) {
            const nodes = subMapping.nodes;
            nodes.forEach((node, i) => {
              insertNodeAtPosition(mapping.parent, node, offset);
            });
            transposeMapping(subMapping, offset);
          }
        }
        offset += subMapping.next - subMapping.index;
        children.push(subMapping);
        newNodes = newNodes.concat(subMapping.nodes);
      });
      unset.forEach(node => {
        node.remove();
      });

      return {
        ...mapping,
        next: offset,
        nodes: newNodes,
        children,
        element
      };
    }
    case "function": {
      const contentMapping = commit(chunk.content);
      return {
        ...chunk.mapping,
        next: contentMapping.next,
        nodes: contentMapping.nodes,
        content: contentMapping,
        element: chunk.element
      };
    }
    case "component": {
      const contentMapping = commit(chunk.content);
      return {
        ...chunk.mapping,
        next: contentMapping.next,
        nodes: contentMapping.nodes,
        content: contentMapping,
        previousState: chunk.mapping.state,
        element: chunk.element
      };
    }
  }
}

function transposeMapping(mapping, offset) {
  mapping = {
    ...mapping,
    index: offset,
    next: mapping.next - mapping.index + offset
  };
  if (mapping.type === "array") {
    let current = offset;
    mapping.children.forEach(subMapping => {
      transposeMapping(subMapping, current);
      current = subMapping.next;
    });
  }
}

function removeNodes(nodeList, start, next) {
  const nodesToRemove = [];
  for (let i = start; i < next; i++) {
    nodesToRemove.push(nodeList[i]);
  }
  nodesToRemove.forEach(subnode => {
    subnode.remove();
  });
}

export function unmountComponents(mapping) {
  switch (mapping.type) {
    case "none":
      return;
    case "array":
      for (let i in mapping.children) {
        unmountComponents(mapping[i]);
      }
      return;
    case "string":
      return;
    case "single":
      unmountComponents(mapping.children);
      return;
    case "function":
      unmountComponents(mapping.content);
      return;
    case "component":
      // Dispatch mount event
      mapping.isMounted = false;
      mapping.dispatch({ type: "UNMOUNT", nodes: subMapping.nodes });
      unmountComponents(mapping.content);
      return;
  }
}

export function render(element, parent, startIndex = 0) {
  const mappingType = getMappingType(element);

  switch (mappingType) {
    case "none":
      return {
        type: mappingType,
        index: startIndex,
        next: startIndex,
        parent,
        nodes: []
      };
    case "array":
      const mapping = {};
      let nextIndex = startIndex;
      let nodes = [];
      element.forEach((subElement, i) => {
        const subMapping = render(subElement, parent, nextIndex);
        nodes = nodes.concat(subMapping.nodes);
        nextIndex = subMapping.next;
        mapping[i] = subMapping;
      });
      return {
        type: mappingType,
        index: startIndex,
        children: mapping,
        next: nextIndex,
        nodes,
        element,
        parent
      };
    case "string": {
      const { type, props, children } = element;
      const node = document.createTextNode(element);
      insertNodeAtPosition(parent, node, startIndex);
      return {
        type: mappingType,
        index: startIndex,
        next: startIndex + 1,
        element,
        parent,
        node,
        nodes: [node]
      };
    }
    case "single": {
      const { type, props, children } = element;
      const node = document.createElement(type);
      for (let prop in props) {
        applyProp(node, prop, undefined, props[prop]);
      }
      const subMapping = render(children, node);
      insertNodeAtPosition(parent, node, startIndex);
      return {
        type: mappingType,
        index: startIndex,
        children: subMapping,
        next: startIndex + 1,
        element,
        parent,
        node,
        nodes: [node]
      };
    }
    case "function": {
      const { type, props, children } = element;
      const returnedElement = type({ ...props, children });
      const subMapping = render(returnedElement, parent);
      return {
        type: mappingType,
        index: subMapping.index,
        content: subMapping,
        next: subMapping.next,
        element,
        parent,
        nodes: subMapping.nodes
      };
    }
    case "component": {
      const { type, props, children } = element;
      const ownProps = { ...props, children };
      const initialState = type.initial ? type.initial(ownProps) : undefined;
      const mapping = {
        type: mappingType,
        state: initialState,
        previousState: initialState,
        dispatch(action) {
          // Trigger side effects
          if (type.sideeffects) {
            const abort = type.sideeffects(
              action,
              mapping.dispatch,
              mapping.state
            );
            if (abort === false) {
              return;
            }
          }

          // No rerendering if the component is unmounted
          if (!mapping.isMounted) {
            return;
          }

          // Updating the state (reducer)
          mapping.state = type.reducer(mapping.state, action);
          if (mapping.state === mapping.previousState) {
            return;
          }
          const ownProps = {
            props: mapping.element.props,
            children: mapping.element.children
          };
          const newElement = type.render(
            ownProps,
            mapping.state,
            mapping.dispatch
          );
          const chunk = diff(newElement, mapping.content);
          if (chunk) {
            const newMapping = commit(chunk);
            mapping.content = newMapping;
            mapping.nodes = newMapping.nodes;
            mapping.index = newMapping.index;
            mapping.next = newMapping.next;
          }
        },
        parent,
        element
      };

      // Render component
      const subMapping = render(
        type.render(ownProps, mapping.state, mapping.dispatch),
        parent
      );

      mapping.content = subMapping;
      mapping.index = subMapping.index;
      mapping.next = subMapping.next;
      mapping.nodes = subMapping.nodes;
      mapping.isMounted = true;

      // Dispatch mount event
      mapping.dispatch({ type: "MOUNT", nodes: subMapping.nodes });

      return mapping;
    }
  }
}

function insertNodeAtPosition(parent, node, index) {
  const nodeAtInsertPosition = parent[index];
  if (nodeAtInsertPosition) {
    parent.insertBefore(node, nodeAtInsertPosition);
  } else {
    parent.appendChild(node);
  }
}
