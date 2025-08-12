import { FJ } from "@firejet/cli";

const config: FJ.FireJetConfig = {
  groups: {
    default: {
      components: {
        RecenzieDesktop: {
          defaultExport: true,
          path: "src/components/RecenzieDesktop.tsx",
          exportName: "RecenzieDesktop",
          structure: {
            type: "component",
            name: "RecenzieDesktop",
            children: [],
            props: {},
          },
        },
        KartaRecenzieMobil: {
          defaultExport: true,
          path: "src/components/KartaRecenzieMobil.tsx",
          exportName: "KartaRecenzieMobil",
          structure: {
            type: "component",
            name: "KartaRecenzieMobil",
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
