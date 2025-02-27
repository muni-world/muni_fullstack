module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    browser: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: [
      "./packages/functions/tsconfig.json",
      "./packages/functions/tsconfig.dev.json",
      "./packages/web/tsconfig.json",
    ],
    sourceType: "module",
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: [
    "**/lib/**/*",
    "**/build/**/*",
    "**/generated/**/*",
    "**/.eslintrc.js",
    "**/node_modules/**",
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "valid-jsdoc": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "indent": ["error", 2],
    "max-len": ["error", {
      "code": 120,
      "ignoreComments": true,
      "ignoreTrailingComments": true,
      "ignoreUrls": true,
      "ignoreStrings": true,
      "ignoreTemplateLiterals": true,
      "ignoreRegExpLiterals": true,
    }],
    "require-jsdoc": "off",
    "react-hooks/exhaustive-deps": "warn",
  },
  overrides: [
    {
      files: ["packages/web/**/*"],
      extends: ["react-app", "react-app/jest"],
      env: {
        browser: true,
      },
    },
    {
      files: [".eslintrc.cjs"],
      parserOptions: {
        project: null,
      },
    },
  ],
};
