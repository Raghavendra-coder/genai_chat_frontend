import React from "react";
import ReactDOM from "react-dom/client";  // <-- Change import
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));  // <-- Use createRoot
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Debugging message
console.log("React App Mounted Successfully!");
