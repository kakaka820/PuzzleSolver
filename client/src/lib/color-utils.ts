//client/src/lib/color-utils.ts
//色空間変換、色差計算、パレット照合、色のクラスタリングなど


export interface Point {
  x: number;
  y: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Cluster {
  colorId: string;
  points: Point[];
  centroid: Point;
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
export function mapColorsToIds(colors: RGB[], threshold = 20): number[] {
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
 * パレットの色または背景色と一致するか判定（Lab色空間を使用して高精度に判定）
 */
export function findMatchingColor(
  targetColor: RGB,
  palette: { id: string; color: RGB }[],
  background: { color: RGB | null; enabled: boolean },
  threshold: number = 30
): { id: string | 'background' | 'none'; distance: number } {

    // 1. 背景色に近いかチェック
  if (background.enabled && background.color) {
    const dist = colorDistance(targetColor, background.color);
    if (dist < threshold) {
      return { id: 'background', distance: dist };
    }
  }
//   2. パレットの中で一番近い色を探す
  let bestMatch: { id: string | 'background' | 'none'; distance: number } = { id: 'none', distance: Infinity };
  for (const item of palette) {
    const d = colorDistance(targetColor, item.color);
    if (d < bestMatch.distance) {
      bestMatch = { id: item.id, distance: d };
    }
  }

  return bestMatch.distance < threshold ? bestMatch : { id: 'none', distance: bestMatch.distance };
}
