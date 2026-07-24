/**
 * 整數加減過關 — 成績紀錄收集 Web App（兩階段：登錄即記錄、結束時更新同列）
 *
 * 更新既有部署（網址不變）：
 * 1. 把這整段貼回 Apps Script 的 Code.gs（覆蓋舊的）
 * 2. 執行一次 setup（授權 / 建立新分頁）
 * 3. 右上「部署 → 管理部署作業 → 編輯(鉛筆) → 版本選『新版本』→ 部署」
 *    這樣 /exec 網址不變，前端不用改。
 */

const SHEET_ID = "";               // 留空＝沿用先前自動建立的試算表
const SHEET_NAME = "闖關紀錄";       // 新分頁（新欄位），舊的「過關紀錄」分頁不受影響
const HEADERS = ["Session", "上線時間", "結束時間", "狀態", "選擇關卡", "到達關卡", "總題數", "答錯數", "用時(秒)", "答對率", "錯題明細"];

function getSheet_() {
  let ss;
  if (SHEET_ID) {
    ss = SpreadsheetApp.openById(SHEET_ID);
  } else {
    const saved = PropertiesService.getScriptProperties().getProperty("SS_ID");
    if (saved) ss = SpreadsheetApp.openById(saved);
    else {
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

function setup() {
  const sh = getSheet_();
  Logger.log("試算表網址：" + sh.getParent().getUrl());
}

// 依 Session 找列號，找不到回 -1
function findRow_(sh, session) {
  const last = sh.getLastRow();
  if (last < 2 || !session) return -1;
  const col = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < col.length; i++) {
    if (String(col[i][0]) === String(session)) return i + 2;
  }
  return -1;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    const data = JSON.parse(e.postData.contents);
    const sh = getSheet_();

    if (data.action === "start") {
      // 登錄：新增一列「進行中」
      sh.appendRow([
        data.session || "", data.上線時間 ? new Date(data.上線時間) : new Date(),
        "", "進行中", data.選擇關卡 || "", "", "", "", "", "", "",
      ]);
      return json_({ ok: true, phase: "start" });
    }

    // finish：更新同一列（找不到就補一列）
    const answered = Number(data.總題數 != null ? data.總題數 : data.作答數) || 0;
    const wrong = Number(data.答錯數) || 0;
    const rate = answered > 0 ? Math.round((answered - wrong) / answered * 100) + "%" : "-";
    const wrongText = (data.錯題 || [])
      .map((w) => `${w.題目} = ${w.正確答案}（你:${w.你的答案}）`).join("\n");
    const endTime = data.結束時間 ? new Date(data.結束時間) : new Date();

    let row = findRow_(sh, data.session);
    if (row === -1) {
      sh.appendRow([
        data.session || "", endTime, endTime, data.完成 || "未通關",
        data.選擇關卡 || "", data.到達關卡 || "", answered, wrong, data.用時秒 || "", rate, wrongText,
      ]);
    } else {
      sh.getRange(row, 3).setValue(endTime);                 // 結束時間
      sh.getRange(row, 4).setValue(data.完成 || "未通關");     // 狀態
      sh.getRange(row, 6).setValue(data.到達關卡 || "");       // 到達關卡
      sh.getRange(row, 7).setValue(answered);                 // 總題數
      sh.getRange(row, 8).setValue(wrong);                    // 答錯數
      sh.getRange(row, 9).setValue(data.用時秒 || "");         // 用時
      sh.getRange(row, 10).setValue(rate);                    // 答對率
      sh.getRange(row, 11).setValue(wrongText);               // 錯題
    }
    return json_({ ok: true, phase: "finish" });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput("整數加減過關 紀錄收集器運作中。");
}
