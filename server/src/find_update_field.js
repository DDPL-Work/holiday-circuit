import fs from "fs";

const code = fs.readFileSync("c:/Users/DELL/OneDrive/Desktop/Holiday circuit/holiday-circuit/OPS/src/pages/opsPages/QuotationBuilder.jsx", "utf-8");
const lines = code.split("\n");

console.log("Searching for updateField definition:");
lines.forEach((line, idx) => {
  if (line.includes("const updateField") || line.includes("function updateField") || line.includes("updateServiceField")) {
    console.log(`L${idx + 1}: ${line}`);
  }
});
