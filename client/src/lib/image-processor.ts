//client/src/lib/image-processor.ts



import { RGB, Point, getPixelColor, mapColorsToIds, findMatchingColor, colorDistance } from './color-utils';
import { sampleImage, clusterPixels, analyzeStructure, TubeStructure } from './image-analysis';

export type { Point, RGB };

/**
 * 画像から筒と色の情報を抽出する
 *  * ユーザーが指定したサンプリングポイント（キャリブレーション座標）に基づいて色を判定します。
 */
export async function processPuzzleImage(
  imageElement: HTMLImageElement,
  samplingPoints: Point[][]
): Promise<number[][]> {
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas context not available");

  ctx.drawImage(imageElement, 0, 0);

  const allColors: RGB[] = [];
  const tubeStructure: { tubeIndex: number, slotIndex: number }[] = [];


// 全てのポイントから色を抽出 (半径3pxの平均)
  samplingPoints.forEach((tubePoints, tIdx) => {
    tubePoints.forEach((point, sIdx) => {
      const x = Math.floor(point.x);
      const y = Math.floor(point.y);
      
      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        const color = getPixelColor(ctx, x, y, 3);
        allColors.push(color);
        tubeStructure.push({ tubeIndex: tIdx, slotIndex: sIdx });
      }
    });
  });

  // 色をIDに変換（類似色は同じIDになる）
  const colorIds = mapColorsToIds(allColors);

  // 結果を元のチューブ構造に戻す
  const result: number[][] = samplingPoints.map(() => []);
  
  colorIds.forEach((id, index) => {
    const { tubeIndex } = tubeStructure[index];
    result[tubeIndex].push(id);
  });

  return result;
}










/**
 * 画像からボトルを検出し、その中身をパレットIDに変換します。
 */
export async function detectPuzzleState(
  imageElement: HTMLImageElement,
  palette: { id: string; color: RGB }[],
  background: { color: RGB | null; enabled: boolean }
): Promise<string[][]> {
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas context not available");

  ctx.drawImage(imageElement, 0, 0);

  // 1. 画像サンプリング
  const sampledPoints = sampleImage(ctx, canvas.width, canvas.height);

  // 2. クラスタリング実行
  const clusters = clusterPixels(sampledPoints, palette, background);

  // 3. 構造解析
  const bottles = analyzeStructure(clusters, canvas.width, canvas.height);

  // 4. 結果を配列形式に変換して返す
  return bottles.map(b => b.contents);
}


// Re-export needed utility functions
export { getPixelColor, colorDistance, findMatchingColor, clusterPixels };