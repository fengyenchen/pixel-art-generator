# Pixel Art Generator

一個以 React、TypeScript 與原生 Canvas API 製作的像素繪圖及圖片轉換工具。所有影像處理都在瀏覽器端完成，不會將圖片上傳到伺服器。

## 功能特色

- 將圖片拖放至畫布，或透過檔案選擇器匯入
- 使用區塊平均色將照片轉換成像素圖
- 使用 Oklab 色彩空間與 K-means 建立精簡調色盤
- 可調整像素區塊、色彩數量及畫布縮放比例
- 可選擇整理孤立色塊，減少零散色彩雜訊
- 提供鉛筆、橡皮擦、填色與吸管工具
- 支援自訂繪圖顏色與網格顯示
- 一鍵清空畫布，且可復原清空操作
- 調整畫布尺寸時保留內容，縮小時置中裁切、放大時置中補透明區域
- 使用 Zustand 管理最多 50 筆撤銷與重做紀錄
- 將完成的作品匯出為 PNG
- 內建使用說明視窗與響應式操作介面

## 使用方式

### 匯入圖片

可以點擊頁面頂部的「匯入圖片」，也可以將圖片直接拖放到中央畫布區域。匯入後，工具會依照目前的像素區塊與色彩數量設定進行轉換。

### 編輯畫布

左側工具列提供：

- 鉛筆：繪製目前選擇的顏色
- 橡皮擦：清除指定像素區塊
- 填色：填滿相連且顏色相同的區域
- 吸管：從畫布取得顏色
- 清空：清除整張畫布，可使用復原找回

右側設定面板可調整畫布寬高、像素區塊、色彩數量、縮放比例、網格及孤立色塊整理。

加入手繪內容後，調整像素區塊只會影響後續筆刷與網格，不會重新使用原始圖片覆蓋手繪內容；色彩數量也不會破壞手繪色彩。

### 快捷鍵

| 功能 | Windows / Linux | macOS |
| --- | --- | --- |
| 復原 | `Ctrl + Z` | `Command + Z` |
| 重做 | `Ctrl + Y` 或 `Ctrl + Shift + Z` | `Command + Shift + Z` |

### 匯出

點擊頁面頂部的「匯出 PNG」即可下載作品。匯入圖片與純手繪畫布都能匯出。

## 技術棧

- Vite
- React 19
- TypeScript
- Tailwind CSS 4
- HTML5 Canvas API
- Zustand
- Base UI Slider
- Lucide React
- React Color

## 開始使用

需要先安裝 Node.js 與 npm。

```bash
# 安裝相依套件
npm install

# 啟動開發伺服器
npm run dev
```

啟動後依照終端機顯示的網址在瀏覽器開啟專案。

## 可用指令

```bash
npm run dev      # 啟動開發伺服器
npm run build    # 執行 TypeScript 檢查並建立正式版本
npm run preview  # 預覽正式建置結果
npm run lint     # 執行 ESLint
```

## 專案結構

```text
src/
├── components/          # 頁面、工具列、控制面板與通用 UI 元件
│   ├── Canvas/          # Canvas 顯示與互動區域
│   └── ui/              # 基礎 UI 元件
├── hooks/               # 圖片轉換與 Canvas 繪圖 Hooks
├── store/               # Zustand 編輯歷史紀錄
├── types/               # 各模組的 TypeScript 型別
├── utils/               # 像素化、Canvas 快照與 PNG 匯出工具
├── App.tsx              # 應用程式狀態與主要版面
├── index.css            # Tailwind 主題與全域樣式
└── main.tsx             # React 入口
```

## 圖片處理流程

```text
原始圖片
→ 縮放至畫布尺寸
→ 計算各像素區塊平均色
→ Oklab K-means 調色盤量化
→ 對應最接近的調色盤顏色
→ 選擇性整理孤立色塊
→ 繪製至 Canvas
```

## 隱私

圖片讀取、轉換、編輯與 PNG 匯出皆使用瀏覽器原生 API 在本機執行，專案本身不會將圖片傳送至外部服務。
