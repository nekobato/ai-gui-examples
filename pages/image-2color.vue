<script setup lang="ts">
/*
 * @pages/image-2color.vue に、canvasに表示した画像を2階調化する処理
 * /public/me.png をcanvasに表示
 * もう一つのcanvasに、2階調化した画像を表示
 */

import { ref, onMounted, watch } from "vue";

// canvasの参照を作成
const originalCanvas = ref<HTMLCanvasElement | null>(null);
const colorCanvas = ref<HTMLCanvasElement | null>(null);

// 元の画像データを保持
const originalImageData = ref<ImageData | null>(null);
const imageWidth = ref<number>(0);
const imageHeight = ref<number>(0);

// 2階調化の閾値（0〜255）
const threshold = ref<number>(128);

// 画像を読み込み、処理を行う関数
const processImage = () => {
  if (!originalCanvas.value || !colorCanvas.value) return;

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

    // 画像サイズを保存
    imageWidth.value = img.width;
    imageHeight.value = img.height;

    // 元の画像データを保存
    originalImageData.value = origCtx.getImageData(0, 0, img.width, img.height);

    // 2階調化用のcanvasも同じサイズに設定
    const colorCtx = colorCanvas.value!.getContext("2d");
    if (!colorCtx) return;

    colorCanvas.value!.width = img.width;
    colorCanvas.value!.height = img.height;

    // 2階調化処理を適用
    applyBinarization();
  };
};

// 2階調化処理を適用する関数
const applyBinarization = () => {
  if (!colorCanvas.value || !originalImageData.value) return;

  const colorCtx = colorCanvas.value.getContext("2d");
  if (!colorCtx) return;

  // 元の画像データをコピー
  const newImageData = new ImageData(
    new Uint8ClampedArray(originalImageData.value.data),
    originalImageData.value.width,
    originalImageData.value.height
  );

  const width = originalImageData.value.width;
  const height = originalImageData.value.height;
  const pixels = newImageData.data;

  // 各ピクセルに対して2階調化処理を適用
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 現在の位置のインデックス
      const index = (y * width + x) * 4;

      // RGBの平均値を計算
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const average = (r + g + b) / 3;

      // 閾値と比較して2階調化
      const binaryValue = average >= threshold.value ? 255 : 0;

      // ピクセル値を更新
      pixels[index] = binaryValue; // R
      pixels[index + 1] = binaryValue; // G
      pixels[index + 2] = binaryValue; // B
      // アルファ値はそのまま
    }
  }

  // 調整後の画像データを描画
  colorCtx.putImageData(newImageData, 0, 0);
};

// スライダー値が変更されたときに2階調化処理を再適用
watch(threshold, () => {
  applyBinarization();
});

// コンポーネントがマウントされたときに画像処理を実行
onMounted(() => {
  processImage();
});
</script>

<template>
  <div class="container">
    <h1>画像の2階調化</h1>

    <div class="controls">
      <div class="slider-container">
        <label for="threshold-slider">閾値: {{ threshold }}</label>
        <input
          id="threshold-slider"
          type="range"
          min="0"
          max="255"
          v-model.number="threshold"
          class="threshold-slider"
        />
      </div>
    </div>

    <div class="canvas-container">
      <div class="canvas-wrapper">
        <h2>元の画像</h2>
        <canvas ref="originalCanvas"></canvas>
      </div>

      <div class="canvas-wrapper">
        <h2>2階調化後</h2>
        <canvas ref="colorCanvas"></canvas>
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

.controls {
  max-width: 500px;
  margin: 0 auto 30px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider-container {
  margin-bottom: 15px;
}

.slider-container:last-child {
  margin-bottom: 0;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input[type="range"] {
  width: 100%;
  height: 20px;
  border-radius: 5px;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  background: #ddd;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  cursor: pointer;
  background: #333;
}

.threshold-slider {
  accent-color: #333;
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

h2 {
  margin-bottom: 10px;
}

canvas {
  border: 1px solid #ccc;
  max-width: 100%;
  max-width: 500px;
}
</style>
