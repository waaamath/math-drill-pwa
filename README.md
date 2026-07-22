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
