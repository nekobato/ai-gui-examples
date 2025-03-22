<script setup lang="ts">
import { ref, onMounted, watch } from "vue";

// canvasの参照を作成
const originalCanvas = ref<HTMLCanvasElement | null>(null);
const noisyCanvas = ref<HTMLCanvasElement | null>(null);

// ノイズのパラメータ
const noiseStrength = ref(30); // ノイズの強さ（0-100）
const noiseType = ref("gaussian"); // ノイズの種類（gaussian, salt-pepper, perlin）

// 画像オブジェクト
let img: HTMLImageElement;

// 画像を読み込み、処理を行う関数
const processImage = () => {
  if (
    !originalCanvas.value ||
    !noisyCanvas.value ||
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

    // ノイズ用のcanvasも同じサイズに設定
    noisyCanvas.value!.width = 480;
    noisyCanvas.value!.height = 480;

    // 初期状態でノイズを適用
    applyNoise();
  };
};

// ノイズを適用する関数
const applyNoise = () => {
  if (!originalCanvas.value || !noisyCanvas.value) return;

  const origCtx = originalCanvas.value.getContext("2d");
  // willReadFrequently属性を設定してパフォーマンスを向上
  const noiseCtx = noisyCanvas.value.getContext("2d", {
    willReadFrequently: true
  });
  if (!origCtx || !noiseCtx) return;

  // まず元の画像をノイズ用キャンバスにコピー
  noiseCtx.drawImage(originalCanvas.value, 0, 0);

  // 画像データを取得
  const imageData = noiseCtx.getImageData(
    0,
    0,
    noisyCanvas.value.width,
    noisyCanvas.value.height
  );
  const data = imageData.data;

  // ノイズの強さを0-1の範囲に正規化
  const strength = noiseStrength.value / 100;

  // 選択されたノイズタイプに基づいて処理
  switch (noiseType.value) {
    case "gaussian":
      // ガウシアンノイズ（正規分布に基づくランダムノイズ）
      for (let i = 0; i < data.length; i += 4) {
        // Box-Muller変換で正規分布のランダム値を生成
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 =
          Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

        // ノイズの強さに応じたスケーリング
        const noise = z0 * 30 * strength;

        // RGB各チャンネルにノイズを追加
        data[i] = Math.min(255, Math.max(0, data[i] + noise)); // R
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise)); // G
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise)); // B
        // アルファチャンネル（透明度）は変更しない
      }
      break;

    case "salt-pepper":
      // ソルトアンドペッパーノイズ（白と黒のドット）
      for (let i = 0; i < data.length; i += 4) {
        // ノイズの強さに応じた確率でピクセルを変更
        if (Math.random() < strength * 0.1) {
          // 50%の確率で白か黒のノイズを追加
          const value = Math.random() > 0.5 ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = value;
        }
      }
      break;

    case "perlin":
      // パーリンノイズ風の効果（完全なパーリンノイズではなく簡易版）
      const width = noisyCanvas.value.width;
      const height = noisyCanvas.value.height;

      // 簡易的なパーリンノイズ風の効果を生成
      const gridSize = Math.max(4, Math.floor(20 * (1 - strength))); // 強さに応じてグリッドサイズを変更
      const noiseMap = generateSimpleNoise(width, height, gridSize);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const noiseValue = noiseMap[y][x] * strength * 50;

          data[idx] = Math.min(255, Math.max(0, data[idx] + noiseValue));
          data[idx + 1] = Math.min(
            255,
            Math.max(0, data[idx + 1] + noiseValue)
          );
          data[idx + 2] = Math.min(
            255,
            Math.max(0, data[idx + 2] + noiseValue)
          );
        }
      }
      break;
  }

  // 変更した画像データをキャンバスに戻す
  noiseCtx.putImageData(imageData, 0, 0);
};

// 簡易的なノイズマップを生成する関数（パーリンノイズ風の効果用）
const generateSimpleNoise = (
  width: number,
  height: number,
  gridSize: number
) => {
  // グリッドの頂点に乱数値を割り当て
  const gridWidth = Math.ceil(width / gridSize) + 1;
  const gridHeight = Math.ceil(height / gridSize) + 1;

  // グリッドの頂点に乱数値を割り当て
  const grid: number[][] = Array(gridHeight)
    .fill(0)
    .map(() =>
      Array(gridWidth)
        .fill(0)
        .map(() => Math.random() * 2 - 1)
    );

  // 各ピクセルの値を補間して計算
  const noiseMap: number[][] = Array(height)
    .fill(0)
    .map(() => Array(width).fill(0));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // グリッド上の位置
      const gridX = x / gridSize;
      const gridY = y / gridSize;

      // グリッドの四隅の座標
      const x0 = Math.floor(gridX);
      const y0 = Math.floor(gridY);
      const x1 = x0 + 1;
      const y1 = y0 + 1;

      // 補間の重み
      const sx = gridX - x0;
      const sy = gridY - y0;

      // バイリニア補間
      const n0 = lerp(grid[y0][x0], grid[y0][x1], sx);
      const n1 = lerp(grid[y1][x0], grid[y1][x1], sx);
      noiseMap[y][x] = lerp(n0, n1, sy);
    }
  }

  return noiseMap;
};

// 線形補間関数
const lerp = (a: number, b: number, t: number) => {
  return a + t * (b - a);
};

// スライダーの値が変更されたときにノイズを再適用
watch([noiseStrength, noiseType], () => {
  applyNoise();
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
    <h1>ノイズ</h1>

    <div class="controls">
      <div class="control-group">
        <label for="noise-strength">ノイズの強さ: {{ noiseStrength }}</label>
        <input
          id="noise-strength"
          type="range"
          v-model="noiseStrength"
          min="0"
          max="100"
          step="1"
        />
      </div>

      <div class="control-group">
        <label for="noise-type">ノイズの種類:</label>
        <select id="noise-type" v-model="noiseType">
          <option value="gaussian">ガウシアンノイズ</option>
          <option value="salt-pepper">ソルト＆ペッパー</option>
          <option value="perlin">パーリンノイズ風</option>
        </select>
      </div>
    </div>

    <div class="canvas-container">
      <div class="canvas-wrapper">
        <h2>元の画像</h2>
        <canvas ref="originalCanvas"></canvas>
      </div>

      <div class="canvas-wrapper">
        <h2>ノイズ適用後</h2>
        <canvas ref="noisyCanvas"></canvas>
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

select {
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background-color: white;
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
