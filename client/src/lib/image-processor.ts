export interface Point {
  x: number;
  y: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

// 周辺の平均色を取得してノイズを軽減（半径radius内の平均）
export function getPixelColor(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number = 3): RGB {
  const startX = Math.max(0, x - radius);
  const startY = Math.max(0, y - radius);
  const endX = Math.min(ctx.canvas.width, x + radius + 1);
  const endY = Math.min(ctx.canvas.height, y + radius + 1);
  
  const width = endX - startX;
  const height = endY - startY;
  
  if (width <= 0 || height <= 0) return { r: 0, g: 0, b: 0 };

  const data = ctx.getImageData(startX, startY, width, height).data;
  let r = 0, g = 0, b = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count)
  };
}

// RGBからLab色空間への変換 (D65光源、2度視野)
// 人間の知覚に近い色差判定を行うため
function rgbToLab(rgb: RGB): { l: number; a: number; b: number } {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100;

  x = x / 95.047;
  y = y / 100.000;
  z = z / 108.883;

  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

  return {
    l: (116 * y) - 16,
    a: 500 * (x - y),
    b: 200 * (y - z)
  };
}

// Lab色空間でのユークリッド距離 (CIE76 Delta E)
export function colorDistance(c1: RGB, c2: RGB): number {
  const lab1 = rgbToLab(c1);
  const lab2 = rgbToLab(c2);
  
  return Math.sqrt(
    Math.pow(lab1.l - lab2.l, 2) + 
    Math.pow(lab1.a - lab2.a, 2) + 
    Math.pow(lab1.b - lab2.b, 2)
  );
}

/**
 * 色のリストを類似色ごとにクラスタリングしてIDに変換する
 */
function mapColorsToIds(colors: RGB[], threshold = 20): number[] {
  // Lab空間での距離閾値。通常の識別限界(2.3程度)より大きく取り、
  // ゲーム画面の影やグラデーションによる誤差(10-20程度)を許容する設定。
  const ids: number[] = [];
  const uniqueColors: RGB[] = [];

  for (const color of colors) {
    let foundId = -1;
    let minDistance = Infinity;

    for (let i = 0; i < uniqueColors.length; i++) {
      const dist = colorDistance(color, uniqueColors[i]);
      if (dist < threshold && dist < minDistance) {
        minDistance = dist;
        foundId = i;
      }
    }

    if (foundId === -1) {
      uniqueColors.push(color);
      ids.push(uniqueColors.length + 1); // 1-based ID
    } else {
      ids.push(foundId + 1);
    }
  }
  return ids;
}

/**
 * 画像から筒と色の情報を抽出する
 * ユーザーが指定したサンプリングポイント（キャリブレーション座標）に基づいて色を判定します。
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
