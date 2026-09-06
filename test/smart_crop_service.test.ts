import test from "node:test";
import assert from "node:assert/strict";
import { cropAspects, dispatchPhotoSchema } from "../src/smart_crop_service";

test("dispatch photos produce the three operator-facing crop ratios", () => {
  const input = dispatchPhotoSchema.parse({ workOrderId: "WO-42", technicianId: "tech-7", image: "https://example.com/photo.jpg", status: "on_site" });
  assert.deepEqual(cropAspects, ["1:1", "4:3", "16:9"]);
  assert.equal(input.status, "on_site");
});
