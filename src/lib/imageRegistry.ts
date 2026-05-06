// HTMLImageElement instances live outside the Zustand store because they're
// not serializable and don't need to trigger React re-renders directly.
// Layers reference images by id; the registry resolves id -> bitmap.

class ImageRegistry {
  private map = new Map<string, HTMLImageElement>();
  private listeners = new Set<() => void>();

  set(id: string, img: HTMLImageElement) {
    this.map.set(id, img);
    this.notify();
  }

  get(id: string) {
    return this.map.get(id);
  }

  getMap() {
    return this.map;
  }

  delete(id: string) {
    this.map.delete(id);
    this.notify();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private notify() {
    for (const fn of this.listeners) fn();
  }
}

export const imageRegistry = new ImageRegistry();

// Loads an image file (PNG or SVG) and returns a promise that resolves to
// the registered id and the natural dimensions.
export async function loadImageFile(
  file: File,
): Promise<{ id: string; width: number; height: number }> {
  const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);
  imageRegistry.set(id, img);
  return { id, width: img.naturalWidth, height: img.naturalHeight };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
