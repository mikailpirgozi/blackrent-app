import { FJ } from "@firejet/cli";

const config: FJ.FireJetConfig = {
  groups: {
    default: {
      components: {
        FAQ: {
          defaultExport: true,
          path: "src/components/FAQ.tsx",
          exportName: "FAQ",
          structure: {
            type: "component",
            name: "FAQ",
            children: [],
            props: {},
          },
        },
        TFrame71Frame78Frame72Frame74Frame: {
          defaultExport: true,
          path: "src/components/TFrame71Frame78Frame72Frame74Frame.tsx",
          exportName: "TFrame71Frame78Frame72Frame74Frame",
          structure: {
            type: "component",
            name: "TFrame71Frame78Frame72Frame74Frame",
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
