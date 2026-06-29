import type { Preview } from "@storybook/react-vite";

import "../../../apps/customer/src/styles.css";
import "./storybook.css";

const preview: Preview = {
  parameters: {
    a11y: {
      test: "todo",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "App",
      values: [
        { name: "App", value: "var(--daema-color-background-canvas)" },
        { name: "Surface", value: "var(--daema-color-background-surface)" },
        { name: "Dark", value: "#111827" },
      ],
    },
  },
};

export default preview;
