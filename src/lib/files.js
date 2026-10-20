/**
 * Turn an uploaded file into a data: URL so it can be stored inside the post.
 * Photos are resized to at most 1600px and re-encoded as WebP to keep posts small.
 *
 * This is the fallback when there's no file storage. With a real backend
 * (e.g. Supabase Storage), upload the file there and return its URL instead.
 */
export async function fileToDataURL(file) {
  const raster = /^image\/(png|jpe?g|webp|bmp)$/i.test(file.type);
  if (raster && "createImageBitmap" in window) {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/webp", 0.85);
  }
  if (file.size > 2 * 1024 * 1024) throw new Error("That file is over 2 MB. Pick a smaller one.");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
