# 整數四則運算練習（PWA）

平板可安裝的互動式練習網頁。兩個整數的加、減、乘、除練習，內建數字鍵盤與正負（±）鍵。

## 功能
- 自由選擇要練習的運算：＋ － × ÷（可複選）
- 分別設定「第一個數字」與「第二個數字」的整數範圍
- 可選題數（10 / 20 / 30）
- 螢幕數字鍵盤 + ± 正負鍵（也支援外接鍵盤：數字、`-`、Backspace、Enter）
- 除法自動出「整除」題目
- 完成後顯示得分與錯題清單
- 支援離線使用、可加到主畫面（PWA）

## 本機測試
PWA 的 Service Worker 需要透過 http（不能用 file://）開啟：

```bash
# 任選一種
python -m http.server 8000
# 或
npx serve
```

然後在平板／瀏覽器開 `http://<電腦IP>:8000`。

## 部署到網路（免費）
把整個資料夾推到 GitHub，再用 **GitHub Pages** 發佈即可安裝：

```bash
git init
git add .
git commit -m "整數四則運算練習 PWA 範本"
git branch -M main
git remote add origin https://github.com/<你的帳號>/<repo名稱>.git
git push -u origin main
```

到 GitHub repo → Settings → Pages → Branch 選 `main` / `root` → 儲存。
幾分鐘後用平板開啟該網址，Safari／Chrome 選「加入主畫面」即可當 App 使用。

## 加減過關獨立版（level.html）
`level.html` 是**只有過關模式**的獨立頁面，可單獨安裝、單獨發連結：
`https://waaamath.github.io/math-drill-pwa/level.html`

功能：8 關正負加減闖關（第 8 關混合）、自選關卡、錯題複習，結束後可把成績**回傳 Google 試算表**。

### 設定成績回傳（Apps Script → Google 試算表）
1. 開 https://script.google.com 新增專案，把 `gas/Code.gs` 內容整段貼進去
2. 執行一次 `setup` 函式（授權），Log 會顯示自動建立的試算表網址
3. 「部署 → 新增部署作業 → 網頁應用程式」，執行身分＝我、存取權＝任何人
4. 複製部署網址，貼到 `level.js` 最上方的 `RECORD_URL`，push 後即開始記錄

回傳欄位：時間、版本、完成狀態、選擇關卡、到達關卡、作答數、答錯數、用時、答對率、錯題明細。
（`RECORD_URL` 留空時仍可正常練習，只是不上傳、結果頁會註明。）

## 檔案結構
```
index.html              頁面結構
style.css               樣式（深色、平板大按鈕）
app.js                  練習邏輯
manifest.webmanifest    PWA 設定
sw.js                   離線快取
icons/                  App 圖示
```

## 之後可擴充
- 計時 / 限時模式
- 錯題重練
- 記錄歷史成績
- 音效與動畫回饋
