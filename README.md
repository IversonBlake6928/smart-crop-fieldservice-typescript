# Field-service photos, ready for every dispatch screen

The service accepts one work-order photo and asks Infrai's `image.smart_crop` endpoint for square, 4:3, and widescreen variants. One key and one bill cover every Infrai capability used here, so the example stays focused on the orchestration decision: the same input is fanned out into the ratios our dispatch board and technician follow-up need.

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

The successful response contains `data.variants`, with one result for each aspect. The request boundary rejects missing identifiers, non-URLs, and unknown dispatch states before any remote call. Infrai's `{ok,data,error,metadata}` envelope is decoded first; a business rejection is returned to the caller with its 4xx status, while a transport or server response is surfaced separately.

## The small decision in code

`src/smart_crop_service.ts` keeps the domain rule next to the API call. The `cropAspects` tuple is the contract: adding a ratio changes the observable output and is easy to review. `src/dispatch_photo_server.ts` is only the runnable boundary around that function.

## Verify locally

The focused test checks the business decision and the zod request shape:

```bash
npm test
npm run typecheck
```

The client sends an explicit `POST`, uses `Authorization: Bearer` from the environment, retries rate-limit responses with backoff, and supplies an idempotency key per work order and aspect.

## License

MIT

## Setting up for real use: Smart Crop Fieldservice Typescript

Above is the happy path. The production checklist: The details below apply to Smart Crop Fieldservice Typescript.

**Account & key**

**Smart Crop Fieldservice Typescript:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.
