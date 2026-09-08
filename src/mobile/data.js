export const COLLEGES = [
  "Revelle",
  "Muir",
  "Marshall",
  "Warren",
  "Roosevelt",
  "Sixth",
  "Seventh",
  "Eighth",
];
export const CATEGORIES = [
  "All finds",
  "Clothing",
  "Shoes",
  "Accessories",
  "Dorm & living",
  "Books",
  "Electronics",
];
export const SPOTS = [
  "Geisel Library",
  "Price Center",
  "Sun God Lawn",
  "Warren Bear",
  "Sixth College",
];
export const CONDITIONS = ["Like new", "Good", "Fair", "New with tags"];
export const GENDERS = ["Unisex", "Men's", "Women's"];
export const EMPTY_DRAFT = {
  title: "",
  price: "",
  category: "Clothing",
  size: "",
  gender: "Unisex",
  brand: "",
  condition: "Good",
  description: "",
  photos: [],
};

// LAN HTTP previews lack randomUUID; getRandomValues remains available on those origins.
export function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return Array.from(
    globalThis.crypto.getRandomValues(new Uint8Array(16)),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

const sample = [
  [
    "hoodie",
    "The everyday oversized hoodie",
    24,
    "Clothing",
    "M",
    "Unisex",
    "Sixth",
    "Maya",
    "1556821840-3a63f95609a7",
    "A soft, easy layer for library nights. Relaxed fit with a roomy front pocket.",
    "Like new",
  ],
  [
    "jeans",
    "Vintage straight-leg denim",
    32,
    "Clothing",
    "28",
    "Women's",
    "Muir",
    "Jamie",
    "1542272604-787c3835535d",
    "Classic blue denim with a lived-in feel. Happy to share measurements.",
    "Good",
  ],
  [
    "sneakers",
    "A little pop of color",
    45,
    "Shoes",
    "US 8",
    "Men's",
    "Warren",
    "Jordan",
    "1542291026-7eec264c27ff",
    "Red sneakers for the walk across campus. Light wear on the soles.",
    "Good",
  ],
  [
    "tee",
    "Your new favorite white tee",
    12,
    "Clothing",
    "L",
    "Men's",
    "Seventh",
    "Sam",
    "1521572163474-6864f9cf17ab",
    "A simple cotton tee. Freshly washed and ready for another wardrobe.",
    "Like new",
  ],
  [
    "headphones",
    "Study-session headphones",
    55,
    "Electronics",
    "",
    "Unisex",
    "Marshall",
    "Taylor",
    "1505740420928-5e560c06d30e",
    "Over-ear headphones. Includes the cable. Try them at pickup.",
    "Good",
  ],
  [
    "bag",
    "The take-everywhere backpack",
    28,
    "Accessories",
    "",
    "Unisex",
    "Revelle",
    "Alex",
    "1553062407-98eeb64c6a62",
    "Room for your laptop, a notebook, and a snack or two.",
    "Good",
  ],
];

// Creates explicitly fictional inventory and conversations for the local preview.
export function initialState() {
  const listings = sample.map(
    ([
      id,
      title,
      price,
      category,
      size,
      gender,
      college,
      seller,
      image,
      description,
      condition,
    ]) => ({
      id,
      title,
      price,
      category,
      size,
      gender,
      college,
      seller,
      sellerId: `sample-${id}`,
      description,
      condition,
      photos: [
        `https://images.unsplash.com/photo-${image}?auto=format&fit=crop&w=720&q=80`,
      ],
      status: "active",
      sample: true,
      createdAt: "2026-09-07T12:00:00Z",
    }),
  );
  return {
    version: 2,
    listings,
    saved: ["jeans"],
    draft: EMPTY_DRAFT,
    profile: {
      name: "Your name",
      college: "Sixth",
      bio: "Giving good things a second home.",
      spot: "Geisel Library",
    },
    threads: [
      {
        id: "sample-thread",
        listingId: "hoodie",
        seller: "Maya",
        college: "Sixth",
        messages: [
          {
            id: "welcome",
            from: "other",
            text: "Hey! This is a sample conversation. Try a message or plan a campus pickup below.",
            at: "2026-09-07T12:00:00Z",
          },
        ],
        meetup: null,
      },
    ],
    blocked: [],
    reports: [],
  };
}

// Backfills fields added after version 1 so returning devices don't lose listings
// to filters that key off a field their stored data predates.
export function migrate(saved) {
  if (saved.version === 2) return saved;
  return {
    ...saved,
    version: 2,
    listings: saved.listings.map((item) => ({ gender: "Unisex", ...item })),
    draft: { ...EMPTY_DRAFT, ...saved.draft },
  };
}
