/**
 * SADAF | Shared — image file → resized data URL.
 *
 * Reads an uploaded image and downsizes it to a bounded square-ish preview so
 * the base64 data URL stays small enough for localStorage (profile avatars
 * are persisted there in the sandbox). Max dimension default 256px at JPEG
 * quality 0.85 keeps a typical avatar around ~15–30 KB.
 */

const MAX_DIMENSION = 256;
const JPEG_QUALITY = 0.85;

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Could not read the selected image.'));
        reader.readAsDataURL(file);
    });
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('The selected file is not a valid image.'));
        image.src = src;
    });
}

/**
 * Read `file` and return a resized JPEG data URL. Falls back to the original
 * file data when the canvas is unavailable (e.g. non-JPEG sources that fail
 * to re-encode) rather than failing silently.
 */
export async function fileToResizedDataUrl(file: File): Promise<string> {
    const originalDataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(originalDataUrl);

    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const ctx = canvas.getContext('2d');
    if (!ctx) return originalDataUrl;

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const resized = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    return resized.startsWith('data:') ? resized : originalDataUrl;
}
