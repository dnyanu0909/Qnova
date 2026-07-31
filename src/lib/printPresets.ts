export interface PrintPreset {
  id: string;
  label: string;
  inches: [number, number];
  description: string;
}

export const printPresets: PrintPreset[] = [
  { id: "business", label: "Business Card", inches: [3.5, 2], description: "3.5 × 2 in @ 300 DPI" },
  { id: "tent", label: "Table Tent Sticker", inches: [4, 6], description: "4 × 6 in @ 300 DPI" },
  { id: "vector", label: "High-Res Vector", inches: [8, 8], description: "Scalable SVG / PDF" },
];

export const DPI = 300;