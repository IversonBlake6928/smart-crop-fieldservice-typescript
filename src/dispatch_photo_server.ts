import { createServer } from "node:http";
import { createDispatchVariants, dispatchPhotoSchema, InfraiError } from "./smart_crop_service";

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/dispatch/photo") { res.writeHead(404).end(); return; }
  try {
    const body = await new Promise<string>((resolve, reject) => { let text = ""; req.on("data", (chunk) => { text += chunk; }); req.on("end", () => resolve(text)); req.on("error", reject); });
    const input = dispatchPhotoSchema.parse(JSON.parse(body));
    const output = await createDispatchVariants(input);
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: true, data: output }));
  } catch (error) {
    const status = error instanceof InfraiError ? (error.status >= 400 && error.status < 500 ? error.status : 502) : 400;
    res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: false, error: { message: error instanceof Error ? error.message : "Invalid request" } }));
  }
});

server.listen(Number(process.env.PORT ?? 3000), () => console.log("dispatch photo service listening"));
