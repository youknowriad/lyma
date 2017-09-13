import test from "ava";
import { render, diff, commit } from "../src/render";
import { h, withState } from "../src/element";

test.afterEach(() => {
  document.body.innerHTML = "";
});

test("should return an empty chunk for the same element", t => {
  const element = h("div", {}, "content");
  const mapping = render(element, document.body);
  const chunk = diff(element, mapping);
  t.is(chunk, undefined);
});

test("should return an replace chunk for two different elements", t => {
  const element = h("div", {}, "content");
  const mapping = render(false, document.body);
  const chunk = diff(element, mapping);
  t.deepEqual(chunk, { type: "replace", element, mapping });

  // commit
  commit(chunk);
  t.is(document.body.innerHTML, "<div>content</div>");
});

test("should return a string chunck if the strings are different", t => {
  const element = "content";
  const mapping = render(element, document.body);
  const chunk = diff("updated", mapping);
  t.deepEqual(chunk, { type: "string", element: "updated", mapping });

  // commit
  commit(chunk);
  t.is(document.body.innerHTML, "updated");
});

test("should return an array chunk if the arrays are different", t => {
  const element = ["a", "b", "c"];
  const mapping = render(element, document.body);
  const newElement = ["a", "d"];
  const chunk = diff(newElement, mapping);
  t.deepEqual(chunk, {
    type: "array",
    mapping,
    element: newElement,
    unset: [mapping.children[2].node],
    order: [
      {
        chunk: undefined,
        old: 0
      },
      {
        chunk: { type: "string", element: "d", mapping: mapping.children[1] },
        old: 1
      }
    ]
  });

  // commit
  commit(chunk);
  t.is(document.body.innerHTML, "ad");
});

test("should return an array chunk inserting a new element", t => {
  const element = ["a"];
  const mapping = render(element, document.body);
  const newElement = ["a", "b"];
  const chunk = diff(newElement, mapping);
  t.deepEqual(chunk, {
    type: "array",
    mapping,
    element: newElement,
    unset: [],
    order: [
      {
        chunk: undefined,
        old: 0
      },
      {
        element: "b"
      }
    ]
  });

  // commit
  commit(chunk);
  t.is(document.body.innerHTML, "ab");
});

test("should match reordered elements with keys", t => {
  const element1 = h("div", { key: 1 }, "1");
  const element2 = h("div", { key: 2 }, "2");
  const element = [element1, element2];
  const mapping = render(element, document.body);
  const newElement = [element2, element1];
  const chunk = diff(newElement, mapping);
  t.deepEqual(chunk, {
    type: "array",
    mapping,
    element: newElement,
    unset: [],
    order: [
      {
        chunk: undefined,
        old: 1
      },
      {
        chunk: undefined,
        old: 0
      }
    ]
  });

  // commit
  commit(chunk);
  t.is(document.body.innerHTML, "<div>2</div><div>1</div>");
});

test("should return a single chunck if the element children are different", t => {
  const element = h("div", {}, "content");
  const mapping = render(element, document.body);
  const newElement = h("div", {}, "updated");
  const chunk = diff(newElement, mapping);
  t.deepEqual(chunk, {
    type: "single",
    props: false,
    element: newElement,
    mapping,
    children: {
      type: "array",
      unset: [],
      mapping: mapping.children,
      element: ["updated"],
      order: [
        {
          chunk: {
            element: "updated",
            mapping: mapping.children.children[0],
            type: "string"
          },
          old: 0
        }
      ]
    }
  });

  // commit
  commit(chunk);
  t.is(document.body.innerHTML, "<div>updated</div>");
});

test("should return a function chunk", t => {
  const component = ({ content }) => content;
  const element = h(component, { content: "content" });
  const mapping = render(element, document.body);
  const newElement = h(component, { content: "updated" });
  const chunk = diff(newElement, mapping);
  t.deepEqual(chunk, {
    type: "function",
    element: newElement,
    mapping,
    content: {
      type: "string",
      element: "updated",
      mapping: mapping.content
    }
  });

  // commit
  commit(chunk);
  t.is(document.body.innerHTML, "updated");
});

test("should return a component chunk with updated props", t => {
  const component = withState(() => "state", () => "state")(
    ({ content }, state) => content + " " + state
  );
  const element = h(component, { content: "content" });
  const mapping = render(element, document.body);
  const newElement = h(component, { content: "updated" });
  const chunk = diff(newElement, mapping);
  t.deepEqual(chunk, {
    type: "component",
    element: newElement,
    mapping,
    content: {
      type: "string",
      element: "updated state",
      mapping: mapping.content
    }
  });

  // commit
  commit(chunk);
  t.is(document.body.innerHTML, "updated state");
});

test("should rerender when dispatching an action", t => {
  const component = withState(
    () => 0,
    (state, action) => (action === "increment" ? state + 1 : state)
  )((props, state) => "Counter: " + state);
  const element = h(component, {});
  const mapping = render(element, document.body);
  mapping.dispatch("increment");
  mapping.dispatch("nothing");
  mapping.dispatch("increment");
  t.is(document.body.innerHTML, "Counter: 2");
});

test("should rerender when a side effect dispatches an action", t => {
  const component = withState(
    () => 0,
    (state, action) => (action === "increment" ? state + 1 : state),
    (action, dispatch) => {
      if (action === "sideeffect") {
        dispatch("increment");
        dispatch("increment");
      }
    }
  )((props, state) => "Counter: " + state);
  const element = h(component, {});
  const mapping = render(element, document.body);
  mapping.dispatch("sideeffect");
  t.is(document.body.innerHTML, "Counter: 2");
});

test("should not do anything if the component is already unmounted", t => {
  const component = withState(
    () => 0,
    (state, action) => (action === "increment" ? state + 1 : state),
    (action, dispatch) => {
      if (action === "sideeffect") {
        dispatch("increment");
        dispatch("increment");
      }
    }
  )((props, state) => "Counter: " + state);
  const element = h(component, {});
  const mapping = render(element, document.body);
  mapping.isMounted = false;
  mapping.dispatch("sideeffect");
  t.is(document.body.innerHTML, "Counter: 0");
});
