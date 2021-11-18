import {terser} from 'rollup-plugin-terser';
import meta from 'userscript-meta-cli';

export default [
  {
    input: "index.mjs",
    output: {
      file: "dist/textarea-plus.js",
      format: "iife",
      name: "textareaPlus"
    },
    plugins: [
      terser()
    ]     
  },
  {
    input: "userscript.mjs",
    output: {
      file: "dist/textarea-plus.user.js",
      format: "es",
      banner: meta.stringify(meta.getMeta())
    }
  }
];

