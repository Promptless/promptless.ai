import { MAX_PHOTO_BYTES } from "./game";

export const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function validateImage(file: Blob): Promise<void> {
  if (!file.size || file.size > MAX_INPUT_BYTES)
    throw new Error(
      "Choose a photo under 12 MB. A smaller photo or screenshot works too.",
    );
  if (!TYPES.has(file.type))
    throw new Error(
      "Choose a JPEG, PNG, or WebP photo. For HEIC, try Take photo or upload a screenshot.",
    );
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every(
    (byte, index) => bytes[index] === byte,
  );
  const webp =
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!(
    (file.type === "image/jpeg" && jpeg) ||
    (file.type === "image/png" && png) ||
    (file.type === "image/webp" && webp)
  )) {
    throw new Error(
      "That file does not look like a supported photo. Try a different image.",
    );
  }
}

export async function preparePhoto(file: File): Promise<Blob> {
  await validateImage(file);
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(
          new Error(
            "This photo could not be opened. Try a JPEG or screenshot.",
          ),
        );
      image.src = url;
    });
    if (
      !image.naturalWidth ||
      image.naturalWidth * image.naturalHeight > 40_000_000
    )
      throw new Error(
        "That photo is too large to process. Choose one under 40 megapixels or use a screenshot.",
      );
    // Re-encode pixels only: no original EXIF/GPS, filename, or other source metadata is stored.
    const canvas = document.createElement("canvas");
    const scale = Math.min(
      1,
      1600 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error(
        "This browser could not prepare the photo. Try another browser.",
      );
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.65, 0.45]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (blob && blob.size <= MAX_PHOTO_BYTES) return blob;
    }
    throw new Error(
      "This photo is still too big to save. Try a smaller image or screenshot.",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
