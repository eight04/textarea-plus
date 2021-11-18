import iife from 'rollup-plugin-iife';

export default {
  input: "index.mjs",
  output: {
    file: "dist/textarea-plus.js",
    format: "es",
    name: "textareaPlus"
  },
  plugins: [
    iife() 
  ]     
};
