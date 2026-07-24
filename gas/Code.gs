/**
 * 整數加減過關 — 成績紀錄收集 Web App
 *
 * 部署步驟：
 * 1. 到 https://script.google.com 新增專案，把這段貼進 Code.gs
 * 2. 先執行一次 setup（授權），會建立一個試算表並記住其 ID
 *    （或把下面 SHEET_ID 換成你自己的試算表 ID，留空則自動建立）
 * 3. 右上「部署」→「新增部署作業」→ 類型選「網頁應用程式」
 *    - 執行身分：我
 *    - 具有存取權：任何人
 * 4. 複製產生的網址，貼到 level.js 的 RECORD_URL
 */

const SHEET_ID = "";              // 留空＝自動建立一個新試算表
const SHEET_NAME = "過關紀錄";
const HEADERS = ["時間", "版本", "完成", "選擇關卡", "到達關卡", "作答數", "答錯數", "用時(秒)", "答對率", "錯題明細"];

function getSheet_() {
  let ss;
  if (SHEET_ID) {
    ss = SpreadsheetApp.openById(SHEET_ID);
  } else {
    const saved = PropertiesService.getScriptProperties().getProperty("SS_ID");
    if (saved) {
      ss = SpreadsheetApp.openById(saved);
    } else {
      ss = SpreadsheetApp.create("整數加減過關－成績紀錄");
      PropertiesService.getScriptProperties().setProperty("SS_ID", ss.getId());
    }
  }
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

// 執行一次以完成授權並得知試算表位置
function setup() {
  const sh = getSheet_();
  Logger.log("試算表網址：" + sh.getParent().getUrl());
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sh = getSheet_();
    const answered = Number(data.作答數) || 0;
    const wrong = Number(data.答錯數) || 0;
    const rate = answered > 0 ? Math.round((answered - wrong) / answered * 100) + "%" : "-";
    const wrongText = (data.錯題 || [])
      .map((w) => `${w.題目} = ${w.正確答案}（你:${w.你的答案}）`)
      .join("\n");
    sh.appendRow([
      data.時間 ? new Date(data.時間) : new Date(),
      data.版本 || "",
      data.完成 || "",
      data.選擇關卡 || "",
      data.到達關卡 || "",
      answered,
      wrong,
      data.用時秒 || "",
      rate,
      wrongText,
    ]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 瀏覽器直接開網址時的簡單回應（測試用）
function doGet() {
  return ContentService.createTextOutput("整數加減過關 紀錄收集器運作中。");
}
