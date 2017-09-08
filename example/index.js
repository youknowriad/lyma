import { render, h, withState } from "../src/index";

const component = withState(
  () => ({ text: "Lydia" }),
  (state, action) => {
    if (action === "toggle") {
      return state.text === "Lydia" ? { text: "Manil" } : { text: "Lydia" };
    }
    return state;
  }
)(({}, { text }, dispatch) =>
  h("div", {}, [
    h(
      "button",
      {
        onclick: () => {
          dispatch("toggle");
        }
      },
      "Toggle"
    ),
    h("div", {}, text)
  ])
);

render(h(component), document.body);
