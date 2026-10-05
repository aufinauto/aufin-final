/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Zmenšení fotky v prohlížeči na JPEG data URL (pro Firestore, limit 1 MB/dokument).
 */

export function compressImage(file: File, maxSize = 1000, quality = 0.65): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        } else if (height >= width && height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

/** Přibližná velikost data URL v bajtech. */
export const dataUrlBytes = (dataUrl: string) => Math.round((dataUrl.length * 3) / 4);
