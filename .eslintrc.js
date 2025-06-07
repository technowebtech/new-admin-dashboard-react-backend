module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ["eslint:recommended", "prettier"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error",
  },
}
