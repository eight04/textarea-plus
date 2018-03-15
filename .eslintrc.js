module.exports = {
	env: {
		es6: true
	},
	rules: {
		"no-use-before-define": [2, "nofunc"],
    "operator-linebreak": [2, "after"]
	},
	extends: "eslint:recommended",
  overrides: [{
    files: ["bundle.js", "rollup.config.js"],
    parserOptions: {
      sourceType: "module"
    }
  }]
};
