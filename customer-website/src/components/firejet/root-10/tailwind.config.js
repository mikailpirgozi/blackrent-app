export default {
  content: ["./{src/**/,}*.{js,jsx,ts,tsx,html,svelte,vue}"],
  theme: {
    extend: {
      fontFamily: { poppins: "Poppins, ui-sans-serif, system-ui, sans-serif" },
      backgroundImage: {
        background:
          "url(/assets/background.jpeg)",
        "background-":
          "url(/assets/background-8.jpeg)",
      },
    },
  },
  plugins: [],
  mode: "jit",
};
