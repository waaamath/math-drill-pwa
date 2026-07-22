// ===== 整數四則運算練習 PWA =====

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ---- 狀態 ----
let mode = "normal";                 // "normal" | "level"
let settings = { ops: ["+", "-", "×"], minA: 1, maxA: 20, minB: 1, maxB: 20, count: 20 };
let quiz = { questions: [], index: 0, correct: 0, input: "", wrong: [] };

// 過關模式：7 關的正負組合（加減）
const LEVELS = [
  { name: "正 － 正", s1: 1,  op: "-", s2: 1 },
  { name: "負 ＋ 正", s1: -1, op: "+", s2: 1 },
  { name: "負 － 正", s1: -1, op: "-", s2: 1 },
  { name: "正 － 負", s1: 1,  op: "-", s2: -1 },
  { name: "負 － 負", s1: -1, op: "-", s2: -1 },
  { name: "正 ＋ 負", s1: 1,  op: "+", s2: -1 },
  { name: "負 ＋ 負", s1: -1, op: "+", s2: -1 },
];
const GOAL = 30;                     // 每關需連續答對的題數
let lvl = { idx: 0, streak: 0, retry: false, q: null };

// ---- 畫面切換 ----
function show(id) {
  $$(".screen").forEach((s) => s.classList.remove("active"));
  $(`#${id}`).classList.add("active");
}

