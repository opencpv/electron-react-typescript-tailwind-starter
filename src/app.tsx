import React from "react";
import * as ReactDOM from "react-dom/client";
import ReverseVendingMachine from "./rvm";

const App = () => <ReverseVendingMachine />;

function render() {
  const root = ReactDOM.createRoot(document.getElementById("app"));
  root.render(<App />);
}

render();
