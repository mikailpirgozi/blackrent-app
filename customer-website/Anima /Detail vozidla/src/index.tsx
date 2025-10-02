import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ElementDetailVozidla } from "./screens/ElementDetailVozidla";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <ElementDetailVozidla />
  </StrictMode>,
);
