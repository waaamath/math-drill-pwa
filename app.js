// ===== 整數四則運算練習 PWA =====

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ---- 狀態 ----
let settings = { ops: ["+", "-", "×"], minA: 1, maxA: 20, minB: 1, maxB: 20, count: 20 };
let quiz = { questions: [], index: 0, correct: 0, input: "", wrong: [] };

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
    case "÷":
      // 除法：確保整除。用商×除數回推被除數，除數不為 0。
      if (b === 0) b = 1;
      const quotient = randInt(settings.minA, settings.maxA);
      a = b * quotient;
      answer = quotient;
      break;
  }
  return { a, b, op, answer, text: `${a} ${op} ${b} =` };
}

// ---- 開始練習 ----
function startQuiz() {
  // 讀取運算
  const ops = [...$$(".op-toggle input:checked")].map((c) => c.value);
  if (ops.length === 0) return showSetupError("請至少選一種運算");

  const minA = parseInt($("#minA").value, 10);
  const maxA = parseInt($("#maxA").value, 10);
  const minB = parseInt($("#minB").value, 10);
  const maxB = parseInt($("#maxB").value, 10);
  if ([minA, maxA, minB, maxB].some((n) => Number.isNaN(n))) return showSetupError("範圍必須是數字");
  if (minA > maxA || minB > maxB) return showSetupError("最小值不能大於最大值");

  const count = parseInt($(".count-btn.active").dataset.count, 10);
  settings = { ops, minA, maxA, minB, maxB, count };

  quiz = { questions: [], index: 0, correct: 0, input: "", wrong: [] };
  for (let i = 0; i < count; i++) quiz.questions.push(makeQuestion());

  showSetupError("");
  show("quiz");
  renderQuestion();
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

// ===== 事件綁定 =====
$("#start-btn").addEventListener("click", startQuiz);
$("#quit-btn").addEventListener("click", () => show("setup"));
$("#submit-btn").addEventListener("click", submitAnswer);
$("#again-btn").addEventListener("click", startQuiz);
$("#home-btn").addEventListener("click", () => show("setup"));

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
  else if (e.key === "Enter") submitAnswer();
});

// ===== Service Worker 註冊 =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => console.warn("SW 註冊失敗", err));
  });
}
