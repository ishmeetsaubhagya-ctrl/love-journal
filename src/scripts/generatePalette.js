// A set of base color families used to generate a unique
// envelope palette for each letter based on its id, title, and date.
// Same code as lettersPage.js so that the same color is applied on both
// main page and the envelope opening animation.
const paletteFamilies = [
  { hue: 18, sat: 54, light: 88, sealHue: 345, sealSat: 76, sealLight: 42 },
  { hue: 26, sat: 48, light: 86, sealHue: 12, sealSat: 72, sealLight: 38 },
  { hue: 4, sat: 50, light: 84, sealHue: 5, sealSat: 78, sealLight: 34 },
  { hue: 38, sat: 42, light: 90, sealHue: 24, sealSat: 66, sealLight: 36 },
  { hue: 8, sat: 58, light: 86, sealHue: 6, sealSat: 82, sealLight: 30 },
  { hue: 12, sat: 50, light: 88, sealHue: 11, sealSat: 74, sealLight: 33 },
  { hue: 22, sat: 46, light: 92, sealHue: 20, sealSat: 68, sealLight: 40 },
  { hue: 16, sat: 60, light: 84, sealHue: 5, sealSat: 86, sealLight: 32 },
  { hue: 28, sat: 52, light: 90, sealHue: 15, sealSat: 70, sealLight: 38 },
  { hue: 14, sat: 44, light: 88, sealHue: 8, sealSat: 80, sealLight: 36 }
];

// Simple hash function to determine which color palette to use on the envelope.
function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Keeps color value within a set range.
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Build a deterministic palette based on the letter's identity.
// The base hash selects one of the palette families, while the variant
// arrays add subtle shifts to keep similar letters visually distinct.
export default function generatePalette(letter) {
  const baseHash = hashString(`${letter.id}|${letter.title}|${letter.date}`);
  const family = paletteFamilies[baseHash % paletteFamilies.length];
  const variant = Math.floor(baseHash / paletteFamilies.length) % 7;
  const hueShift = [0, 14, -12, 20, -18, 26, -22][variant];
  const satShift = [0, 8, -6, 12, -10, 14, -8][variant];
  const lightShift = [0, -8, 8, -5, 6, -10, 10][variant];
  const envelope = `hsl(${clamp(family.hue + hueShift, 0, 360)}, ${clamp(family.sat + satShift, 42, 72)}%, ${clamp(family.light + lightShift, 78, 92)}%)`;
  const flap = `hsl(${clamp(family.hue + hueShift + 2, 0, 360)}, ${clamp(family.sat + satShift + 8, 50, 82)}%, ${clamp(family.light - 18 + lightShift, 60, 76)}%)`;
  const shadow = `hsl(${clamp(family.hue + hueShift + 8, 0, 360)}, ${clamp(family.sat + satShift - 12, 30, 58)}%, ${clamp(family.light - 36 + lightShift, 42, 58)}%)`;
  const base = `hsl(${clamp(family.hue + hueShift + 8, 0, 360)}, ${clamp(family.sat + satShift - 10, 30, 58)}%, ${clamp(family.light - 30 + lightShift, 44, 62)}%)`;
  const seal = `hsl(${clamp(family.sealHue + hueShift, 0, 360)}, ${clamp(family.sealSat + satShift, 68, 92)}%, ${clamp(family.sealLight + lightShift * 0.8, 28, 46)}%)`;
  const text = `hsl(${family.hue}, 22%, 18%)`;

  return { envelope, flap, shadow, base, seal, text };
}