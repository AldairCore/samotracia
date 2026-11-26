const FALLBACK_PALETTE = ['#8a8a8a', '#707070', '#5a5a5a', '#464646'];

/** Tamaño del canvas de muestreo: coincide con las miniaturas usadas en el prototipo. */
const SAMPLE_SIZE = 48;
/** Niveles por canal al agrupar píxeles en cubos de color (256 / 32 = 8 niveles). */
const BUCKET_STEP = 32;

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${url}`));
    img.src = url;
  });
}

/**
 * Extrae una paleta [promedio, dominante 1, dominante 2, dominante 3] de una imagen remota.
 * Si la imagen no carga (red, CORS), devuelve una paleta gris neutra: `vividColors` ya sabe
 * sustituir tonos cercanos al gris por uno cercano al color del grupo.
 */
export async function extractPalette(imageUrl: string): Promise<string[]> {
  try {
    const img = await loadImage(imageUrl);
    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return FALLBACK_PALETTE;
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let count = 0;
    const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 10) continue;
      rSum += r;
      gSum += g;
      bSum += b;
      count++;

      const key = `${Math.floor(r / BUCKET_STEP)}-${Math.floor(g / BUCKET_STEP)}-${Math.floor(b / BUCKET_STEP)}`;
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.r += r;
        bucket.g += g;
        bucket.b += b;
        bucket.n++;
      } else {
        buckets.set(key, { r, g, b, n: 1 });
      }
    }

    if (count === 0) return FALLBACK_PALETTE;

    const average = rgbToHex(rSum / count, gSum / count, bSum / count);
    const dominant = [...buckets.values()]
      .sort((a, b) => b.n - a.n)
      .slice(0, 3)
      .map((bucket) => rgbToHex(bucket.r / bucket.n, bucket.g / bucket.n, bucket.b / bucket.n));

    while (dominant.length < 3) dominant.push(dominant[dominant.length - 1] ?? average);

    return [average, dominant[0], dominant[1], dominant[2]];
  } catch {
    return FALLBACK_PALETTE;
  }
}
