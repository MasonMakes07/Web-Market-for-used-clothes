# Shareable deployment and low-cost scanner

## Hosting

The existing GitHub repository already connects to Vercel. This branch deploys the frontend as a Vite static app; it does not deploy the original Browser Use backend. A Vercel preview may require its owner to change Deployment Protection before other students can open it. Use an accessible HTTPS deployment URL for phone installation and the Auth0 callback configuration.

The OpenAI scanner is a separate FastAPI server. Run `python -m uvicorn backend.scanner:app --host 0.0.0.0 --port 8000` from the repository root. It needs a persistent volume for `backend/runtime/`, an HTTPS endpoint, the server environment template filled in, and a frontend `VITE_SCANNER_API` URL. Do not host this SQLite quota/cache implementation on an ephemeral serverless filesystem: restarting would reset spending limits. Multiple replicas need shared database storage and a quota design appropriate to it.

GitHub stores the source; students open the deployed website. GitHub Pages is unsuitable for hosting a trading marketplace under its [usage limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

## OpenAI only

The new scanner uses one OpenAI Responses request per distinct scan, using `gpt-5.4-mini`, up to three compressed photos, at most 1,800 output tokens, and no reasoning-token budget. Price research is optional; selecting it requires one web-search call with low search context. There are no Browser Use, SellRaze, or separate scraping API charges in this path.

Identical photos/options from the same approved account reuse their result for 24 hours, including after a page reload. Concurrent identical requests are rejected before billing. Cache entries store the structured result and photo hash, not original photo bytes. Failed requests count toward quota; success is never fabricated when price evidence is missing.

Default limits: 5 new attempts per student per UTC day and 200 new attempts globally per UTC month. Cache hits do not consume either allowance. Both limits require persistent storage and apply only to calls through this service, not unrelated use of the API key.

At the verified model rates of $0.75/million input tokens and $4.50/million output tokens, a planning example with 6,000 input tokens and 700 output tokens costs $0.00765 without search. Web search adds its tool fee and any billable search content. Budget approximately **$5–10 for an initial 200-item pilot**, then use observed usage before raising limits; this is an estimate, not a guaranteed dollar ceiling. Start with existing hosting if its plan permits the use case; backend hosting is additional and cannot be quoted until an account/plan is selected.

Official references: [model rates](https://developers.openai.com/api/docs/models/gpt-5.4-mini), [API and tool pricing](https://developers.openai.com/api/docs/pricing), [web search](https://developers.openai.com/api/docs/guides/tools-web-search).

## Still required for a real student launch

- UCSD identity-provider approval/configuration, deployed Auth0 Action, and a verified student account to test.
- Shared marketplace database, participant-only message delivery, and media storage.
- Scanner HTTPS hosting with persistent quota/cache storage and narrowly scoped CORS.
- Live item-pricing quality checks and account-isolation tests on the deployment.

The device preview must not be advertised as a working student-only multi-user marketplace until those connections pass real tests.
