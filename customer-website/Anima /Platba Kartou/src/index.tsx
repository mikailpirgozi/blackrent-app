import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ElementAlieSluby } from "./screens/ElementAlieSluby";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <ElementAlieSluby />
  </StrictMode>,
);
