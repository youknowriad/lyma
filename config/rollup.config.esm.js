import config from "./rollup.config";

// ES output
config.output.format = "es";
config.output.file = "dist/lyma.esm.js";

export default config;
