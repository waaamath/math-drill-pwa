const GOAL = 20;
const RECORD_URL = 'https://script.google.com/macros/s/AKfycbyE4A1ZNY2T4ixLMwfHOBorCdB7VXSUZ5QEMg_GmbftgSBljDnmgCXhzhJmtoIPbcutow/exec';
const $ = (selector) => document.querySelector(selector);

// 題目範圍依照講義「繞 x 軸」與「繞 y 軸」的 25 個公式。
// tan 的 90°、270° 轉換會產生 cot，因此不列入題庫。
const QUESTION_BANK = [
  // 繞 x 軸
  ['\\sin(180^\\circ-\\theta)', '\\sin\\theta'],
  ['\\cos(180^\\circ-\\theta)', '-\\cos\\theta'],
  ['\\tan(180^\\circ-\\theta)', '-\\tan\\theta'],
  ['\\sin(180^\\circ+\\theta)', '-\\sin\\theta'],
  ['\\cos(180^\\circ+\\theta)', '-\\cos\\theta'],
  ['\\tan(180^\\circ+\\theta)', '\\tan\\theta'],
  ['\\sin(360^\\circ-\\theta)', '-\\sin\\theta'],
  ['\\cos(360^\\circ-\\theta)', '\\cos\\theta'],
  ['\\tan(360^\\circ-\\theta)', '-\\tan\\theta'],
  ['\\sin(-\\theta)', '-\\sin\\theta'],
  ['\\cos(-\\theta)', '\\cos\\theta'],
  ['\\tan(-\\theta)', '-\\tan\\theta'],
  ['\\sin(\\theta-180^\\circ)', '-\\sin\\theta'],
  ['\\cos(\\theta-180^\\circ)', '-\\cos\\theta'],
  ['\\tan(\\theta-180^\\circ)', '\\tan\\theta'],

  // 繞 y 軸
  ['\\sin(90^\\circ+\\theta)', '\\cos\\theta'],
  ['\\cos(90^\\circ+\\theta)', '-\\sin\\theta'],
  ['\\sin(270^\\circ-\\theta)', '-\\cos\\theta'],
  ['\\cos(270^\\circ-\\theta)', '-\\sin\\theta'],
  ['\\sin(270^\\circ+\\theta)', '-\\cos\\theta'],
  ['\\cos(270^\\circ+\\theta)', '\\sin\\theta'],
  ['\\sin(\\theta-90^\\circ)', '-\\cos\\theta'],
  ['\\cos(\\theta-90^\\circ)', '\\sin\\theta'],
  ['\\sin(\\theta-270^\\circ)', '\\cos\\theta'],
  ['\\cos(\\theta-270^\\circ)', '-\\sin\\theta'],
];

const ANSWERS = [
  '\\sin\\theta',
  '-\\sin\\theta',
  '\\cos\\theta',
  '-\\cos\\theta',
  '\\tan\\theta',
  '-\\tan\\theta',
];

let state = {};

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function show(id) {
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
  $(`#${id}`).classList.add('active');
}

function renderFormula(element, expression, displayMode = false) {
  katex.render(expression, element, { throwOnError: false, displayMode });
}

function makeQuestion() {
  const [question, answer] = pick(QUESTION_BANK);
  const distractors = shuffle(ANSWERS.filter((value) => value !== answer)).slice(0, 3);
  return { question, answer, choices: shuffle([answer, ...distractors]) };
}

function renderQuestion() {
  state.current = makeQuestion();
  state.locked = false;

  renderFormula($('#question-expression'), `${state.current.question} = ?`, true);
  $('#feedback').textContent = '';
  $('#feedback').className = 'feedback';
  $('#streak-value').innerHTML = `${state.streak} <small>/ ${GOAL}</small>`;
  $('#progress-fill').style.width = `${state.streak / GOAL * 100}%`;

  const choices = $('#choices');
  choices.replaceChildren();

  state.current.choices.forEach((answer, index) => {
    const button = document.createElement('button');
    const marker = document.createElement('span');
    const formula = document.createElement('i');

    button.className = 'choice-button';
    button.dataset.answer = answer;
    marker.className = 'choice-marker';
    marker.textContent = String.fromCharCode(65 + index);
    formula.className = 'choice-formula';
    renderFormula(formula, answer);

    button.append(marker, formula);
    button.addEventListener('click', () => answerQuestion(answer, button));
    choices.append(button);
  });
}

