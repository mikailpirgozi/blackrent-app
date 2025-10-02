import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ElementPlatbaKartou } from "./screens/ElementPlatbaKartou";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <ElementPlatbaKartou />
  </StrictMode>,
);
