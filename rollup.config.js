import cjs from "rollup-plugin-cjs-es";

export default {
  input: "index.js",
  output: {
    file: "dist/textarea-plus.js",
    format: "iife",
    name: "textareaPlus"
  },
  plugins: [cjs({cache: false})]
};
