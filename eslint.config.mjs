import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
	globalIgnores([
		".next/**",
		"out/**",
		"build/**",
		"next-env.d.ts",
	]),
	{
		files: ["**/*.{js,jsx,mjs,ts,tsx}"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
				ecmaVersion: "latest",
				sourceType: "module",
			},
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		plugins: {
			"@next/next": nextPlugin,
			import: importPlugin,
			"jsx-a11y": jsxA11y,
			"react-hooks": reactHooks,
		},
		rules: {
			...nextPlugin.configs.recommended.rules,
			...nextPlugin.configs["core-web-vitals"].rules,
			...reactHooks.configs.recommended.rules,
			...jsxA11y.configs.recommended.rules,
		},
		settings: {
			next: {
				rootDir: ".",
			},
		},
	},
]);

export default eslintConfig;
