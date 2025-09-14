import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ElementPonukaVozidiel } from "./screens/ElementPonukaVozidiel";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <ElementPonukaVozidiel />
  </StrictMode>,
);
