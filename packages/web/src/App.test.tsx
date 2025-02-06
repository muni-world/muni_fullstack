import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders hello world message", () => {
  render(<App />);
  const headingElement = screen.getByText(/hello muni world/i);
  expect(headingElement).toBeInTheDocument();
}); 