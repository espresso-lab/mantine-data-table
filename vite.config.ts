import path from "path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import dts from "unplugin-dts/vite";

function tablerIconsResolve(): Plugin {
  return {
    name: "tabler-icons-resolve",
    enforce: "pre",
    async resolveId(id) {
      if (id === "@tabler/icons-react") return this.resolve("@tabler/icons-react/dist/esm/icons/index.mjs");
    },
  };
}

const collapseReplace = (code: string) => code.replace(/\{in:(\w+),/g, "{expanded:$1,");

function fixMantineDataTableCollapse(): Plugin {
  return {
    name: "fix-mantine-datatable-collapse",
    transform(code, id) {
      if (id.includes("mantine-datatable")) {
        return { code: collapseReplace(code), map: null };
      }
    },
    config: () => ({
      optimizeDeps: {
        rolldownOptions: {
          plugins: [
            {
              name: "fix-mantine-datatable-collapse-optimized",
              transform(code, id) {
                if (id.includes("mantine-datatable")) {
                  return { code: collapseReplace(code) };
                }
              },
            },
          ],
        },
      },
    }),
  };
}

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "MantineDataTable",
      fileName: (format) => `index.${format}.js`,
    },
    rolldownOptions: {
      external: [
        /^react(\/.*)?$/,
        /^react-dom(\/.*)?$/,
        /^@mantine\//,
        /^@tabler\/icons-react/,
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "@mantine/core": "MantineCore",
          "@mantine/form": "MantineForm",
          "@mantine/hooks": "MantineHooks",
          "@tabler/icons-react": "TablerIconsReact",
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  plugins: [
    react(),
    tablerIconsResolve(),
    fixMantineDataTableCollapse(),
    dts({ tsconfigPath: "./tsconfig.build.json" }),
  ],
});
