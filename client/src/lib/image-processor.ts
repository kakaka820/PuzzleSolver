export interface Point {
  x: number;
  y: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function getPixelColor(ctx: CanvasRenderingContext2D, x: number, y: number): RGB {
  const data = ctx.getImageData(x, y, 1, 1).data;
  return { r: data[0], g: data[1], b: data[2] };
}

export function colorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) + 
    Math.pow(c1.g - c2.g, 2) + 
    Math.pow(c1.b - c2.b, 2)
  );
}

/**
 * 画像から筒と色の情報を抽出する（プロトタイプ）
 * ※実際にはユーザーが筒の位置をキャリブレーション（調整）できるUIが必要です。
 */
export async function processPuzzleImage(
  imageElement: HTMLImageElement,
  tubeCount: number,
  capacity: number
): Promise<number[][]> {
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas context not available");

  ctx.drawImage(imageElement, 0, 0);

  // ここで色判定のロジック（サンプリングポイントの走査など）を実装します。
  // 今回は枠組みだけ示し、具体的な座標計算はユーザーの画像サイズに合わせる必要があります。
  const tubes: number[][] = Array.from({ length: tubeCount }, () => []);

  // ダミーの戻り値（実装が進んだらここを画像解析コードに置き換えます）
  return tubes;
}
