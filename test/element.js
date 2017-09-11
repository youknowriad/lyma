import test from "ava";
import { h } from "../src/element";

test("should return a simple element", t => {
  const element = h("div", { className: "awesome" }, "content");
  t.deepEqual(element, {
    type: "div",
    props: { className: "awesome" },
    children: ["content"]
  });
});

test("should allow passing the children as a prop", t => {
  const element = h("div", { className: "awesome", children: "content" });
  t.deepEqual(element, {
    type: "div",
    props: { className: "awesome" },
    children: ["content"]
  });
});
