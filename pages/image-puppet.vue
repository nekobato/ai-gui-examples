<script setup lang="ts">
/*
 * @pages/image-puppet.vue に、画像にメッシュを作り、マウスドラッグで操作できるパペットワープをかける処理
 * /public/me.png をcanvasに表示
 * もう一つのcanvasに、パペットワープをかけた画像を表示
 */

import {
  Application,
  Container,
  Sprite,
  Graphics,
  Mesh,
  MeshGeometry,
  Texture,
  Point
} from "pixi.js";
import { ref, onMounted, watch } from "vue";

// キャンバスの参照
const originalCanvas = ref<HTMLCanvasElement | null>(null);
const puppetCanvas = ref<HTMLCanvasElement | null>(null);

// Pixi.jsアプリケーション
const app = ref<Application | null>(null);

// 画像サイズ
const imageWidth = ref<number>(0);
const imageHeight = ref<number>(0);

// 制御点の設定
const gridSize = 12; // 12x12のグリッド
const controlPoints = ref<
  { x: number; y: number; originalX: number; originalY: number }[]
>([]);
const triangles = ref<{ points: [number, number, number] }[]>([]);

// 変形パラメータ
const warpStrength = ref<number>(50); // 変形強度（0-100）
const warpRange = ref<number>(50); // 影響範囲（0-100）

// ドラッグ操作の状態管理
const isDragging = ref<boolean>(false);
const dragPointIndex = ref<number>(-1);

// メッシュとスプライト
const meshContainer = ref<Container | null>(null);
const meshGraphics = ref<Graphics | null>(null);
const imageMesh = ref<Mesh>();

// 画像を読み込み、初期化する関数
const initializeApp = async () => {
  if (!originalCanvas.value || !puppetCanvas.value) return;

  // 元の画像をcanvasに描画
  const img = new Image();
  img.src = "/me.png";

  await new Promise<void>((resolve) => {
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

      resolve();
    };
  });

  try {
    // Pixi.jsアプリケーションの初期化
    app.value = new Application();

    // アプリケーションの初期化
    await app.value.init({
      width: img.width,
      height: img.height,
      antialias: true,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1
    });

    // puppetCanvasにPixi.jsのキャンバスを追加
    if (puppetCanvas.value && app.value.canvas) {
      puppetCanvas.value.replaceWith(app.value.canvas);
      puppetCanvas.value = app.value.canvas;
    }

    // メッシュコンテナの作成
    meshContainer.value = new Container();
    app.value.stage.addChild(meshContainer.value);

    // メッシュグラフィックスの作成（制御点と線を描画するため）
    meshGraphics.value = new Graphics();
    meshContainer.value.addChild(meshGraphics.value);

    // 制御点の生成
    createControlPoints();

    // 三角形メッシュの生成
    createTriangles();

    // 画像メッシュの作成
    createImageMesh(img);

    // イベントリスナーの設定
    setupEventListeners();
  } catch (error) {
    console.error("Pixi.js初期化エラー:", error);
  }
};

// 制御点を生成する関数
const createControlPoints = () => {
  controlPoints.value = [];

  // グリッドに沿って制御点を配置
  for (let y = 0; y <= gridSize; y++) {
    for (let x = 0; x <= gridSize; x++) {
      const xPos = (imageWidth.value * x) / gridSize;
      const yPos = (imageHeight.value * y) / gridSize;

      controlPoints.value.push({
        x: xPos,
        y: yPos,
        originalX: xPos,
        originalY: yPos
      });
    }
  }
};

// 三角形メッシュを生成する関数
const createTriangles = () => {
  triangles.value = [];

  // グリッドに基づいて三角形を生成
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const topLeft = y * (gridSize + 1) + x;
      const topRight = topLeft + 1;
      const bottomLeft = (y + 1) * (gridSize + 1) + x;
      const bottomRight = bottomLeft + 1;

      // 各グリッドセルを2つの三角形に分割
      triangles.value.push({
        points: [topLeft, bottomLeft, topRight] as [number, number, number]
      });

      triangles.value.push({
        points: [topRight, bottomLeft, bottomRight] as [number, number, number]
      });
    }
  }
};

