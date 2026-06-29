import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)", "../stories/**/*.stories.@(ts|tsx)"],
  staticDirs: ["../../../apps/customer/public"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  viteFinal: (config) => ({
    ...config,
    build: {
      ...config.build,
      chunkSizeWarningLimit: 1500,
    },
  }),
};

export default config;
