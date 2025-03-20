<script setup lang="ts">
import { ref, onMounted, watch } from "vue";

// canvasの参照を作成
const originalCanvas = ref<HTMLCanvasElement | null>(null);
const blurredCanvas = ref<HTMLCanvasElement | null>(null);

// モーションブラーのパラメータ
const blurStrength = ref(10); // ブラーの強さ（0-50）
const blurAngle = ref(0); // ブラーの方向（0-360度）

// 画像オブジェクト
let img: HTMLImageElement;

// 画像を読み込み、処理を行う関数
const processImage = () => {
  if (
    !originalCanvas.value ||
    !blurredCanvas.value ||
    typeof window === "undefined"
  )
    return;

  // Imageオブジェクトはクライアントサイドでのみ作成
  img = new Image();
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

    // ブラー用のcanvasも同じサイズに設定
    blurredCanvas.value!.width = 480;
    blurredCanvas.value!.height = 480;

    // 初期状態でモーションブラーを適用
    applyMotionBlur();
  };
};

// モーションブラーを適用する関数
const applyMotionBlur = () => {
  if (!originalCanvas.value || !blurredCanvas.value) return;

  const origCtx = originalCanvas.value.getContext("2d");
  const blurCtx = blurredCanvas.value.getContext("2d");
  if (!origCtx || !blurCtx) return;

  // ブラー用キャンバスをクリア
  blurCtx.clearRect(
    0,
    0,
    blurredCanvas.value.width,
    blurredCanvas.value.height
  );

  // 元の画像データを取得
  const imageData = origCtx.getImageData(
    0,
    0,
    originalCanvas.value.width,
    originalCanvas.value.height
  );

  // モーションブラーの強さに応じてステップ数を決定
  const steps = Math.max(1, Math.floor(blurStrength.value));

  // ブラーの方向をラジアンに変換
  const angleRad = (blurAngle.value * Math.PI) / 180;

  // 各ステップでのX, Y方向の移動量
  const deltaX = Math.cos(angleRad);
  const deltaY = Math.sin(angleRad);

  // 元の画像を描画（アルファ値を下げて）
  blurCtx.globalAlpha = 1 / (steps + 1);
  blurCtx.drawImage(originalCanvas.value, 0, 0);

  // 複数回ずらして描画することでモーションブラー効果を作成
  for (let i = 1; i <= steps; i++) {
    const offsetX = deltaX * i * (blurStrength.value / 10);
    const offsetY = deltaY * i * (blurStrength.value / 10);

    blurCtx.drawImage(originalCanvas.value, offsetX, offsetY);
  }

  // アルファ値を元に戻す
  blurCtx.globalAlpha = 1.0;
};

// スライダーの値が変更されたときにモーションブラーを再適用
watch([blurStrength, blurAngle], () => {
  applyMotionBlur();
});

// コンポーネントがマウントされたときに画像処理を実行（クライアントサイドのみ）
onMounted(() => {
  // サーバーサイドレンダリング時は実行しない
  if (typeof window !== "undefined") {
    processImage();
  }
});
</script>

<template>
  <div class="container">
    <h1>モーションブラー</h1>

    <div class="controls">
      <div class="control-group">
        <label for="blur-strength">ブラーの強さ: {{ blurStrength }}</label>
        <input
          id="blur-strength"
          type="range"
          v-model="blurStrength"
          min="0"
          max="50"
          step="1"
        />
      </div>

      <div class="control-group">
        <label for="blur-angle">ブラーの方向: {{ blurAngle }}°</label>
        <input
          id="blur-angle"
          type="range"
          v-model="blurAngle"
          min="0"
          max="360"
          step="1"
        />
      </div>
    </div>

    <div class="canvas-container">
      <div class="canvas-wrapper">
        <h2>元の画像</h2>
        <canvas ref="originalCanvas"></canvas>
      </div>

      <div class="canvas-wrapper">
        <h2>モーションブラー</h2>
        <canvas ref="blurredCanvas"></canvas>
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
  max-width: 600px;
  margin: 0 auto 30px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.control-group {
  margin-bottom: 15px;
}

.control-group:last-child {
  margin-bottom: 0;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input[type="range"] {
  width: 100%;
  margin-top: 5px;
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
  border: 1px solid #ddd;
}
</style>
