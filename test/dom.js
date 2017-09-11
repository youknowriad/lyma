import test from "ava";
import { applyProp } from "../src/dom";

test("should apply/remove a class name to a node", t => {
  const div = document.createElement("div");
  applyProp(div, "className", undefined, "awesome");
  t.is(div.className, "awesome");
  applyProp(div, "className", "awesome", null);
  t.is(div.className, "");
});

test("should set/unset the node reference", t => {
  const div = document.createElement("div");
  let ref1, ref2;
  const setRef1 = ref => (ref1 = ref);
  const setRef2 = ref => (ref2 = ref);
  applyProp(div, "ref", undefined, setRef1);
  t.is(ref1, div);
  applyProp(div, "ref", setRef1, setRef2);
  t.is(ref1, null);
  t.is(ref2, div);
});

test("should set/unset styles", t => {
  const div = document.createElement("div");
  const style1 = { margin: 2, zIndex: 10 };
  applyProp(div, "style", undefined, style1);
  t.is(div.style.cssText, "margin: 2px; z-index: 10;");
  const style2 = { margin: 3, padding: "4px" };
  applyProp(div, "style", style1, style2);
  t.is(div.style.cssText, "margin: 3px; padding: 4px;");
  applyProp(div, "style", style2, false);
  t.is(div.style.cssText, "");
});

test("should set inner HTML", t => {
  const div = document.createElement("div");
  const propValue = { __html: "<strong>awesome</strong>" };
  applyProp(div, "dangerouslySetInnerHTML", undefined, propValue);
  t.is(div.innerHTML, "<strong>awesome</strong>");
});

test("should set/unset event handlers", t => {
  const div = document.createElement("div");
  const style1 = { margin: 2, zIndex: 10 };
  let currentEvent;
  const onBlah = event => (currentEvent = event);
  applyProp(div, "onBlah", undefined, onBlah);
  const e = new CustomEvent("blah", { awesome: "event" });
  div.dispatchEvent(e);
  t.is(currentEvent, e);
  applyProp(div, "onBlah", onBlah, undefined);
  const e2 = new CustomEvent("blah", { awesome: "event2" });
  div.dispatchEvent(e2);
  t.is(currentEvent, e);
});

test("should set/unset properties", t => {
  const button = document.createElement("button");
  let currentEvent;
  const onBlah = event => (currentEvent = event);
  applyProp(button, "disabled", undefined, true);
  t.is(button.disabled, true);
  applyProp(button, "disabled", true, undefined);
  t.is(button.disabled, false);
});

test("should set/unset attributes", t => {
  const button = document.createElement("button");
  let currentEvent;
  const onBlah = event => (currentEvent = event);
  applyProp(button, "aria-label", undefined, "awesome");
  t.is(button.getAttribute("aria-label"), "awesome");
  applyProp(button, "aria-label", "awesome", undefined);
  t.is(button.getAttribute("aria-label"), null);
});
