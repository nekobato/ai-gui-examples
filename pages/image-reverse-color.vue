<script setup lang="ts">
import { ref, onMounted } from "vue";

// canvasの参照を作成
const originalCanvas = ref<HTMLCanvasElement | null>(null);
const reversedCanvas = ref<HTMLCanvasElement | null>(null);

// 画像を読み込み、処理を行う関数
const processImage = () => {
  if (!originalCanvas.value || !reversedCanvas.value) return;

  const img = new Image();
  img.src = "/me.png";

  img.onload = () => {
    // 元画像をcanvasに描画
    const origCtx = originalCanvas.value!.getContext("2d");
    if (!origCtx) return;

    // canvasのサイズを設定（480px x 480px固定）
    originalCanvas.value!.width = 480;
    originalCanvas.value!.height = 480;

    // 画像をキャンバスに合わせて描画（アスペクト比を維持）
    const scale = Math.min(
      originalCanvas.value!.width / img.width,
      originalCanvas.value!.height / img.height
    );
    const x = (originalCanvas.value!.width - img.width * scale) / 2;
    const y = (originalCanvas.value!.height - img.height * scale) / 2;

    origCtx.drawImage(
      img,
      0,
      0,
      img.width,
      img.height,
      x,
      y,
      img.width * scale,
      img.height * scale
    );

    // 反転用のcanvasも同じサイズに設定
    const reversedCtx = reversedCanvas.value!.getContext("2d");
    if (!reversedCtx) return;

    reversedCanvas.value!.width = 480;
    reversedCanvas.value!.height = 480;

    // 元の画像データを取得
    const imageData = origCtx.getImageData(
      0,
      0,
      originalCanvas.value!.width,
      originalCanvas.value!.height
    );

    // 新しい画像データを作成
    const newImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    const data = newImageData.data;

    // 各ピクセルの色値を反転
    for (let i = 0; i < data.length; i += 4) {
      // R, G, B値を反転（255から引く）
      data[i] = 255 - data[i]; // R
      data[i + 1] = 255 - data[i + 1]; // G
      data[i + 2] = 255 - data[i + 2]; // B
      // アルファ値（透明度）はそのまま
    }

    // 反転した画像データを描画
    reversedCtx.putImageData(newImageData, 0, 0);
  };
};

// コンポーネントがマウントされたときに画像処理を実行
onMounted(() => {
  processImage();
});
</script>

<template>
  <div class="container">
    <h1>階調の反転</h1>

    <div class="canvas-container">
      <div class="canvas-wrapper">
        <h2>元の画像</h2>
        <canvas ref="originalCanvas"></canvas>
      </div>

      <div class="canvas-wrapper">
        <h2>反転化</h2>
        <canvas ref="reversedCanvas"></canvas>
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

h2 {
  margin-bottom: 10px;
}

canvas {
  width: 480px;
  height: 480px;
}
</style>