// 画像メッシュを作成する関数
const createImageMesh = (img: HTMLImageElement) => {
  if (!app.value || !meshContainer.value) return;

  // 画像からテクスチャを作成
  const texture = Texture.from(img.src);

  // 頂点とUVデータの準備
  const { vertices, uvs, indices } = prepareGeometryData();

  try {
    // メッシュの作成
    // MeshGeometryのインスタンスを作成
    const meshGeometry = new MeshGeometry({
      positions: new Float32Array(vertices),
      uvs: new Float32Array(uvs),
      indices: new Uint32Array(indices)
    });

    // Meshの作成
    imageMesh.value = new Mesh({
      texture,
      geometry: meshGeometry
    });

    // メッシュをコンテナに追加（制御点の下に表示）
    meshContainer.value.addChildAt(imageMesh.value, 0);

    // 初回描画
    drawMesh();
  } catch (error) {
    console.error("メッシュ作成エラー:", error);
  }
};

// メッシュのジオメトリデータを準備する関数
const prepareGeometryData = () => {
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // 頂点位置とUV座標の設定
  controlPoints.value.forEach((point) => {
    vertices.push(point.x, point.y);
    uvs.push(
      point.originalX / imageWidth.value,
      point.originalY / imageHeight.value
    );
  });

  // インデックスの設定
  triangles.value.forEach((triangle) => {
    indices.push(...triangle.points);
  });

  return { vertices, uvs, indices };
};

// メッシュジオメトリを更新する関数
const updateMeshGeometry = () => {
  if (!imageMesh.value) return;

  try {
    const { vertices, uvs, indices } = prepareGeometryData();
    const geometry = imageMesh.value.geometry;

    // 新しいデータで更新
    geometry.positions = new Float32Array(vertices);
    geometry.uvs = new Float32Array(uvs);
    geometry.indices = new Uint32Array(indices);
  } catch (error) {
    console.error("メッシュ更新エラー:", error);
  }
};

// メッシュと制御点を描画する関数
const drawMesh = () => {
  if (!meshGraphics.value || !imageMesh.value) return;

  // グラフィックスをクリア
  meshGraphics.value.clear();

  // メッシュジオメトリの更新
  updateMeshGeometry();

  // 制御点の描画
  controlPoints.value.forEach((point, index) => {
    // 制御点の円を描画
    meshGraphics.value!.fill({ color: 0x3498db, alpha: 0.8 });
    meshGraphics.value!.circle(point.x, point.y, 5);
  });

  // 三角形の輪郭を描画
  meshGraphics.value.setStrokeStyle({
    width: 0.5,
    color: 0x3498db,
    alpha: 0.3
  });
  triangles.value.forEach((triangle) => {
    const p1 = controlPoints.value[triangle.points[0]];
    const p2 = controlPoints.value[triangle.points[1]];
    const p3 = controlPoints.value[triangle.points[2]];

    meshGraphics.value!.moveTo(p1.x, p1.y);
    meshGraphics.value!.lineTo(p2.x, p2.y);
    meshGraphics.value!.lineTo(p3.x, p3.y);
    meshGraphics.value!.lineTo(p1.x, p1.y);
  });
};

// イベントリスナーを設定する関数
const setupEventListeners = () => {
  if (!puppetCanvas.value) return;

  // マウスダウンイベント
  puppetCanvas.value.addEventListener("mousedown", (e) => {
    const rect = puppetCanvas.value!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // クリックした位置に最も近い制御点を探す
    let minDistance = Number.MAX_VALUE;
    let closestPointIndex = -1;

    controlPoints.value.forEach((point, index) => {
      const distance = Math.sqrt(
        Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
      );

      if (distance < minDistance && distance < 20) {
        // 20pxの範囲内
        minDistance = distance;
        closestPointIndex = index;
      }
    });

    // 制御点が見つかった場合、ドラッグ開始
    if (closestPointIndex !== -1) {
      isDragging.value = true;
      dragPointIndex.value = closestPointIndex;
    }
  });

  // マウスムーブイベント
  window.addEventListener("mousemove", (e) => {
    if (!isDragging.value || dragPointIndex.value === -1) return;

    const rect = puppetCanvas.value!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 制御点の移動（変形強度を適用）
    const point = controlPoints.value[dragPointIndex.value];
    const strength = warpStrength.value / 100;

    // 元の位置からの変位を計算し、強度を適用
    const dx = x - point.originalX;
    const dy = y - point.originalY;

    point.x = point.originalX + dx * strength;
    point.y = point.originalY + dy * strength;

    // 影響範囲に基づいて他の制御点も移動
    if (warpRange.value > 0) {
      const range =
        ((warpRange.value / 100) *
          Math.max(imageWidth.value, imageHeight.value)) /
        2;

      controlPoints.value.forEach((otherPoint, index) => {
        if (index !== dragPointIndex.value) {
          const distance = Math.sqrt(
            Math.pow(otherPoint.originalX - point.originalX, 2) +
              Math.pow(otherPoint.originalY - point.originalY, 2)
          );

          if (distance <= range) {
            // 距離に基づく影響度を計算（距離が近いほど影響大）
            const influence = (1 - distance / range) * strength * 0.5;

            otherPoint.x = otherPoint.originalX + dx * influence;
            otherPoint.y = otherPoint.originalY + dy * influence;
          }
        }
      });
    }

    // メッシュを再描画
    drawMesh();
  });

  // マウスアップイベント
  window.addEventListener("mouseup", () => {
    isDragging.value = false;
  });
};

