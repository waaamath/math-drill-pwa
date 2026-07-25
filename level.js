// ===== 整數加減過關（獨立頁）=====
const VERSION = "v18";

// 答對稱讚語（隨機）
const PRAISES = ["✨ 答對！", "🌟 Good！", "💯 太棒了！", "😊 正確！"];
function praise() { return PRAISES[Math.floor(Math.random() * PRAISES.length)]; }

// 吉祥物：紫色小貓「妍妍貓」，依心情切換表情
function star(cx, cy, s) {
  return `<path transform="translate(${cx} ${cy}) scale(${s})" fill="#FFD76A"
    d="M0 -1 L0.25 -0.34 L0.95 -0.31 L0.4 0.13 L0.59 0.81 L0 0.42 L-0.59 0.81 L-0.4 0.13 L-0.95 -0.31 L-0.25 -0.34 Z"/>`;
}
function mascotSvg(mood) {
  const base = `
    <path d="M28 42 L36 12 L60 34 Z" fill="#8B7BFF"/>
    <path d="M92 42 L84 12 L60 34 Z" fill="#8B7BFF"/>
    <path d="M35 34 L39 20 L50 32 Z" fill="#FF9EC4"/>
    <path d="M85 34 L81 20 L70 32 Z" fill="#FF9EC4"/>
    <ellipse cx="60" cy="68" rx="42" ry="38" fill="#9C8BFF"/>
    <ellipse cx="60" cy="74" rx="30" ry="24" fill="#EFEAFF"/>
    <circle cx="38" cy="76" r="6" fill="#FF9EC4" opacity=".75"/>
    <circle cx="82" cy="76" r="6" fill="#FF9EC4" opacity=".75"/>
    <path d="M60 70 l-3 4 h6 Z" fill="#FF9EC4"/>`;
  const eyesOpen = `<circle cx="47" cy="64" r="6.5" fill="#3E2E6E"/><circle cx="73" cy="64" r="6.5" fill="#3E2E6E"/>
    <circle cx="49" cy="61.5" r="2.2" fill="#fff"/><circle cx="75" cy="61.5" r="2.2" fill="#fff"/>`;
  let face, extra = "";

  if (mood === "happy" || mood === "combo" || mood === "win") {
    // 瞇眼笑 + 開心大嘴
    face = `<path d="M41 66 q6 -7 12 0" stroke="#3E2E6E" stroke-width="2.8" fill="none" stroke-linecap="round"/>
      <path d="M67 66 q6 -7 12 0" stroke="#3E2E6E" stroke-width="2.8" fill="none" stroke-linecap="round"/>
      <path d="M52 74 q8 9 16 0" stroke="#3E2E6E" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  } else if (mood === "confused") {
    // 疑惑：一大一小眼、波浪嘴、藍色汗滴
    face = `<circle cx="47" cy="64" r="6.5" fill="#3E2E6E"/><circle cx="49" cy="61.5" r="2.2" fill="#fff"/>
      <circle cx="73" cy="65" r="3.6" fill="#3E2E6E"/>
      <path d="M53 78 q3 -4 6 0 q3 4 6 0" stroke="#3E2E6E" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    extra = `<path d="M94 42 q-5 7 0 9 q5 -2 0 -9 Z" fill="#7EC8FF"/>`;
  } else {
    // idle
    face = eyesOpen + `<path d="M54 76 q6 6 12 0" stroke="#3E2E6E" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  }
  if (mood === "combo" || mood === "win") {
    extra += star(40, 10, 6) + star(60, 4, 7) + star(80, 10, 6);
  }
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">${base}${face}${extra}</svg>`;
}

// 顯示表情 + 跳動；delay 後回到 idle
function mascotReact(mood, big) {
  const m = document.getElementById("mascot");
  if (!m) return;
  m.innerHTML = mascotSvg(mood);
  m.classList.remove("react", "react-big");
  void m.offsetWidth;                 // 強制 reflow 讓動畫重播
  if (mood !== "confused") m.classList.add(big ? "react-big" : "react");
  clearTimeout(m._revert);
  m._revert = setTimeout(() => {
    m.innerHTML = mascotSvg("idle");
    m.classList.remove("react", "react-big");
  }, big ? 1100 : 900);
}

// ★ Apps Script Web App 網址，紀錄會回傳到 Google 試算表 ★
const RECORD_URL = "https://script.google.com/macros/s/AKfycbwmV0YlYeg6_1yw0EIcQMb4d14sl88qJpkX7l7bxqEXnfGZnzvKtcJtTsxlc5wPbddWtw/exec";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ---- 關卡定義：7 種正負組合 + 第 8 關混合 ----
const LEVELS = [
  { name: "正 － 正", s1: 1,  op: "-", s2: 1 },
  { name: "負 ＋ 正", s1: -1, op: "+", s2: 1 },
  { name: "負 － 正", s1: -1, op: "-", s2: 1 },
  { name: "正 － 負", s1: 1,  op: "-", s2: -1 },
  { name: "負 － 負", s1: -1, op: "-", s2: -1 },
  { name: "正 ＋ 負", s1: 1,  op: "+", s2: -1 },
  { name: "負 ＋ 負", s1: -1, op: "+", s2: -1 },
];
const GOAL = 30;                 // 每關需連續答對的題數
const REVIEW_TRIGGER = 5;        // 累積錯幾題就進錯題複習
// 第 8 關＝前 7 關全混合；第 9 關＝自選題型混合
const TOTAL_LEVELS = LEVELS.length + 2;

function levelName(idx) {
  if (idx < LEVELS.length) return LEVELS[idx].name;
  if (idx === LEVELS.length) return "混合（前 7 關綜合）";
  return "自選混合";
}
// 第 9 關要混的題型組合（依 lvl.customMix；空則全部）
function mixPool() {
  return (lvl.customMix && lvl.customMix.length) ? lvl.customMix : LEVELS.map((_, i) => i);
}

// ---- 狀態 ----
let settings = { minA: 1, maxA: 20, minB: 1, maxB: 20 };
let quiz = { input: "" };
let lvl = { plan: [], step: 0, idx: 0, streak: 0, phase: "normal", q: null, wrongPool: [], review: null, customMix: [] };
// 本次使用的統計紀錄
let stats = null;

// ---- 工具 ----
function show(id) {
  $$(".screen").forEach((s) => s.classList.remove("active"));
  $(`#${id}`).classList.add("active");
}
function randInt(min, max) {
  min = Math.ceil(min); max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
// 第一個數字直接顯示、第二個數字若為負數加括號
function fmt(n) { return n < 0 ? `(${n})` : `${n}`; }
function showSetupError(msg) { $("#setup-error").textContent = msg; }

// ---- 出題 ----
function magFrom(min, max) {
  const hi = Math.max(Math.abs(min), Math.abs(max));
  return randInt(1, Math.max(1, hi));
}
function pickCombo() {
  if (lvl.idx < LEVELS.length) return LEVELS[lvl.idx];                            // 1-7
  if (lvl.idx === LEVELS.length) return LEVELS[randInt(0, LEVELS.length - 1)];    // 8：全混合
  const pool = mixPool();                                                          // 9：自選混合
  return LEVELS[pool[randInt(0, pool.length - 1)]];
}
function makeLevelQuestion() {
  const L = pickCombo();
  const a = L.s1 * magFrom(settings.minA, settings.maxA);
  const b = L.s2 * magFrom(settings.minB, settings.maxB);
  const answer = L.op === "+" ? a + b : a - b;
  return { a, b, op: L.op, answer, text: `${a} ${L.op} ${fmt(b)} =`, levelNo: lvl.idx + 1 };
}

// ---- 建立關卡勾選清單（1-8 雙排、第 9 關整排在最下）----
function buildLevelSelect() {
  const box = $("#levels-select");
  box.innerHTML = "";
  for (let i = 0; i < TOTAL_LEVELS; i++) {
    const label = document.createElement("label");
    label.className = "lvl-toggle" + (i === TOTAL_LEVELS - 1 ? " full" : "");
    label.innerHTML = `<input type="checkbox" value="${i}" checked><span>⭐ 第 ${i + 1} 關　${levelName(i)}</span>`;
    box.appendChild(label);
  }
}

// ---- 開始 ----
function start() {
  const minA = parseInt($("#minA").value, 10);
  const maxA = parseInt($("#maxA").value, 10);
  const minB = parseInt($("#minB").value, 10);
  const maxB = parseInt($("#maxB").value, 10);
  if ([minA, maxA, minB, maxB].some((n) => Number.isNaN(n))) return showSetupError("範圍必須是數字");
  if (minA > maxA || minB > maxB) return showSetupError("最小值不能大於最大值");

  const plan = [...$$("#levels-select input:checked")]
    .map((c) => parseInt(c.value, 10)).sort((a, b) => a - b);
  if (plan.length === 0) return showSetupError("請至少勾選一關");

  // 第 9 關的混合來源＝勾選的 1～7 關（沒勾任何則預設全部 7 種）
  const customMix = plan.filter((i) => i < LEVELS.length);

  settings = { minA, maxA, minB, maxB };
  lvl = { plan, step: 0, idx: plan[0], streak: 0, phase: "normal", q: null, wrongPool: [], review: null, customMix };
  stats = {
    session: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    startTime: Date.now(), plan: plan.map((i) => i + 1),
    answered: 0, wrong: 0, wrongList: [], reachedLevel: plan[0] + 1, finalized: false,
  };
  startRecord();          // 登錄即先記一列「進行中」

  showSetupError("");
  show("quiz");
  renderLevelQuestion();
}

// ---- 一般答題 ----
function renderLevelQuestion() {
  lvl.phase = "normal";
  lvl.q = makeLevelQuestion();
  quiz.input = "";
  $("#review-panel").hidden = true;
  let bannerName = levelName(lvl.idx);
  if (lvl.idx === LEVELS.length + 1) {
    bannerName = `自選混合（${mixPool().map((i) => LEVELS[i].name.replace(/ /g, "")).join("・")}）`;
  }
  $("#level-banner").innerHTML =
    `第 ${lvl.idx + 1} 關　${bannerName}<span class="sub">進度 ${lvl.step + 1} / ${lvl.plan.length} 關</span>`;
  $("#question").textContent = lvl.q.text;
  updateAnswerBox();
  $("#feedback").textContent = "";
  $("#feedback").className = "feedback";
  $("#answer").className = "answer-box";
  updateLevelProgress();
}
function updateLevelProgress() {
  if (lvl.phase === "review") {
    $("#progress-bar").style.width = (lvl.review.pos / lvl.review.queue.length * 100) + "%";
    $("#progress-text").textContent = `複習 ${lvl.review.pos} / ${lvl.review.queue.length}`;
  } else {
    $("#progress-bar").style.width = (lvl.streak / GOAL * 100) + "%";
    $("#progress-text").textContent = `連續 ${lvl.streak} / ${GOAL}　錯 ${lvl.wrongPool.length}/${REVIEW_TRIGGER}`;
  }
}

// ---- 輸入 ----
function updateAnswerBox() {
  const box = $("#answer");
  if (quiz.input === "" || quiz.input === "-") {
    box.innerHTML = quiz.input === "-" ? "-<span class='placeholder'>?</span>" : "<span class='placeholder'>輸入答案 ✨</span>";
  } else {
    box.textContent = quiz.input;
  }
}
function pressKey(key) {
  if (key === "back") quiz.input = quiz.input.slice(0, -1);
  else if (key === "sign") quiz.input = quiz.input.startsWith("-") ? quiz.input.slice(1) : "-" + quiz.input;
  else {
    if (quiz.input === "0") quiz.input = key;
    else if (quiz.input === "-0") quiz.input = "-" + key;
    else if (quiz.input.replace("-", "").length < 6) quiz.input += key;
  }
  updateAnswerBox();
}

// ---- 記一筆作答 ----
function recordAnswer(q, val, correct) {
  stats.answered++;
  if (!correct) {
    stats.wrong++;
    stats.wrongList.push({ 題目: q.text.replace(" =", "").trim(), 你的答案: val, 正確答案: q.answer, 關卡: q.levelNo });
  }
}

// ---- 送出 ----
function onSubmit() {
  if (quiz.input === "" || quiz.input === "-") return;
  if (lvl.phase === "review") return submitReview();

  const val = parseInt(quiz.input, 10);
  const q = lvl.q;
  const box = $("#answer");
  const fb = $("#feedback");
  const correct = val === q.answer;
  recordAnswer(q, val, correct);

  if (correct) {
    box.classList.add("ok"); fb.className = "feedback ok";
    if (lvl.phase === "retry") {
      fb.textContent = "✨ 正確！";
      mascotReact("happy", false);
      if (lvl.wrongPool.length >= REVIEW_TRIGGER) setTimeout(startReview, 600);
      else setTimeout(renderLevelQuestion, 500);
    } else {
      lvl.streak++;
      updateLevelProgress();
      if (lvl.streak >= GOAL) {
        fb.textContent = "⭐ Perfect！過關！ 🎉";
        mascotReact("combo", true);
        setTimeout(clearLevel, 900);
      } else if (lvl.streak % 5 === 0) {
        fb.textContent = `🔥 ${lvl.streak} 連擊！`;
        mascotReact("combo", true);
        setTimeout(renderLevelQuestion, 550);
      } else {
        fb.textContent = praise();
        mascotReact("happy", false);
        setTimeout(renderLevelQuestion, 450);
      }
    }
  } else {
    box.classList.add("bad"); fb.className = "feedback bad";
    lvl.streak = 0;
    if (lvl.phase !== "retry") lvl.wrongPool.push(q);
    lvl.phase = "retry";
    updateLevelProgress();
    mascotReact("confused");
    fb.textContent = `答錯，正確答案是 ${q.answer}，請重新輸入`;
    clearInputSoon(box);
  }
}

// ---- 錯題複習 ----
function startReview() {
  lvl.phase = "review";
  lvl.review = { queue: lvl.wrongPool.slice(), pos: 0 };
  lvl.wrongPool = [];
  $("#review-panel").hidden = false;
  loadReviewQuestion();
}
function loadReviewQuestion() {
  lvl.q = lvl.review.queue[lvl.review.pos];
  quiz.input = "";
  renderReviewList();
  $("#question").textContent = lvl.q.text;
  updateAnswerBox();
  $("#feedback").textContent = "";
  $("#feedback").className = "feedback";
  $("#answer").className = "answer-box";
  updateLevelProgress();
}
function renderReviewList() {
  const items = lvl.review.queue.map((q, i) => {
    const cls = i < lvl.review.pos ? "rv-done" : (i === lvl.review.pos ? "rv-current" : "");
    const mark = i < lvl.review.pos ? " ✓" : "";
    return `<div class="rv-item ${cls}">${q.text.replace(" =", "")}${mark}</div>`;
  }).join("");
  $("#review-panel").innerHTML =
    `<div class="review-title">錯題複習 — 這 ${lvl.review.queue.length} 題全部答對才繼續</div>` +
    `<div class="review-items">${items}</div>`;
}
function submitReview() {
  const val = parseInt(quiz.input, 10);
  const q = lvl.q;
  const box = $("#answer");
  const fb = $("#feedback");
  const correct = val === q.answer;
  recordAnswer(q, val, correct);

  if (correct) {
    box.classList.add("ok"); fb.className = "feedback ok";
    lvl.review.pos++;
    if (lvl.review.pos >= lvl.review.queue.length) {
      fb.textContent = "🎀 複習完成，繼續闖關！";
      mascotReact("combo", true);
      setTimeout(renderLevelQuestion, 800);
    } else {
      fb.textContent = praise();
      mascotReact("happy", false);
      setTimeout(loadReviewQuestion, 450);
    }
  } else {
    box.classList.add("bad"); fb.className = "feedback bad";
    mascotReact("confused");
    fb.textContent = `答錯，正確答案是 ${q.answer}，請重新輸入`;
    clearInputSoon(box);
  }
}
function clearInputSoon(box) {
  setTimeout(() => { quiz.input = ""; updateAnswerBox(); box.className = "answer-box"; }, 1000);
}

// ---- 關卡推進 ----
function clearLevel() {
  lvl.step++;
  lvl.streak = 0;
  lvl.wrongPool = [];
  stats.reachedLevel = lvl.idx + 1;
  if (lvl.step >= lvl.plan.length) finish(true);
  else { lvl.idx = lvl.plan[lvl.step]; stats.reachedLevel = lvl.idx + 1; renderLevelQuestion(); }
}

// ---- 結束並回傳紀錄 ----
function finish(completed) {
  const elapsedSec = Math.round((Date.now() - stats.startTime) / 1000);
  show("result");
  $("#result-title").textContent = completed ? "全部過關！ 🎉" : "本次結束";
  $("#score").textContent = completed ? "全破 🏆" : `到第 ${stats.reachedLevel} 關`;
  $("#mascot-win").innerHTML = completed ? mascotSvg("win") : "";
  if (completed) confetti();
  $("#score-detail").innerHTML =
    `作答 ${stats.answered} 題　答錯 ${stats.wrong} 題<br>用時 ${formatTime(elapsedSec)}`;

  // 錯題清單
  const list = $("#wrong-list");
  list.innerHTML = "";
  if (stats.wrongList.length === 0) {
    list.innerHTML = "<div class='wrong-item' style='justify-content:center;color:var(--ok)'>沒有錯題，太棒了！ 🎉</div>";
  } else {
    stats.wrongList.forEach((w) => {
      const div = document.createElement("div");
      div.className = "wrong-item";
      div.innerHTML = `<span>${w.題目} =</span><span><span class="you">${w.你的答案}</span> → <span class="correct">${w.正確答案}</span></span>`;
      list.appendChild(div);
    });
  }

  finalize(completed);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`;
}

// 全破時灑彩帶
function confetti() {
  const colors = ["#FFD76A", "#9C8BFF", "#7E6BFF", "#FF9EC4", "#7BE0B0"];
  for (let i = 0; i < 44; i++) {
    const p = document.createElement("div");
    p.className = "confetti-piece";
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = (Math.random() * 0.4) + "s";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2800);
  }
}

// ---- 回傳到 Google 試算表 ----
function postRecord(payload, beacon) {
  if (!RECORD_URL) return false;
  const body = JSON.stringify(payload);
  if (beacon && navigator.sendBeacon) {
    return navigator.sendBeacon(RECORD_URL, new Blob([body], { type: "text/plain;charset=utf-8" }));
  }
  return fetch(RECORD_URL, {
    method: "POST", mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body,
  });
}

// 登錄即記一列（進行中 + 上線時間）
function startRecord() {
  postRecord({
    action: "start", session: stats.session, 版本: VERSION,
    上線時間: new Date().toISOString(), 選擇關卡: stats.plan.join(","),
  }, false);
}

// 結束時更新同一列；beacon=true 用於關閉分頁的可靠送出
function finalize(completed, beacon) {
  if (!stats || stats.finalized) return;
  stats.finalized = true;
  const elapsedSec = Math.round((Date.now() - stats.startTime) / 1000);
  postRecord({
    action: "finish", session: stats.session, 版本: VERSION,
    結束時間: new Date().toISOString(),
    完成: completed ? "全破" : "未通關",
    選擇關卡: stats.plan.join(","),
    到達關卡: stats.reachedLevel,
    作答數: stats.answered, 答錯數: stats.wrong,
    用時秒: elapsedSec, 錯題: stats.wrongList,
  }, beacon);

  const statusEl = $("#record-status");
  if (statusEl) {
    statusEl.textContent = RECORD_URL ? "紀錄已回傳 ✓" : "（尚未設定回傳網址，紀錄未上傳）";
    statusEl.className = RECORD_URL ? "record-status ok" : "record-status muted";
  }
}

// ---- 中途離開 ----
function quit() {
  if (stats && !stats.finalized) {
    if (stats.answered > 0) { finish(false); return; }   // 有作答：顯示結果並記錄未通關
    finalize(false);                                      // 完全沒作答：直接記未通關
  }
  show("setup");
}

// 關閉分頁／離開頁面：若還在闖關中且未記錄，用 beacon 補記未通關
function leaveGuard() {
  if (stats && !stats.finalized && $("#quiz").classList.contains("active")) {
    finalize(false, true);
  }
}
window.addEventListener("pagehide", leaveGuard);

// ===== 事件綁定 =====
$("#start-btn").addEventListener("click", start);
$("#quit-btn").addEventListener("click", quit);
$("#submit-btn").addEventListener("click", onSubmit);
$("#again-btn").addEventListener("click", start);
$("#home-btn").addEventListener("click", () => show("setup"));
$("#lvl-all").addEventListener("click", () => $$("#levels-select input").forEach((c) => (c.checked = true)));
$("#lvl-none").addEventListener("click", () => $$("#levels-select input").forEach((c) => (c.checked = false)));
$$(".key").forEach((k) => k.addEventListener("click", () => pressKey(k.dataset.key)));

document.addEventListener("keydown", (e) => {
  if (!$("#quiz").classList.contains("active")) return;
  if (e.key >= "0" && e.key <= "9") pressKey(e.key);
  else if (e.key === "-") pressKey("sign");
  else if (e.key === "Backspace") pressKey("back");
  else if (e.key === "Enter") onSubmit();
});

// ===== 禁止縮放與上下平移拖曳（鎖定單頁畫面） =====
["gesturestart", "gesturechange", "gestureend"].forEach((ev) =>
  document.addEventListener(ev, (e) => e.preventDefault()));

document.addEventListener("touchmove", (e) => {
  const target = e.target;
  if (target.closest && target.closest(".wrong-list, .screen:not(#quiz)")) {
    return;
  }
  e.preventDefault();
}, { passive: false });
let lastTouch = 0;
document.addEventListener("touchend", (e) => {
  const now = Date.now();
  if (now - lastTouch <= 300) e.preventDefault();
  lastTouch = now;
}, { passive: false });

// 初始化
buildLevelSelect();
$("#mascot").innerHTML = mascotSvg("idle");
$("#app-version").textContent = `整數加減過關　${VERSION}`;

// Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => console.warn("SW 註冊失敗", err));
  });
}
