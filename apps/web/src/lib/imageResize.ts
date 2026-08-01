/** Shared client-side image resize used by the logo upload widgets (registration + branding settings). */

export interface ResizeOptions {
  maxDimension?: number;
}

/** Resizes an image file to fit within maxDimension (default 256px), preserving aspect ratio, returning a PNG data URL. */
export function resizeImageFile(
  file: File,
  opts: ResizeOptions = {},
): Promise<string> {
  const maxDimension = opts.maxDimension ?? 256;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () =>
        reject(new Error("That file is not a readable image."));
      img.onload = () => {
        const scale = Math.min(
          1,
          maxDimension / Math.max(img.width, img.height),
        );
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx)
          return reject(new Error("Canvas is not supported in this browser."));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
