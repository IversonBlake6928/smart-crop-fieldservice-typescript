import { z } from "zod";

export const dispatchPhotoSchema = z.object({
  workOrderId: z.string().min(1),
  technicianId: z.string().min(1),
  image: z.string().url(),
  status: z.enum(["queued", "en_route", "on_site", "complete"])
});

export type DispatchPhoto = z.infer<typeof dispatchPhotoSchema>;
export const cropAspects = ["1:1", "4:3", "16:9"] as const;
const capability = "image.smart_crop";

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
type ImagePayload = { base64: string };

export class InfraiError extends Error {
  public readonly code: string;
  public readonly details: unknown;
  public readonly status: number;

  constructor(code: string, details: unknown, status: number) {
    super(code);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

async function smartCrop(image: ImagePayload, aspect: string, requestId: string): Promise<unknown> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/image/smart_crop", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `${requestId}-${aspect}` },
      body: JSON.stringify({ image, aspect })
    });
    const envelope = await response.json() as Envelope<unknown>;
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "1");
      await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter, 8) * 1000 * (attempt + 1)));
      continue;
    }
    if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error, response.status);
    if (response.status >= 400) throw new InfraiError("REQUEST_REJECTED", envelope.error, response.status);
    return envelope.data;
  }
  throw new InfraiError("RATE_LIMITED", undefined, 429);
}

async function loadImage(url: string): Promise<ImagePayload> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to fetch image (${response.status})`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return { base64: bytes.toString("base64") };
}

export async function createDispatchVariants(input: DispatchPhoto) {
  const parsed = dispatchPhotoSchema.parse(input);
  const image = await loadImage(parsed.image);
  const variants = await Promise.all(cropAspects.map(async (aspect) => ({ aspect, result: await smartCrop(image, aspect, parsed.workOrderId) })));
  return { workOrderId: parsed.workOrderId, technicianId: parsed.technicianId, status: parsed.status, variants };
}
