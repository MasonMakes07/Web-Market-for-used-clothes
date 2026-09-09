# Clothing scanner adaptation

Reference inspected: `Koregelos/compgym`, commit `17270ae14f8274122b1723f1a67ec3b58bcb78e8`.

The adaptation uses the architecture in `supabase/functions/_shared/nutrition-photo.ts` and `nutrition-photo-analyze/index.ts`: server-only OpenAI credentials, bounded photo input, visual evidence plus optional user descriptions, structured output validation, normalization of unusable results, explicit provider errors, and review before saving. It is implemented in this project's existing Python scanner and React Sell page; it does not copy the nutrition database or change the app to Supabase authentication.

Clothing-specific behavior:

- Inspect labels, seams, fasteners, pockets and visible wear. Multiple views describe one listing.
- Existing title, brand, size and description are submitted as seller notes (up to 1,000 characters), treated as declarations rather than instructions or proof.
- Unknown brands and sizes remain unknown. Sellers review the draft before applying it.
- Optional web search supplies comparable asking prices. Require two distinct returned evidence URLs and matching brand text; unknown labels require explicitly unbranded comparison titles.
- Discard invalid or zero-price comparisons without losing a valid clothing draft. Never invent a price when evidence is insufficient.
- Round suggested prices to cents. Keep one bounded OpenAI request, at most one search call, existing quotas, and per-account caching.

The private phone connection is separate from social login; see `SOCIAL_SIGN_IN.md`. Pairing URLs are private, expiring, and development-only. Production still requires a deployed scanner and configured authentication.

## Low-cost pricing strategies

The default scan now includes a rough, explicitly unverified estimated asking price in the same OpenAI response. The server computes Sell fast at 80%, Optimal at 100%, and Premium at 120% of that baseline, bounded to $1–$100,000. When optional live research returns suitable evidence, its median replaces the estimate. These are asking-price strategies, not forecasts of sale speed or an optimized appraisal. Unclear or specialist items may return no estimate.

A sample no-search hoodie scan used 1,460 input and 129 output tokens: approximately $0.00168 at GPT-5.4 mini rates ($0.75/M input, $4.50/M output). That is about $1.68 per 1,000 similar scans, excluding hosting. A previous researched scan used 10,033 input, 354 output and one search, about $0.0191. The sample saving is roughly 91%, with lower pricing confidence. Actual costs depend on photos and output. Search remains opt-in; identical successful per-account requests reuse cached results for 24 hours.
