import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

// oxlint-disable-next-line import/no-default-export -- allow for framework
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      exclude: ["node_modules/", "configs/test-setup.ts"],
      provider: "v8",
      reporter: ["json", "html"],
    },
    environment: "node",
    globals: true,
    hookTimeout: 60_000,
    include: ["src/**/*.test.ts", "configs/**/*.test.ts"],
    setupFiles: ["./configs/test-setup.ts"],
  },
})
