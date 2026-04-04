/**
 * colleges.js
 * Shared mapping of UCSD college names to their logo image paths.
 * Used by the SignUpPage college selector and the ListingModal college badge.
 */

export const COLLEGES = [
  { name: "Revelle",   logo: "/Revelle.png" },
  { name: "Muir",      logo: "/Muir.png" },
  { name: "Marshall",  logo: "/Marshall.png" },
  { name: "Warren",    logo: "/Warren.png" },
  { name: "Roosevelt", logo: "/ERC.png" },
  { name: "Sixth",     logo: "/Sixth.png" },
  { name: "Seventh",   logo: "/Seventh.svg" },
  { name: "Eighth",    logo: "/Eighth.svg" },
];

// Returns the logo path for a given college name, or null if not found
export function getCollegeLogo(collegeName) {
  return COLLEGES.find((c) => c.name === collegeName)?.logo ?? null;
}
