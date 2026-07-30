/**
 * 參考角練習：Google 試算表紀錄端。
 * 1. 在 script.google.com 建立專案並貼上本檔。
 * 2. 執行 setup() 一次，授權並建立試算表。
 * 3. 部署 > 新增部署作業 > 網頁應用程式；存取權選「所有人」。
 * 4. 將 /exec 網址貼回 PWA 的「紀錄與試算表設定」。
 */
const SHEET_NAME = '參考角練習紀錄';
const HEADERS = ['完成時間', '作答秒數', '答錯次數', '最高連勝', '狀態'];
function sheet_() { const props = PropertiesService.getScriptProperties(); let id = props.getProperty('SHEET_ID'); let ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('參考角練習紀錄'); if (!id) props.setProperty('SHEET_ID', ss.getId()); let sh = ss.getSheetByName(SHEET_NAME); if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.appendRow(HEADERS); sh.setFrozenRows(1); } return sh; }
function setup() { Logger.log(sheet_().getParent().getUrl()); }
function doPost(e) { try { const d = JSON.parse(e.postData.contents); sheet_().appendRow([d.completedAt || new Date(), Number(d.seconds) || 0, Number(d.mistakes) || 0, Number(d.maxStreak) || 0, d.status || '通關']); return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON); } catch (error) { return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(error)})).setMimeType(ContentService.MimeType.JSON); } }
function doGet() { return ContentService.createTextOutput('參考角練習紀錄服務已啟用。'); }
