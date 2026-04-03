import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Importa as configurações do Next.js usando o compat
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Suas configurações personalizadas e ignores
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "node_modules/**",
    ],
  },

  // Exemplo de como adicionar regras personalizadas se precisar:
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-explicit-any": "off", // Silencia o erro de 'any'
      "@typescript-eslint/no-unused-vars": "warn", // Deixa apenas como aviso
      "react-hooks/exhaustive-deps": "off", // Silencia avisos de dependência de useEffect
      "@next/next/no-img-element": "off", // Permite usar <img> em vez de <Image /> (por enquanto)
    },
  },
];

export default eslintConfig;
