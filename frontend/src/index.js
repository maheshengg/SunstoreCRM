import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress ResizeObserver loop errors (harmless warning from Radix UI)
const resizeObserverErrHandler = (e) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
    const resizeObserverErr = e;
    e.stopImmediatePropagation();
    return true;
  }
};

window.addEventListener('error', resizeObserverErrHandler);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
