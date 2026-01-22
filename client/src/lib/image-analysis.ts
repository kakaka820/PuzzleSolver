//client/src/lib/image-analyss.ts
//画像処理、サンプリング、ピクセルのクラスタリング、ボトル構造解析のロジック


import { RGB, Point, Cluster, getPixelColor, findMatchingColor } from './color-utils';

export interface TubeStructure {
  x: number;
  y: number;
  contents: string[];
}

/**
 * 画像全体をスキャンしてサンプリング点(色情報）を取得します
 */
export function sampleImage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  step: number = 5
): { x: number; y: number; color: RGB }[] {
  const sampledPoints: { x: number; y: number; color: RGB }[] = [];
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      sampledPoints.push({ x, y, color: getPixelColor(ctx, x, y, 2) });
    }
  }
  return sampledPoints;
}

/**
 * 空間的な近接度と色の一致に基づいてピクセルをグループ化（クラスタリング）します。
 * ボトルの各層（色）を特定するのに役立ちます。
 */
export function clusterPixels(
  points: { x: number; y: number; color: RGB }[],
  palette: { id: string; color: RGB }[],
  background: { color: RGB | null; enabled: boolean },
  spatialThreshold: number = 20,
  colorThreshold: number = 30
): Cluster[] {
  const clusters: { colorId: string; points: { x: number; y: number }[] }[] = [];

  for (const point of points) {
    const match = findMatchingColor(point.color, palette, background, colorThreshold);
    // 背景やノイズは無視
    if (match.id === 'background' || match.id === 'none') continue;

    let joinedCluster = false;
    for (const cluster of clusters) {
      if (cluster.colorId === match.id) {
        // クラスタ内のいずれかの点に近いか確認（簡易的なDBSCAN風）
        const isNear = cluster.points.some(p => 
          Math.sqrt(Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2)) < spatialThreshold
        );

        if (isNear) {
          cluster.points.push({ x: point.x, y: point.y });
          joinedCluster = true;
          break;
        }
      }
    }

    if (!joinedCluster) {
      clusters.push({
        colorId: match.id,
        points: [{ x: point.x, y: point.y }]
      });
    }
  }

  return clusters
    .filter(c => c.points.length > 5)
    .map(c => {
      const sumX = c.points.reduce((sum, p) => sum + p.x, 0);
      const sumY = c.points.reduce((sum, p) => sum + p.y, 0);
      return {
        colorId: c.colorId,
        points: c.points,
        centroid: {
          x: sumX / c.points.length,
          y: sumY / c.points.length
        }
      };
    });
}

/**
 * 複数のクラスタから1つのチューブ情報を生成します
 */
function createTubeFromClusters(clusters: Cluster[]): TubeStructure {
  const avgX = clusters.reduce((sum, c) => sum + c.centroid.x, 0) / clusters.length;
  const avgY = clusters.reduce((sum, c) => sum + c.centroid.y, 0) / clusters.length;
  
  const contents = [...clusters]
    .sort((a, b) => a.centroid.y - b.centroid.y)
    .map(c => c.colorId);

  return { x: avgX, y: avgY, contents };
}

/**
 * クラスタからボトルの構造を解析します
 */
export function analyzeStructure(
  clusters: Cluster[],
  width: number,
  height: number
): TubeStructure[] {
  if (clusters.length === 0) return [];

  // 1. クラスタを「行（段）」に分類する
  // Y座標でソートし、急激にYが変わるところを行の境界とする

  const sortedByY = [...clusters].sort((a, b) => a.centroid.y - b.centroid.y);
  const rows: Cluster[][] = [];
  let currentRow: Cluster[] = [sortedByY[0]];
  const rowThreshold = height * 0.1;  // 画面高さの10%程度の差があれば別行

  for (let i = 1; i < sortedByY.length; i++) {
    if (Math.abs(sortedByY[i].centroid.y - sortedByY[i-1].centroid.y) > rowThreshold) {
      rows.push(currentRow);
      currentRow = [];
    }
    currentRow.push(sortedByY[i]);
  }
  rows.push(currentRow);


  // 2. 各行の中で、X座標に基づいて「ボトル」に分類する
  const bottles: TubeStructure[] = [];
  const tubeWidthThreshold = width * 0.1; // 画面幅の10%程度の差があれば別ボトル

  for (const rowClusters of rows) {
        // X座標でソート
    const sortedByX = [...rowClusters].sort((a, b) => a.centroid.x - b.centroid.x);
    
    let currentTubeClusters: Cluster[] = [sortedByX[0]];
    for (let i = 1; i < sortedByX.length; i++) {
      if (Math.abs(sortedByX[i].centroid.x - sortedByX[i-1].centroid.x) > tubeWidthThreshold) {
        // 現在のチューブを確定して登録
        bottles.push(createTubeFromClusters(currentTubeClusters));
        currentTubeClusters = [];
      }
      currentTubeClusters.push(sortedByX[i]);
    }
    // 最後のチューブを処理
    if (currentTubeClusters.length > 0) {
      bottles.push(createTubeFromClusters(currentTubeClusters));
    }
  }

  return bottles.sort((a, b) => {
    if (Math.abs(a.y - b.y) > rowThreshold) return a.y - b.y;
    return a.x - b.x;
  });
}
