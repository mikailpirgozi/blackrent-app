export default {
  content: ["./{src/**/,}*.{js,jsx,ts,tsx,html,svelte,vue}"],
  theme: {
    extend: {
      fontFamily: { poppins: "Poppins, ui-sans-serif, system-ui, sans-serif" },
    },
  },
  plugins: [],
  mode: "jit",
};
