<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";

// キャンバス要素の参照
const canvas = ref<HTMLCanvasElement | null>(null);
// 描画コンテキスト
const ctx = ref<CanvasRenderingContext2D | null>(null);

// マウスの状態
const isDrawing = ref(false);
// 新しい描画セッションかどうかのフラグ
const isNewSession = ref(true);

// 点の配列
interface Point {
  x: number;
  y: number;
}

// 生の点データ
const rawPoints = reactive<Point[]>([]);
// 移動平均フィルター適用後の点データ
const smoothedPoints = reactive<Point[]>([]);

// 移動平均フィルターの窓サイズ
const windowSize = 5;

// キャンバスの初期化
onMounted(() => {
  if (!canvas.value) return;

  // キャンバスのサイズを設定
  canvas.value.width = 480;
  canvas.value.height = 480;

  // 描画コンテキストを取得
  ctx.value = canvas.value.getContext("2d");

  if (!ctx.value) return;

  // 背景を白に設定
  ctx.value.fillStyle = "#FFFFFF";
  ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height);

  // 線のスタイルを設定
  ctx.value.strokeStyle = "#000000";
  ctx.value.lineWidth = 2;
  ctx.value.lineCap = "round";
  ctx.value.lineJoin = "round";
});

// 移動平均フィルターを適用する関数
const applyMovingAverage = (points: Point[]): Point[] => {
  if (points.length <= windowSize) return [...points];

  const result: Point[] = [];

  // 最初の点はそのまま使用
  for (let i = 0; i < windowSize - 1; i++) {
    result.push({ ...points[i] });
  }

  // 移動平均フィルターを適用
  for (let i = windowSize - 1; i < points.length; i++) {
    let sumX = 0;
    let sumY = 0;

    for (let j = 0; j < windowSize; j++) {
      sumX += points[i - j].x;
      sumY += points[i - j].y;
    }

    result.push({
      x: sumX / windowSize,
      y: sumY / windowSize
    });
  }

  return result;
};

// Bスプラインを使って点を描画する関数
const drawBSpline = (points: Point[]) => {
  if (!ctx.value || points.length < 2) return;

  ctx.value.beginPath();

  // 最初の点に移動
  ctx.value.moveTo(points[0].x, points[0].y);

  // 2点の場合は直線を引く
  if (points.length === 2) {
    ctx.value.lineTo(points[1].x, points[1].y);
  } else {
    // 3点以上の場合はBスプラインを使用
    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.value.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    // 最後の2点を処理
    const n = points.length - 1;
    ctx.value.quadraticCurveTo(
      points[n - 1].x,
      points[n - 1].y,
      points[n].x,
      points[n].y
    );
  }

  ctx.value.stroke();
};

// キャンバスをクリアして再描画する関数
const redrawCanvas = () => {
  if (!ctx.value || !canvas.value) return;

  // キャンバスをクリア
  ctx.value.fillStyle = "#FFFFFF";
  ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height);

  // 移動平均フィルターを適用
  smoothedPoints.splice(
    0,
    smoothedPoints.length,
    ...applyMovingAverage(rawPoints)
  );

  // Bスプラインで描画
  drawBSpline(smoothedPoints);
};

// マウスダウンイベントハンドラ
const handleMouseDown = (e: MouseEvent) => {
  if (!canvas.value) return;

  isDrawing.value = true;

  // 新しいセッションの場合は点の配列をクリア
  if (isNewSession.value) {
    rawPoints.splice(0, rawPoints.length);
    smoothedPoints.splice(0, smoothedPoints.length);
    isNewSession.value = false;
  }

  // キャンバス上の座標を計算
  const rect = canvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 点を追加
  rawPoints.push({ x, y });

  // 再描画
  redrawCanvas();
};

// マウス移動イベントハンドラ
const handleMouseMove = (e: MouseEvent) => {
  if (!isDrawing.value || !canvas.value) return;

  // キャンバス上の座標を計算
  const rect = canvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 点を追加
  rawPoints.push({ x, y });

  // 再描画
  redrawCanvas();
};

// マウスアップイベントハンドラ
const handleMouseUp = () => {
  isDrawing.value = false;
  isNewSession.value = true; // 次回は新しいセッションとしてマーク
};

// マウスがキャンバスから出た場合のハンドラ
const handleMouseLeave = () => {
  isDrawing.value = false;
  isNewSession.value = true; // 次回は新しいセッションとしてマーク
};
</script>

<template>
  <div class="container">
    <h1>移動平均フィルターによるペイントの滑らかな曲線</h1>

    <div class="canvas-container">
      <div class="canvas-wrapper">
        <canvas
          ref="canvas"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseLeave"
        ></canvas>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

.canvas-container {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 30px;
}

.canvas-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

canvas {
  width: 480px;
  height: 480px;
  border: 1px solid #ddd;
}
</style>
