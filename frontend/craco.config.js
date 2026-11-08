const path = require("path");

module.exports = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  jest: {
    configure: {
      moduleNameMapper: {
        // Same "@/..." alias as webpack.
        "^@/(.*)$": "<rootDir>/src/$1",
        // axios ships ESM by default, which CRA's Jest can't parse.
        "^axios$": "axios/dist/node/axios.cjs",
        // CRA's Jest 27 ignores package "exports" subpaths, which Radix uses.
        "^@radix-ui/primitive/is-development$":
          "<rootDir>/node_modules/@radix-ui/primitive/dist/internal/is-development.true.js",
      },
    },
  },
};
