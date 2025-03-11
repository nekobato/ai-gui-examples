<script setup lang="ts">
/*
 * @pages/image-whirl.vue に、画像に対してphotoshopの変形 -> 渦巻きフィルターをかける処理
 * /public/me.png をcanvasに表示
 * もう一つのcanvasに、渦巻きフィルターをかけた画像を表示
 */

import { ref, onMounted, watch } from "vue";

// canvasの参照を作成
const originalCanvas = ref<HTMLCanvasElement | null>(null);
const whirlCanvas = ref<HTMLCanvasElement | null>(null);

// 元の画像データを保持
const originalImageData = ref<ImageData | null>(null);
const imageWidth = ref<number>(0);
const imageHeight = ref<number>(0);

// 渦巻きフィルターの強度（-100〜100）
const whirlStrength = ref<number>(50);
// 渦巻きの中心点（デフォルトは画像の中心）
const centerX = ref<number>(0);
const centerY = ref<number>(0);

// 画像を読み込み、処理を行う関数
const processImage = () => {
  if (!originalCanvas.value || !whirlCanvas.value) return;

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

    // 渦巻きの中心点を画像の中心に設定
    centerX.value = img.width / 2;
    centerY.value = img.height / 2;

    // 元の画像データを保存
    originalImageData.value = origCtx.getImageData(0, 0, img.width, img.height);

    // 渦巻き効果用のcanvasも同じサイズに設定
    const whirlCtx = whirlCanvas.value!.getContext("2d");
    if (!whirlCtx) return;

    whirlCanvas.value!.width = img.width;
    whirlCanvas.value!.height = img.height;

    // 渦巻き効果を適用
    applyWhirlEffect();
  };
};

// 渦巻き効果を適用する関数
const applyWhirlEffect = () => {
  if (!whirlCanvas.value || !originalImageData.value) return;

  const whirlCtx = whirlCanvas.value.getContext("2d");
  if (!whirlCtx) return;

  // 元の画像データをコピー
  const newImageData = new ImageData(
    new Uint8ClampedArray(originalImageData.value.data),
    originalImageData.value.width,
    originalImageData.value.height
  );

  const width = originalImageData.value.width;
  const height = originalImageData.value.height;
  const pixels = newImageData.data;

  // 渦巻きの強度を調整（値が大きいほど効果が強くなる）
  const factor = whirlStrength.value * 0.005;
  const radius = Math.max(width, height) / 2;

  // 各ピクセルに対して渦巻き効果を適用
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 中心からの相対座標
      const dx = x - centerX.value;
      const dy = y - centerY.value;

      // 中心からの距離
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 距離が0の場合はスキップ（中心点）
      if (distance === 0) continue;

      // 元の角度を計算
      const originalAngle = Math.atan2(dy, dx);

      // 距離に応じて角度を変化させる（渦巻き効果）
      // 中心に近いほど回転が大きくなる
      const distanceFactor = Math.max(0, (radius - distance) / radius);
      const rotationAngle = factor * distanceFactor * 10;
      const newAngle = originalAngle + rotationAngle;

      // 元の座標を計算
      const srcX = Math.floor(centerX.value + distance * Math.cos(newAngle));
      const srcY = Math.floor(centerY.value + distance * Math.sin(newAngle));

      // 元の座標が画像の範囲内かチェック
      if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
        // 現在の位置のインデックス
        const destIndex = (y * width + x) * 4;
        // 元の位置のインデックス
        const srcIndex = (srcY * width + srcX) * 4;

        // 元のピクセルデータをコピー
        pixels[destIndex] = originalImageData.value.data[srcIndex]; // R
        pixels[destIndex + 1] = originalImageData.value.data[srcIndex + 1]; // G
        pixels[destIndex + 2] = originalImageData.value.data[srcIndex + 2]; // B
        pixels[destIndex + 3] = originalImageData.value.data[srcIndex + 3]; // A
      }
    }
  }

  // 調整後の画像データを描画
  whirlCtx.putImageData(newImageData, 0, 0);
};

// スライダー値が変更されたときに渦巻き効果を再適用
watch(whirlStrength, () => {
  applyWhirlEffect();
});

// コンポーネントがマウントされたときに画像処理を実行
onMounted(() => {
  processImage();
});
</script>

<template>
  <div class="container">
    <h1>画像の渦巻きフィルター</h1>

    <div class="controls">
      <div class="slider-container">
        <label for="whirl-slider">渦巻き強度: {{ whirlStrength }}</label>
        <input
          id="whirl-slider"
          type="range"
          min="-100"
          max="100"
          v-model.number="whirlStrength"
          class="whirl-slider"
        />
      </div>
    </div>

    <div class="canvas-container">
      <div class="canvas-wrapper">
        <h2>元の画像</h2>
        <canvas ref="originalCanvas"></canvas>
      </div>

      <div class="canvas-wrapper">
        <h2>渦巻きフィルター適用後</h2>
        <canvas ref="whirlCanvas"></canvas>
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
  background: #9c27b0;
}

.whirl-slider {
  accent-color: #9c27b0;
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
