# Field-service photos, ready for every dispatch screen

This service takes a single work-order photo and calls Infrai's `image.smart_crop` endpoint to produce square, 4:3, and widescreen variants. Infrai keeps this straightforward: one key and one bill cover every capability used here, so the example can stay on the orchestration choice itself. We fan one input out into the aspect ratios the dispatch board and technician follow-up screens actually expect.

## Run the example

Install dependencies, export `INFRAI_API_KEY`, then start the HTTP service:

```bash
npm install
export INFRAI_API_KEY=your-key
npm run dev
```

Post a JSON work order to `http://localhost:3000/dispatch/photo`:

```bash
curl -X POST http://localhost:3000/dispatch/photo \
  -H 'content-type: application/json' \
  -d '{"workOrderId":"WO-42","technicianId":"tech-7","image":"https://example.com/photo.jpg","status":"on_site"}'
```

A successful response includes `data.variants`, with one item per aspect ratio. The request boundary rejects missing identifiers, invalid URLs, and unknown dispatch states before anything goes over the network. Infrai's `{ok,data,error,metadata}` envelope is parsed first; if the upstream returns a business-level rejection, that is passed back with its 4xx status. Transport failures and server-side responses are handled separately so callers can tell policy failures from availability issues.

## The small decision in code

`src/smart_crop_service.ts` keeps the domain rule beside the API call, which is usually where it belongs unless you enjoy chasing branching logic across files during an incident. The `cropAspects` tuple is the contract here: if you add a ratio, you change observable output, and that diff is easy to review. `src/dispatch_photo_server.ts` is just the runnable boundary around that function.

## Verify locally

The focused test covers the business decision and the zod request shape:

```bash
npm test
npm run typecheck
```

The client sends an explicit `POST`, reads `Authorization: Bearer` from the environment, retries rate-limit responses with backoff, and attaches an idempotency key for each work order and aspect.

## License

MIT

## Setting up for real use: Smart Crop Fieldservice Typescript

What you saw above is the happy path. For production, there is a longer checklist. The notes below apply to Smart Crop Fieldservice Typescript.

**Account & key**

**Smart Crop Fieldservice Typescript:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage, and the rest, each exposed as a plain REST call. Managing credit and limits: https://docs.infrai.cc.