// rollup.config.js
import resolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";

export default {
  input: "example/index.js",
  output: {
    file: "example/build/bundle.js",
    format: "iife"
  },
  plugins: [
    resolve(),
    babel({
      exclude: "node_modules/**",
      babelrc: false,
      presets: [
        [
          "env",
          {
            modules: false,
            targets: {
              browsers: [
                "last 2 Chrome versions",
                "last 2 Firefox versions",
                "last 2 Safari versions",
                "last 2 Edge versions",
                "last 2 Opera versions",
                "last 2 iOS versions",
                "last 1 Android version",
                "last 1 ChromeAndroid version",
                "ie 11",
                "> 1%"
              ]
            }
          }
        ]
      ],
      plugins: ["transform-object-rest-spread"]
    })
  ]
};
