import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.js"],
    setupFiles: ["dotenv/config"],
    testTimeout: 10000, // 10 seconds
    coverage: {
      provider: "v8",
      exclude: [
        "check-env.js",
        "vitest.config.js",
        "src/routes/**",
        "src/controllers/postController.js",
        "src/services/azureStorage.js",
        "src/util/parseAddress.js",
        "src/util/chatbotLogic.js",
      ],
      reporter: ["text", "html"],
    },
  },
});
