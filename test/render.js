import test from "ava";
import { render } from "../src/render";
import { h } from "../src/element";

test.afterEach(() => {
  document.body.innerHTML = "";
});

test("should render nothing", t => {
  render(false, document.body);
  t.is(document.body.innerHTML, "");
});

test("should render a string", t => {
  render("content", document.body);
  t.is(document.body.innerHTML, "content");
});

test("should render a simple element", t => {
  const element = h("div", { className: "awesome" }, "content");
  render(element, document.body);
  t.is(document.body.innerHTML, '<div class="awesome">content</div>');
});

test("should render an array of elements", t => {
  const elements = [h("strong", {}, "awesome"), h("em", {}, "content")];
  render(elements, document.body);
  t.is(document.body.innerHTML, "<strong>awesome</strong><em>content</em>");
});
