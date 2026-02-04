import React from "react";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { App } from "./App";
import "@/styles/globals.css";

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </React.StrictMode>
  );
}
