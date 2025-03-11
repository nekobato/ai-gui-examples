<script setup lang="ts">
/*
 * @pages/image-color.vue に、画像の色調を変更できるページをを作って。
 * /public/me.png をcanvasに表示
 * range inputを３つ配置し、それぞれ画像のR, G, B値を調節できるようにする
 */

import { ref, onMounted, watch } from "vue";

// canvasの参照を作成
const originalCanvas = ref<HTMLCanvasElement | null>(null);
const colorCanvas = ref<HTMLCanvasElement | null>(null);

// 元の画像データを保持
const originalImageData = ref<ImageData | null>(null);

// RGB調整用のスライダー値（数値型として明示的に定義）
const redValue = ref<number>(100);
const greenValue = ref<number>(100);
const blueValue = ref<number>(100);

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

    // 元の画像データを保存
    originalImageData.value = origCtx.getImageData(0, 0, img.width, img.height);

    // 色調整用のcanvasも同じサイズに設定
    const colorCtx = colorCanvas.value!.getContext("2d");
    if (!colorCtx) return;

    colorCanvas.value!.width = img.width;
    colorCanvas.value!.height = img.height;

    // 初期状態では元画像をそのまま表示
    colorCtx.putImageData(originalImageData.value, 0, 0);
  };
};

// RGB値を調整する関数
const adjustColors = () => {
  if (!colorCanvas.value || !originalImageData.value) return;

  const colorCtx = colorCanvas.value.getContext("2d");
  if (!colorCtx) return;

  // 元の画像データをコピー
  const newImageData = new ImageData(
    new Uint8ClampedArray(originalImageData.value.data),
    originalImageData.value.width,
    originalImageData.value.height
  );

  const data = newImageData.data;

  // 各ピクセルのRGB値を調整
  for (let i = 0; i < data.length; i += 4) {
    // R, G, B値を調整（0-200%の範囲で調整）
    data[i] = Math.min(255, Math.max(0, data[i] * (redValue.value / 100)));
    data[i + 1] = Math.min(
      255,
      Math.max(0, data[i + 1] * (greenValue.value / 100))
    );
    data[i + 2] = Math.min(
      255,
      Math.max(0, data[i + 2] * (blueValue.value / 100))
    );
    // アルファ値（透明度）はそのまま
  }

  // 調整後の画像データを描画
  colorCtx.putImageData(newImageData, 0, 0);
};

// スライダー値が変更されたときに色調整を実行
watch([redValue, greenValue, blueValue], () => {
  adjustColors();
});

// コンポーネントがマウントされたときに画像処理を実行
onMounted(() => {
  processImage();
});
</script>

<template>
  <div class="container">
    <h1>画像の色調調整</h1>

    <div class="controls">
      <div class="slider-container">
        <label for="red-slider">赤 (R): {{ redValue }}%</label>
        <input
          id="red-slider"
          type="range"
          min="0"
          max="200"
          v-model.number="redValue"
          class="red-slider"
          @input="adjustColors"
        />
      </div>

      <div class="slider-container">
        <label for="green-slider">緑 (G): {{ greenValue }}%</label>
        <input
          id="green-slider"
          type="range"
          min="0"
          max="200"
          v-model.number="greenValue"
          class="green-slider"
          @input="adjustColors"
        />
      </div>

      <div class="slider-container">
        <label for="blue-slider">青 (B): {{ blueValue }}%</label>
        <input
          id="blue-slider"
          type="range"
          min="0"
          max="200"
          v-model.number="blueValue"
          class="blue-slider"
          @input="adjustColors"
        />
      </div>
    </div>

    <div class="canvas-container">
      <div class="canvas-wrapper">
        <h2>元の画像</h2>
        <canvas ref="originalCanvas"></canvas>
      </div>

      <div class="canvas-wrapper">
        <h2>色調調整後</h2>
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
}

.red-slider {
  accent-color: #ff5252;
}

.green-slider {
  accent-color: #4caf50;
}

.blue-slider {
  accent-color: #2196f3;
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
}
</style>
