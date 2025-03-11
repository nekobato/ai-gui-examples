<script setup lang="ts">
/*
 * @/public/me.png をcanvasに描画して、10x10 pxのモザイク処理を行ったものをcanvasで描* 画するページを pages/image-blur.vue に書いて。
 * 処理が成功したかどうかは nuxt dev serverで確認して
 */

import { ref, onMounted } from "vue";

// canvasの参照を作成
const originalCanvas = ref<HTMLCanvasElement | null>(null);
const mosaicCanvas = ref<HTMLCanvasElement | null>(null);

// モザイクのピクセルサイズ
const MOSAIC_SIZE = 10;

// 画像を読み込み、処理を行う関数
const processImage = () => {
  if (!originalCanvas.value || !mosaicCanvas.value) return;

  const img = new Image();
  img.src = "/me.png";

  img.onload = () => {
    // 元画像をcanvasに描画
    const origCtx = originalCanvas.value!.getContext("2d");
    if (!origCtx) return;

    // canvasのサイズを画像に合わせる
    originalCanvas.value!.width = img.width;
    originalCanvas.value!.height = img.height;
    origCtx.drawImage(img, 0, 0);

    // モザイク処理用のcanvasも同じサイズに設定
    const mosaicCtx = mosaicCanvas.value!.getContext("2d");
    if (!mosaicCtx) return;

    mosaicCanvas.value!.width = img.width;
    mosaicCanvas.value!.height = img.height;

    // モザイク処理を行う
    applyMosaic(origCtx, mosaicCtx, img.width, img.height);
  };
};

// モザイク処理を行う関数
const applyMosaic = (
  srcCtx: CanvasRenderingContext2D,
  destCtx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  // 横方向のモザイクブロック数
  const numBlocksX = Math.ceil(width / MOSAIC_SIZE);
  // 縦方向のモザイクブロック数
  const numBlocksY = Math.ceil(height / MOSAIC_SIZE);

  // 各モザイクブロックごとに処理
  for (let y = 0; y < numBlocksY; y++) {
    for (let x = 0; x < numBlocksX; x++) {
      // ブロックの左上座標
      const blockX = x * MOSAIC_SIZE;
      const blockY = y * MOSAIC_SIZE;

      // ブロックの実際の幅と高さ（画像の端では小さくなる可能性がある）
      const blockWidth = Math.min(MOSAIC_SIZE, width - blockX);
      const blockHeight = Math.min(MOSAIC_SIZE, height - blockY);

      // ブロック内のピクセルデータを取得
      const imageData = srcCtx.getImageData(
        blockX,
        blockY,
        blockWidth,
        blockHeight
      );
      const data = imageData.data;

      // ブロック内の平均色を計算
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      let count = 0;

      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        a += data[i + 3];
        count++;
      }

      // 平均値を計算
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      a = Math.round(a / count);

      // 平均色で塗りつぶす
      destCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
      destCtx.fillRect(blockX, blockY, blockWidth, blockHeight);
    }
  }
};

// コンポーネントがマウントされたときに画像処理を実行
onMounted(() => {
  processImage();
});
</script>

<template>
  <div class="container">
    <h1>画像のモザイク処理</h1>

    <div class="canvas-container">
      <div class="canvas-wrapper">
        <h2>元の画像</h2>
        <canvas ref="originalCanvas"></canvas>
      </div>

      <div class="canvas-wrapper">
        <h2>モザイク処理後 ({{ MOSAIC_SIZE }}x{{ MOSAIC_SIZE }}px)</h2>
        <canvas ref="mosaicCanvas"></canvas>
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
  margin-bottom: 30px;
}

.canvas-container {
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

h2 {
  margin-bottom: 10px;
}

canvas {
  border: 1px solid #ccc;
  max-width: 100%;
}
</style>
