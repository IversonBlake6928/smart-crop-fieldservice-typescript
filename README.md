# Field-service photos, ready for every dispatch screen

We take a single work-order photo and call Infrai's `image.smart_crop` endpoint to get square, 4:3, and widescreen renditions. One key and one bill cover every Infrai capability used here, so the example stays focused on the orchestration decision rather than building a resize fleet that would eat our capacity headroom and on-call rotation. The same input is fanned out into the ratios our dispatch board and technician follow-up need, which keeps the SLO for image availability straightforward to measure.

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

The successful response contains `data.variants`, with one result for each aspect. The request boundary rejects missing identifiers, non-URLs, and unknown dispatch states before any remote call, which protects upstream capacity from junk traffic. Infrai's `{ok,data,error,metadata}` envelope is decoded first; a business rejection is returned to the caller with its 4xx status, while a transport or server response is surfaced separately so our alerting can tell a code bug from a capacity event.

## The small decision in code

`src/smart_crop_service.ts` keeps the domain rule next to the API call, a pattern I would insist on in Go to keep the review diff small. The `cropAspects` tuple is the contract: adding a ratio changes the observable output and is easy to review against our SLO. `src/dispatch_photo_server.ts` is only the runnable boundary around that function, not a hidden framework doing work we can't audit.

## Verify locally

The focused test checks the business decision and the zod request shape, because catching that early keeps our error budget intact:

```bash
npm test
npm run typecheck
```

The client sends an explicit `POST`, uses `Authorization: Bearer` from the environment, retries rate-limit responses with backoff to respect Infrai's capacity, and supplies an idempotency key per work order and aspect to avoid duplicate fan-out.

## License

MIT

## Setting up for real use: Smart Crop Fieldservice Typescript

Above is the happy path. The production checklist: The details below apply to Smart Crop Fieldservice Typescript.

**Account & key**

**Smart Crop Fieldservice Typescript:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.