// ---- 亂數整數 ----
function randInt(min, max) {
  min = Math.ceil(min); max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---- 產生一題 ----
function makeQuestion() {
  const op = settings.ops[randInt(0, settings.ops.length - 1)];
  let a = randInt(settings.minA, settings.maxA);
  let b = randInt(settings.minB, settings.maxB);
  let answer;

  switch (op) {
    case "+": answer = a + b; break;
    case "-": answer = a - b; break;
    case "×": answer = a * b; break;
    case "÷": {
      // 除法：第一個數字＝被除數、第二個數字＝除數（皆照各自範圍，含負數）。
      // 把被除數 a 調成除數 b 的倍數以保證整除；除數不為 0。
      if (b === 0) b = settings.maxB > 0 ? 1 : -1;
      const lo = Math.min(settings.minA, settings.maxA);
      const hi = Math.max(settings.minA, settings.maxA);
      // 商 q 需讓 b*q 落在 [lo, hi]；除以負數會反向，故取兩端最小/最大。
      const qMin = Math.ceil(Math.min(lo / b, hi / b));
      const qMax = Math.floor(Math.max(lo / b, hi / b));
      let q = Math.round(a / b);                    // 最接近原被除數的商
      if (qMin <= qMax) q = Math.min(Math.max(q, qMin), qMax);
      else if (q === 0) q = 1;                       // 範圍太窄的退路，至少給非零題
      a = b * q;
      answer = q;
      break;
    }
  }
  return { a, b, op, answer, text: `${fmt(a)} ${op} ${fmt(b)} =` };
}

// ---- 數字顯示：負數加括號 ----
function fmt(n) {
  return n < 0 ? `(${n})` : `${n}`;
}

// ---- 開始練習 ----
function startQuiz() {
  // 讀取數字範圍（兩種模式都要）
  const minA = parseInt($("#minA").value, 10);
  const maxA = parseInt($("#maxA").value, 10);
  const minB = parseInt($("#minB").value, 10);
  const maxB = parseInt($("#maxB").value, 10);
  if ([minA, maxA, minB, maxB].some((n) => Number.isNaN(n))) return showSetupError("範圍必須是數字");
  if (minA > maxA || minB > maxB) return showSetupError("最小值不能大於最大值");

  if (mode === "level") {
    settings = { minA, maxA, minB, maxB };
    lvl = { idx: 0, streak: 0, retry: false, q: null };
    showSetupError("");
    show("quiz");
    $("#level-banner").hidden = false;
    renderLevelQuestion();
    return;
  }

  // 一般模式
  const ops = [...$$(".op-toggle input:checked")].map((c) => c.value);
  if (ops.length === 0) return showSetupError("請至少選一種運算");
  const count = parseInt($(".count-btn.active").dataset.count, 10);
  settings = { ops, minA, maxA, minB, maxB, count };

  quiz = { questions: [], index: 0, correct: 0, input: "", wrong: [] };
  for (let i = 0; i < count; i++) quiz.questions.push(makeQuestion());

  showSetupError("");
  show("quiz");
  $("#level-banner").hidden = true;
  renderQuestion();
}

// ===== 過關模式 =====
// 由範圍取「大小」（絕對值），正負由關卡決定
function magFrom(min, max) {
  const hi = Math.max(Math.abs(min), Math.abs(max));
  return randInt(1, Math.max(1, hi));
}

function makeLevelQuestion() {
  const L = LEVELS[lvl.idx];
  const a = L.s1 * magFrom(settings.minA, settings.maxA);
  const b = L.s2 * magFrom(settings.minB, settings.maxB);
  const answer = L.op === "+" ? a + b : a - b;
  return { a, b, op: L.op, answer, text: `${fmt(a)} ${L.op} ${fmt(b)} =` };
}

function renderLevelQuestion() {
  lvl.q = makeLevelQuestion();
  lvl.retry = false;
  quiz.input = "";
  const L = LEVELS[lvl.idx];
  $("#level-banner").innerHTML = `第 ${lvl.idx + 1} 關　${L.name}<span class="sub">共 ${LEVELS.length} 關</span>`;
  $("#question").textContent = lvl.q.text;
  updateAnswerBox();
  $("#feedback").textContent = "";
  $("#feedback").className = "feedback";
  $("#answer").className = "answer-box";
  updateLevelProgress();
}

function updateLevelProgress() {
  $("#progress-bar").style.width = (lvl.streak / GOAL * 100) + "%";
  $("#progress-text").textContent = `連續 ${lvl.streak} / ${GOAL}`;
}

function submitLevel() {
  if (quiz.input === "" || quiz.input === "-") return;
  const val = parseInt(quiz.input, 10);
  const q = lvl.q;
  const box = $("#answer");
  const fb = $("#feedback");

  if (val === q.answer) {
    box.classList.add("ok"); fb.className = "feedback ok";
    if (lvl.retry) {
      // 重輸正確 → 換下一題（此題不計入連續）
      fb.textContent = "正確，繼續！ ✓";
      setTimeout(renderLevelQuestion, 500);
    } else {
      lvl.streak++;
      updateLevelProgress();
      if (lvl.streak >= GOAL) {
        fb.textContent = "過關！ 🎉";
        setTimeout(clearLevel, 800);
      } else {
        fb.textContent = "答對了！ ✓";
        setTimeout(renderLevelQuestion, 450);
      }
    }
  } else {
    // 答錯 → 連續歸零、顯示正確答案、要求重新輸入
    box.classList.add("bad"); fb.className = "feedback bad";
    lvl.streak = 0;
    lvl.retry = true;
    updateLevelProgress();
    fb.textContent = `答錯，正確答案是 ${q.answer}，請重新輸入`;
    setTimeout(() => {
      quiz.input = "";
      updateAnswerBox();
      box.className = "answer-box";
    }, 1000);
  }
}

function clearLevel() {
  lvl.idx++;
  lvl.streak = 0;
  if (lvl.idx >= LEVELS.length) showLevelWin();
  else renderLevelQuestion();
}

function showLevelWin() {
  show("result");
  $("#level-banner").hidden = true;
  $("#score").textContent = "全破 🏆";
  $("#score-detail").textContent = `恭喜通過全部 ${LEVELS.length} 關！`;
  $("#wrong-list").innerHTML = "";
}

function showSetupError(msg) { $("#setup-error").textContent = msg; }

// ---- 顯示題目 ----
function renderQuestion() {
  const q = quiz.questions[quiz.index];
  quiz.input = "";
  $("#question").textContent = q.text;
  updateAnswerBox();
  $("#feedback").textContent = "";
  $("#feedback").className = "feedback";
  $("#answer").className = "answer-box";
  $("#progress-bar").style.width = ((quiz.index) / quiz.questions.length * 100) + "%";
  $("#progress-text").textContent = `${quiz.index + 1} / ${quiz.questions.length}`;
}

function updateAnswerBox() {
  const box = $("#answer");
  if (quiz.input === "" || quiz.input === "-") {
    box.innerHTML = quiz.input === "-" ? "-<span class='placeholder'>?</span>" : "<span class='placeholder'>?</span>";
  } else {
    box.textContent = quiz.input;
  }
}

// ---- 數字鍵盤 ----
function pressKey(key) {
  if (key === "back") {
    quiz.input = quiz.input.slice(0, -1);
  } else if (key === "sign") {
    quiz.input = quiz.input.startsWith("-") ? quiz.input.slice(1) : "-" + quiz.input;
  } else {
    if (quiz.input === "0") quiz.input = key;        // 避免前導 0
    else if (quiz.input === "-0") quiz.input = "-" + key;
    else if (quiz.input.replace("-", "").length < 6) quiz.input += key; // 位數上限
  }
  updateAnswerBox();
}

// ---- 送出答案 ----
function submitAnswer() {
  if (quiz.input === "" || quiz.input === "-") return;
  const q = quiz.questions[quiz.index];
  const val = parseInt(quiz.input, 10);
  const isRight = val === q.answer;

  const box = $("#answer");
  const fb = $("#feedback");
  if (isRight) {
    quiz.correct++;
    box.classList.add("ok"); fb.classList.add("ok");
    fb.textContent = "答對了！ ✓";
  } else {
    quiz.wrong.push({ text: q.text, you: val, correct: q.answer });
    box.classList.add("bad"); fb.classList.add("bad");
    fb.textContent = `正確答案：${q.answer}`;
  }

  // 鎖定按鈕短暫延遲後進下一題
  setTimeout(() => {
    quiz.index++;
    if (quiz.index >= quiz.questions.length) showResult();
    else renderQuestion();
  }, isRight ? 550 : 1200);
}

// ---- 結果 ----
function showResult() {
  show("result");
  const total = quiz.questions.length;
  $("#score").textContent = `${quiz.correct} / ${total}`;
  const pct = Math.round(quiz.correct / total * 100);
  $("#score-detail").textContent = `答對率 ${pct}%`;

  const list = $("#wrong-list");
  list.innerHTML = "";
  if (quiz.wrong.length === 0) {
    list.innerHTML = "<div class='wrong-item' style='justify-content:center;color:var(--ok)'>全部答對，太棒了！ 🎉</div>";
  } else {
    quiz.wrong.forEach((w) => {
      const div = document.createElement("div");
      div.className = "wrong-item";
      div.innerHTML = `<span>${w.text}</span><span><span class="you">${w.you}</span> → <span class="correct">${w.correct}</span></span>`;
      list.appendChild(div);
    });
  }
}

// ---- 送出：依模式分派 ----
function onSubmit() { mode === "level" ? submitLevel() : submitAnswer(); }

// ---- 模式切換 UI ----
function updateModeUI() {
  $$(".mode-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  const isLevel = mode === "level";
  $("#ops-card").classList.toggle("hidden", isLevel);
  $("#count-card").classList.toggle("hidden", isLevel);
  $("#start-btn").textContent = isLevel ? "開始過關" : "開始練習";
  $("#mode-hint").textContent = isLevel
    ? "7 關正負加減，連續答對 30 題過關；答錯歸零並要重新輸入。數字大小取下方範圍的絕對值。"
    : "";
}

// ===== 事件綁定 =====
$("#start-btn").addEventListener("click", startQuiz);
$("#quit-btn").addEventListener("click", () => show("setup"));
$("#submit-btn").addEventListener("click", onSubmit);
$("#again-btn").addEventListener("click", startQuiz);
$("#home-btn").addEventListener("click", () => show("setup"));

$$(".mode-btn").forEach((btn) => btn.addEventListener("click", () => {
  mode = btn.dataset.mode;
  updateModeUI();
}));
updateModeUI();

$$(".count-btn").forEach((btn) => btn.addEventListener("click", () => {
  $$(".count-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
}));

$$(".key").forEach((k) => k.addEventListener("click", () => pressKey(k.dataset.key)));

// 實體鍵盤支援（平板外接鍵盤也可用）
document.addEventListener("keydown", (e) => {
  if (!$("#quiz").classList.contains("active")) return;
  if (e.key >= "0" && e.key <= "9") pressKey(e.key);
  else if (e.key === "-") pressKey("sign");
  else if (e.key === "Backspace") pressKey("back");
  else if (e.key === "Enter") onSubmit();
});

// ===== Service Worker 註冊 =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => console.warn("SW 註冊失敗", err));
  });
}
