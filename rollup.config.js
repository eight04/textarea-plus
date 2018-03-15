import commonjs from "rollup-plugin-commonjs";

export default {
  input: "bundle.js",
  output: {
    file: "dist/textarea-plus.js",
    format: "iife",
    name: "textareaPlus"
  },
  plugins: [commonjs()]
};
