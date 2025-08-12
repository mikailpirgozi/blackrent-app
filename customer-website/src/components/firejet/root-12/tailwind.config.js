export default {
  content: ["./{src/**/,}*.{js,jsx,ts,tsx,html,svelte,vue}"],
  theme: {
    extend: {
      backgroundImage: {
        "fotka-oper-tora":
          "url(/assets/fotka-oper-tora.jpeg)",
      },
      fontFamily: {
        "sf-pro": '"SF Pro", ui-sans-serif, system-ui, sans-serif',
        poppins: "Poppins, ui-sans-serif, system-ui, sans-serif",
      },
    },
  },
  plugins: [],
  mode: "jit",
};
