import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ElementAkovnStrnka } from "./screens/ElementAkovnStrnka";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <ElementAkovnStrnka />
  </StrictMode>,
);
