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

// The fictional students behind the sample listings. Ratings and follower counts
// belong to that sample community only — nothing here reflects a real student,
// and the preview never claims your own activity reached anyone.
export const SELLERS = {
  Maya: { rating: 4.9, reviews: 27, followers: 84, college: "Sixth" },
  Jamie: { rating: 4.7, reviews: 12, followers: 41, college: "Muir" },
  Jordan: { rating: 5, reviews: 8, followers: 63, college: "Warren" },
  Sam: { rating: 4.5, reviews: 19, followers: 37, college: "Seventh" },
  Taylor: { rating: 4.8, reviews: 15, followers: 52, college: "Marshall" },
  Alex: { rating: 4.6, reviews: 23, followers: 46, college: "Revelle" },
};

// Sample students shown as following your preview profile, mirroring the sample
// conversation that already ships with the preview.
export const SAMPLE_FOLLOWERS = ["Maya", "Jordan", "Taylor"];

// Sample reputation is keyed on the listing being sample inventory, not on the
// seller's display name: a student who names their profile "Maya" must never
// inherit the fictional Maya's rating and followers on their own listing.
export function sampleSeller(item) {
  return item?.sample ? SELLERS[item.seller] : undefined;
}

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
    version: 3,
    listings,
    saved: ["jeans"],
    following: ["Maya"],
    ratings: {},
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
// to filters that key off a field their stored data predates. Steps apply in
// order, so a device on any older version lands on the current shape.
export const STATE_VERSION = 3;

export function migrate(saved) {
  // The load guard rejects a non-integer version, but migrate is exported:
  // treat anything unrecognisable as the oldest shape rather than skipping steps.
  let state = Number.isInteger(saved.version)
    ? saved
    : { ...saved, version: 1 };
  if (state.version < 2)
    state = {
      ...state,
      version: 2,
      listings: state.listings.map((item) => ({ gender: "Unisex", ...item })),
      draft: { ...EMPTY_DRAFT, ...state.draft },
    };
  if (state.version < 3)
    state = { ...state, version: 3, following: [], ratings: {} };
  return state;
}