// 変形パラメータが変更されたときにメッシュを更新
watch([warpStrength, warpRange], () => {
  if (isDragging.value && dragPointIndex.value !== -1) {
    // ドラッグ中の場合は、現在の制御点の位置を更新
    const point = controlPoints.value[dragPointIndex.value];
    const originalPoint = { x: point.originalX, y: point.originalY };
    const currentPoint = { x: point.x, y: point.y };

    // 一度元の位置に戻してから、新しい強度で再計算
    point.x = originalPoint.x;
    point.y = originalPoint.y;

    // 変位を計算
    const dx = currentPoint.x - originalPoint.x;
    const dy = currentPoint.y - originalPoint.y;

    // 新しい強度を適用
    const strength = warpStrength.value / 100;
    point.x =
      originalPoint.x +
      dx * (strength / (dragPointIndex.value === -1 ? 1 : strength));
    point.y =
      originalPoint.y +
      dy * (strength / (dragPointIndex.value === -1 ? 1 : strength));

    // 影響範囲に基づいて他の制御点も更新
    if (warpRange.value > 0) {
      const range =
        ((warpRange.value / 100) *
          Math.max(imageWidth.value, imageHeight.value)) /
        2;

      controlPoints.value.forEach((otherPoint, index) => {
        if (index !== dragPointIndex.value) {
          // 元の位置に戻す
          otherPoint.x = otherPoint.originalX;
          otherPoint.y = otherPoint.originalY;

          const distance = Math.sqrt(
            Math.pow(otherPoint.originalX - originalPoint.x, 2) +
              Math.pow(otherPoint.originalY - originalPoint.y, 2)
          );

          if (distance <= range) {
            // 距離に基づく影響度を計算
            const influence = (1 - distance / range) * strength * 0.5;

            otherPoint.x = otherPoint.originalX + dx * influence;
            otherPoint.y = otherPoint.originalY + dy * influence;
          }
        }
      });
    }

    // メッシュを再描画
    drawMesh();
  }
});

// リセット機能
const resetMesh = () => {
  // すべての制御点を元の位置に戻す
  controlPoints.value.forEach((point) => {
    point.x = point.originalX;
    point.y = point.originalY;
  });

  // メッシュを再描画
  drawMesh();
};

// コンポーネントがマウントされたときに初期化
onMounted(() => {
  initializeApp();
});
</script>

<template>
  <div class="container">
    <h1>パペットワープ</h1>

    <div class="controls">
      <div class="control-group">
        <label>変形強度: {{ warpStrength }}%</label>
        <input type="range" min="0" max="100" v-model.number="warpStrength" />
      </div>
      <div class="control-group">
        <label>影響範囲: {{ warpRange }}%</label>
        <input type="range" min="0" max="100" v-model.number="warpRange" />
      </div>
      <button @click="resetMesh" class="reset-button">リセット</button>
    </div>

    <div class="canvas-container">
      <div class="canvas-wrapper">
        <h2>元の画像</h2>
        <canvas ref="originalCanvas"></canvas>
      </div>

      <div class="canvas-wrapper">
        <h2>パペット適用</h2>
        <canvas ref="puppetCanvas"></canvas>
        <div class="canvas-info">
          <p>制御点をドラッグして画像を変形できます</p>
        </div>
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

/* コントロールパネルのスタイル */
.controls {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.control-group {
  display: flex;
  flex-direction: column;
  min-width: 200px;
}

.control-group label {
  margin-bottom: 5px;
  font-weight: bold;
}

input[type="range"] {
  width: 100%;
  margin: 5px 0;
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
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  background: #3498db;
}

.reset-button {
  padding: 8px 16px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  align-self: center;
}

.reset-button:hover {
  background-color: #c0392b;
}

/* キャンバスコンテナのスタイル */
.canvas-container {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.canvas-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

h2 {
  margin-bottom: 10px;
  color: #333;
}

canvas {
  border: 1px solid #ccc;
  max-width: 100%;
  width: 500px;
  height: 500px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}

.canvas-info {
  margin-top: 10px;
  font-size: 14px;
}
</style>
