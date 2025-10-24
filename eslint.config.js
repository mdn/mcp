import path from "node:path";
import { fileURLToPath } from "node:url";

import { includeIgnoreFile } from "@eslint/compat";
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import prettierConfig from "eslint-config-prettier/flat";
import importPlugin from "eslint-plugin-import";
import jsdoc from "eslint-plugin-jsdoc";
import n from "eslint-plugin-n";
import unicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default defineConfig([
  includeIgnoreFile(gitignorePath),
  jsdoc.configs["flat/recommended"],
  n.configs["flat/recommended"],
  unicorn.configs["recommended"],
  { files: ["**/*.{js,mjs,cjs}"] },
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": false,
        },
      ],
    },
  },
  {
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "jsdoc/no-undefined-types": "off",
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/require-returns-description": "off",
      "jsdoc/require-returns-type": "off",
      "jsdoc/tag-lines": "off",
      "jsdoc/check-tag-names": [
        "error",
        { definedTags: ["element", "attr", "slot"] },
      ],
      "n/no-missing-import": "off",
      "n/no-unsupported-features/node-builtins": ["off"],
      "n/no-unpublished-import": "off",
      "unicorn/no-array-reverse": "off",
      "unicorn/no-array-sort": "off",
      "unicorn/no-array-callback-reference": "off",
      "unicorn/no-null": ["off"],
      "unicorn/prevent-abbreviations": ["off"],
      "unicorn/switch-case-braces": "off",
      "unicorn/template-indent": ["off"],
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { import: importPlugin },
    rules: {
      "sort-imports": "off",
      "import/order": [
        "error",
        {
          alphabetize: {
            order: "asc",
          },
          named: true,
          "newlines-between": "always-and-inside-groups",
        },
      ],
    },
  },
  prettierConfig,
]);
