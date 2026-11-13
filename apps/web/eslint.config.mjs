import next from "eslint-config-next";
import nextTs from "eslint-config-next/typescript";

const config = [
  { ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts"] },
  ...next,
  ...nextTs,
  {
    rules: {
      // ADR-0004: the legacy CSS is served unchanged as static files (parity first, redesign later).
      "@next/next/no-css-tags": "off",
    },
  },
];
export default config;
