import { FJ } from "@firejet/cli";

const config: FJ.FireJetConfig = {
  groups: {
    default: {
      components: {
        Frame: {
          defaultExport: true,
          path: "src/components/Frame.tsx",
          exportName: "Frame",
          structure: {
            type: "component",
            name: "Frame",
            children: [],
            props: {},
          },
        },
      },
      globalCss: ["./styles.css"],
      postcssPath: "./postcss.config.js",
    },
  },
};

export default config;
