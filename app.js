const GOAL = 20;
const DEFAULT_RECORD_URL = 'https://script.google.com/macros/s/AKfycbyE4A1ZNY2T4ixLMwfHOBorCdB7VXSUZ5QEMg_GmbftgSBljDnmgCXhzhJmtoIPbcutow/exec';
const $ = (selector) => document.querySelector(selector);
let state = { angle: 0, reference: 0, streak: 0, mistakes: 0, startedAt: 0, history: [], locked: false };

function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(`#${id}`).classList.add('active'); }
function pad(n) { return String(n).padStart(2, '0'); }
function timeText(seconds) { return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`; }
function referenceAngle(angle) { return angle < 90 ? angle : angle < 180 ? 180 - angle : angle < 270 ? angle - 180 : 360 - angle; }
function randomAngle() { let n; do { n = Math.floor(Math.random() * 361); } while (n % 90 === 0); return n; }
function renderQuestion() {
  state.angle = randomAngle(); state.reference = referenceAngle(state.angle); state.locked = false;
  $('#angle-value').textContent = state.angle;
  $('#answer-input').value = ''; $('#answer-input').disabled = false; $('#feedback').textContent = ''; $('#feedback').className = 'feedback';
  $('#streak-value').innerHTML = `${state.streak} <small>/ ${GOAL}</small>`; $('#progress-fill').style.width = `${state.streak / GOAL * 100}%`;
  setTimeout(() => $('#answer-input').focus(), 50);
}
function startGame() { state = { angle: 0, reference: 0, streak: 0, mistakes: 0, startedAt: Date.now(), history: [], locked: false }; show('quiz-screen'); renderQuestion(); }
function submitAnswer() {
  const raw = $('#answer-input').value.trim(); if (state.locked || raw === '' || !/^\d+$/.test(raw)) return;
  state.locked = true; const answer = Number(raw); const correct = answer === state.reference;
  state.history.push({ angle: state.angle, answer, reference: state.reference, correct });
  const feedback = $('#feedback'); $('#answer-input').disabled = true;
  if (correct) { state.streak += 1; feedback.textContent = '正確。'; feedback.className = 'feedback ok'; if (state.streak === GOAL) { setTimeout(finishGame, 550); return; } setTimeout(renderQuestion, 500); }
  else { state.mistakes += 1; state.streak = 0; feedback.textContent = `再想一下：參考角是 ${state.reference}°。連勝重新計算。`; feedback.className = 'feedback bad'; setTimeout(renderQuestion, 1450); }
}
function pressKey(key) {
  if (state.locked) return;
  const input = $('#answer-input');
  if (key === 'back') input.value = input.value.slice(0, -1);
  else if (key === 'clear') input.value = '';
  else if (input.value.length < 2) input.value += key;
}
function resultRecord() { const seconds = Math.round((Date.now() - state.startedAt) / 1000); return { completedAt: new Date().toLocaleString('zh-TW'), seconds, mistakes: state.mistakes, maxStreak: GOAL, status: '通關' }; }
function finishGame() { const record = resultRecord(); $('#elapsed-value').textContent = timeText(record.seconds); $('#mistake-value').textContent = record.mistakes; show('result-screen'); uploadRecord(record); }
async function uploadRecord(record) {
  const url = DEFAULT_RECORD_URL; const status = $('#upload-status');
  if (!url) { status.textContent = '尚未設定試算表連結；你可以下載 CSV 留存紀錄。'; return; }
  status.textContent = '正在上傳到試算表…';
  try { await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(record) }); status.textContent = '已送出試算表上傳請求。'; }
  catch { status.textContent = '上傳暫時失敗，仍可下載 CSV。'; }
}
function downloadCsv() { const r = resultRecord(); const rows = [['完成時間','作答秒數','答錯次數','最高連勝','狀態'], [r.completedAt,r.seconds,r.mistakes,r.maxStreak,r.status]]; const csv = '\uFEFF' + rows.map(row => row.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'})); a.download = `參考角練習紀錄_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(a.href); }
$('#start-button').addEventListener('click', startGame); $('#submit-button').addEventListener('click', submitAnswer); $('#answer-input').addEventListener('keydown', e => { if (e.key === 'Enter') submitAnswer(); });
document.querySelectorAll('.keypad button').forEach(button => button.addEventListener('click', () => pressKey(button.dataset.key)));
document.addEventListener('keydown', event => { if (!$('#quiz-screen').classList.contains('active')) return; if (/^[0-9]$/.test(event.key)) pressKey(event.key); else if (event.key === 'Backspace') pressKey('back'); else if (event.key === 'Enter') submitAnswer(); });
$('#exit-button').addEventListener('click', () => show('home-screen')); $('#again-button').addEventListener('click', startGame); $('#home-button').addEventListener('click', () => show('home-screen')); $('#download-button').addEventListener('click', downloadCsv);
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
