import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Portfolio components are migrated verbatim from the original Vite app —
    // relax rules their pre-existing patterns trip, rather than rewriting them.
    files: ["src/features/portfolio/**"],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/set-state-in-effect": "off",
      "no-unused-vars": "off",
      "jsx-a11y/alt-text": "off",
    },
  },
]);

export default eslintConfig;
