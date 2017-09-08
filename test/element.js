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