function startGame() {
  state = { streak: 0, mistakes: 0, startedAt: Date.now(), locked: false };
  show('quiz-screen');
  renderQuestion();
}

function answerQuestion(answer, selectedButton) {
  if (state.locked) return;
  state.locked = true;
  const isCorrect = answer === state.current.answer;

  document.querySelectorAll('.choice-button').forEach((button) => {
    button.disabled = true;
    if (button.dataset.answer === state.current.answer) button.classList.add('correct');
  });

  const feedback = $('#feedback');
  if (isCorrect) {
    state.streak += 1;
    feedback.textContent = '答對了！';
    feedback.classList.add('ok');
    if (state.streak === GOAL) {
      setTimeout(finishGame, 650);
      return;
    }
    setTimeout(renderQuestion, 650);
  } else {
    state.mistakes += 1;
    state.streak = 0;
    selectedButton.classList.add('wrong');
    feedback.textContent = '再想想，正確答案已標示。';
    feedback.classList.add('bad');
    setTimeout(renderQuestion, 1500);
  }
}

function resultRecord() {
  const seconds = Math.round((Date.now() - state.startedAt) / 1000);
  return {
    exercise: '廣義三角比的角度轉換',
    completedAt: new Date().toLocaleString('zh-TW'),
    seconds,
    mistakes: state.mistakes,
    maxStreak: GOAL,
    status: '通關',
  };
}

function finishGame() {
  const record = resultRecord();
  const seconds = record.seconds;
  const pad = (number) => String(number).padStart(2, '0');
  $('#elapsed-value').textContent = `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
  $('#mistake-value').textContent = record.mistakes;
  show('result-screen');
  uploadRecord(record);
}

async function uploadRecord(record) {
  const status = $('#upload-status');
  status.textContent = '正在上傳到 Google 試算表…';
  try {
    await fetch(RECORD_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(record),
    });
    status.textContent = '已送出試算表紀錄。';
    status.className = 'upload-status upload-ok';
  } catch {
    status.textContent = '試算表上傳失敗，仍可下載 CSV 保存。';
    status.className = 'upload-status upload-error';
  }
}

function downloadCsv() {
  const record = resultRecord();
  const rows = [
    ['練習項目', '完成時間', '花費秒數', '答錯次數', '完成題數', '狀態'],
    [
      record.exercise,
      record.completedAt,
      record.seconds,
      record.mistakes,
      record.maxStreak,
      record.status,
    ],
  ];
  const blob = new Blob(
    ['\uFEFF' + rows.map((row) => row.join(',')).join('\n')],
    { type: 'text/csv;charset=utf-8' },
  );
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = '廣義三角比角度轉換.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

$('#start-button').addEventListener('click', startGame);
$('#exit-button').addEventListener('click', () => show('home-screen'));
$('#again-button').addEventListener('click', startGame);
$('#home-button').addEventListener('click', () => show('home-screen'));
$('#download-button').addEventListener('click', downloadCsv);

const scopeRule = document.querySelector('.rule-grid div:nth-child(3)');
scopeRule.querySelector('b').textContent = QUESTION_BANK.length;
scopeRule.querySelector('span').textContent = '講義公式範圍';

const uploadStatus = document.createElement('p');
uploadStatus.id = 'upload-status';
uploadStatus.className = 'upload-status';
uploadStatus.setAttribute('aria-live', 'polite');
document.querySelector('.result-panel').insertAdjacentElement('afterend', uploadStatus);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}
