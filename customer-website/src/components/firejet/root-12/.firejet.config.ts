import { FJ } from "@firejet/cli";

const config: FJ.FireJetConfig = {
  groups: {
    default: {
      components: {
        RychlyKontakt1728New: {
          defaultExport: true,
          path: "src/components/RychlyKontakt1728New.tsx",
          exportName: "RychlyKontakt1728New",
          structure: {
            type: "component",
            name: "RychlyKontakt1728New",
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
