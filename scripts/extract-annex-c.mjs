const response = await fetch(
  "https://raw.githubusercontent.com/manganite/wm2026/main/thirdPlaceAssignments.mjs"
);
const text = await response.text();
const start = text.indexOf("export const ANNEX_C_ROWS = [");
const end = text.indexOf("];", start);
const block = text.slice(start, end);
const rows = [...block.matchAll(/"([A-L]{8})"/g)].map((match) => match[1]);
console.log(JSON.stringify(rows, null, 2));
