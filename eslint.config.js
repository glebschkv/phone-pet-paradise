import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "src/test/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          // Allow hooks (useXxx) and provider functions to be exported alongside components
          // This is a common pattern in React codebases for context providers and utility hooks
          allowExportNames: [
            "useOffline",
            "useIsOnline",
            "useHasPendingSync",
            "useSyncStatus",
            "useRenderCount",
            "useWhyDidYouRender",
          ],
        },
      ],
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
);
