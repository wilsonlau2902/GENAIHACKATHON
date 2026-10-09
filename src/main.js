import "./styles.css";
import { AGENT_SYSTEM_PROMPT, DANGER_PATTERNS, SENSITIVE_PATTERNS } from "./agent-system-prompt.js";

const STORAGE_KEY = "yiloi-transcript-v1";
const STORY_KEY = "yiloi-story-v1";
const SHARE_KEY = "yiloi-share-v1";
const supportsSpeech = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const state = {
  messages: JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"),
  photo: JSON.parse(localStorage.getItem("yiloi-photo-v1") || "null"),
  story: JSON.parse(localStorage.getItem(STORY_KEY) || "null"),
  sharing: JSON.parse(localStorage.getItem(SHARE_KEY) || "null"),
  view: "senior",
  topic: localStorage.getItem("yiloi-topic-v1") || "",
  focusMode: false,
  listening: false,
  paused: false,
  startedAt: Date.now(),
  recognition: null,
};

const app = document.querySelector("#app");

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[character]));
}

function createQrCode() {
  const cells = [
    "1111111001011111111", "1000001011011000001", "1011101000011011101",
    "1011101011011011101", "1011101001011011101", "1000001010111000001",
    "1111111010101111111", "0000000011010000000", "1101111010111011011",
    "0010100101100100100", "1110011110011110001", "0101110001110001110",
    "1111111001001011011", "1000001011110010100", "1011101000101110111",
    "1011101011001001001", "1011101000111011100", "1000001011010010111",
    "1111111010101110101",
  ];
  return `<svg viewBox="0 0 19 19" role="img" aria-label="故事分享 QR Code">${cells.map((row, y) =>
    [...row].map((cell, x) => cell === "1" ? `<rect x="${x}" y="${y}" width="1" height="1" />` : "").join("")
  ).join("")}</svg>`;
}

function renderSharePage() {
  if (!new URLSearchParams(window.location.search).has("story") || !state.story?.confirmed) return false;
  app.innerHTML = `<div class="shell share-page">
    <header class="topbar"><div><span class="brand-mark">憶</span><span class="brand">憶旅</span></div><span class="step">長者已確認</span></header>
    <section class="share-hero"><p class="eyebrow">一段留給家人的回憶</p><h1>${escapeHtml(state.story.title || "我的回憶")}</h1><p>呢段故事由長者親自審閱及確認。</p></section>
    ${state.photo?.image ? `<img class="shared-photo" src="${state.photo.image}" alt="${escapeHtml(state.photo.title || "回憶相片")}" />` : ""}
    <article class="shared-story"><span class="ai-label">長者已確認</span><p>${escapeHtml(state.story.text)}</p></article>
    <section class="guest-message"><h2>留一句話俾長者</h2><textarea id="guest-note" rows="3" placeholder="例如：多謝你同我分享呢段回憶。"></textarea><button id="send-guest-note" class="primary">送出語音／文字留言（Demo）</button><p id="guest-status" class="confirmed" hidden>✓ 留言已送出（Demo）</p></section>
    <footer><span>憶旅・由長者決定分享內容</span><a href="${window.location.pathname}">返回我的憶旅</a></footer>
  </div>`;
  document.querySelector("#send-guest-note").addEventListener("click", () => {
    const note = document.querySelector("#guest-note").value.trim();
    if (!note) return;
    document.querySelector("#guest-status").hidden = false;
    document.querySelector("#send-guest-note").disabled = true;
  });
  return true;
}

function getShareUrl() {
  return state.sharing?.url || window.location.href;
}

function getShareText() {
  return `同你分享一段回憶：${state.story?.title || "我的回憶"}`;
}

const shareIcons = {
  whatsapp: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .4 5.2.4 11.7c0 2.1.6 4.1 1.6 5.9L.3 24l6.6-1.7a11.7 11.7 0 0 0 5.2 1.2h.1c6.4 0 11.7-5.2 11.7-11.7 0-3.1-1.2-6.1-3.4-8.3Zm-8.3 18c-1.6 0-3.2-.4-4.6-1.2l-.3-.2-3.9 1 1-3.8-.2-.4a9.7 9.7 0 1 1 8 4.6Zm5.3-7.3c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-1.7-.8-2.8-1.5-3.9-3.4-.3-.5.3-.5.8-1.6.1-.2.1-.4 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.2 4.5 1.9.8 2.6.9 3.5.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 24v-11h3.7l.6-4.3h-4.3V6c0-1.2.3-2.1 2.2-2.1h2.3V.1C17.6.1 16.4 0 15.1 0c-3.4 0-5.7 2.1-5.7 5.9v2.8H5.7V13h3.7v11h4.1Z"/></svg>`,
  wechat: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.8 4C4 4 .2 7.2.2 11.2c0 2.3 1.4 4.4 3.5 5.7l-.8 2.8 3.2-1.6c.8.2 1.7.3 2.6.3h.5c-.2-.6-.3-1.2-.3-1.9 0-3.6 3.4-6.5 7.7-6.5.5 0 1 0 1.4.1C17.4 6.5 13.6 4 8.8 4Zm-2.9 7.8c-.7 0-1.2-.5-1.2-1.1s.5-1.1 1.2-1.1 1.2.5 1.2 1.1-.5 1.1-1.2 1.1Zm5.7 0c-.7 0-1.2-.5-1.2-1.1s.5-1.1 1.2-1.1 1.2.5 1.2 1.1-.5 1.1-1.2 1.1Zm3.5 0c-4.1 0-7.4 2.6-7.4 5.9 0 3.2 3.3 5.8 7.4 5.8.8 0 1.6-.1 2.3-.3l2.8 1.4-.7-2.5c1.8-1.1 3-2.7 3-4.5 0-3.2-3.3-5.8-7.4-5.8Zm-2.4 5.2c-.6 0-1-.4-1-.9s.4-.9 1-.9 1 .4 1 .9-.4.9-1 .9Zm4.7 0c-.6 0-1-.4-1-.9s.4-.9 1-.9 1 .4 1 .9-.4.9-1 .9Z"/></svg>`,
};

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages));
}

function savePhoto() {
  localStorage.setItem("yiloi-photo-v1", JSON.stringify(state.photo));
}

function saveStory() {
  localStorage.setItem(STORY_KEY, JSON.stringify(state.story));
}

function saveSharing() {
  localStorage.setItem(SHARE_KEY, JSON.stringify(state.sharing));
}

const memoryTopics = [
  ["childhood", "細個嘅生活", "街坊、玩伴，同屋企嘅日子", "☀"],
  ["family", "屋企人", "一餐飯、一句說話，一個重要嘅人", "♡"],
  ["work", "第一份工", "人生第一步，做過最難忘嘅工作", "▣"],
  ["festival", "節日回憶", "過年、團年飯，同最熱鬧嘅時光", "✦"],
  ["proud", "最自豪嘅事", "你最想留俾家人知道嘅故事", "★"],
  ["message", "留俾家人的話", "想對屋企人講，但一直未講出口嘅話", "✉"],
];

function selectTopic(id) {
  state.topic = id;
  localStorage.setItem("yiloi-topic-v1", id);
  const topic = memoryTopics.find(([topicId]) => topicId === id);
  if (topic && state.messages.length <= 1) {
    addMessage("agent", `好呀，我哋就由「${topic[1]}」開始。你最先諗起邊一件事？`);
  } else {
    render();
  }
}

function draftStory() {
  const userMessages = state.messages.filter((message) => message.role === "user");
  if (!userMessages.length) return "";
  return userMessages.map((message) => message.text).join(" ");
}

function loadDemo() {
  state.messages = [
    { role: "agent", text: "你好，我係憶旅，一個 AI 回憶助手，唔係真人。我唔會問你銀行資料、身份證號碼或者地址。今日食咗飯未？", at: new Date().toISOString() },
    { role: "user", text: "我細個住喺深水埗，最鍾意睇婆婆煮飯。", at: new Date().toISOString() },
    { role: "agent", text: "你記得深水埗同婆婆煮飯，嗰個廚房一定好有味道。婆婆最常煮咩餸？", at: new Date().toISOString() },
    { role: "user", text: "佢最叻煮梅菜扣肉，屋企人返工返學都會一齊食。", at: new Date().toISOString() },
    { role: "agent", text: "原來梅菜扣肉係你哋一家人一齊食飯嘅回憶。呢句好值得保留落嚟。", at: new Date().toISOString() },
  ];
  state.photo = {
    image: createDemoImage(),
    title: "婆婆煮梅菜扣肉的廚房",
    year: "1968",
    people: "婆婆、屋企人",
    caption: "婆婆最叻煮梅菜扣肉，屋企人返工返學都會一齊食。",
    confirmed: true,
  };
  state.sharing = null;
  state.story = {
    title: "深水埗的飯香",
    text: "我細個住喺深水埗，最鍾意記得婆婆煮飯。佢最叻煮梅菜扣肉，屋企人返工返學都會一齊食。對我嚟講，呢個唔只係一道餸，而係一家人坐埋一齊嘅日子。",
    confirmed: true,
  };
  save();
  savePhoto();
  saveStory();
  render();
}

function createDemoImage() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
    <rect width="900" height="600" fill="#e8d0ae"/>
    <rect x="75" y="80" width="750" height="440" rx="24" fill="#fff7e9"/>
    <circle cx="300" cy="265" r="90" fill="#b97752"/>
    <circle cx="610" cy="270" r="90" fill="#d29b70"/>
    <path d="M180 440h520v40H180z" fill="#8e6046"/>
    <text x="450" y="145" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#79513d">一齊食飯的日子</text>
    <text x="450" y="570" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#79513d">Demo 示意圖片</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-HK";
  utterance.rate = 0.85;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) =>
    /yue|zh[-_]HK|粵|廣東|Cantonese/i.test(`${voice.lang} ${voice.name}`)
  ) || voices.find((voice) => /zh[-_]HK/i.test(voice.lang));
  window.speechSynthesis.speak(utterance);
}

function addMessage(role, text, options = {}) {
  state.messages.push({ role, text, at: new Date().toISOString(), ...options });
  save();
  render();
}

function mockReply(text) {
  const normalized = text.toLowerCase();
  if (normalized.includes("唔記得")) {
    return "唔緊要，我哋慢慢諗。嗰陣時有冇一首歌、一種食物，或者電視劇令你諗返起嗰段日子？";
  }
  if (normalized.includes("食") || normalized.includes("飯")) {
    return "你頭先講到食嘢，聽落你好記得嗰種味道。以前邊個最常煮俾你食？";
  }
  if (normalized.includes("細個") || normalized.includes("年輕") || normalized.includes("以前")) {
    return "你講到以前嘅日子喇。當時你住喺邊度？附近有冇一個你特別記得嘅地方？";
  }
  return `我聽到你講「${text.slice(0, 36)}${text.length > 36 ? "…" : ""}」。呢個細節好有畫面，你當時身邊仲有邊個人？`;
}

function isDangerous(text) {
  return DANGER_PATTERNS.some((pattern) => text.includes(pattern));
}

function handleTranscript(text) {
  if (!text.trim() || state.paused) return;
  addMessage("user", text.trim());
  if (isDangerous(text)) {
    state.paused = true;
    addMessage("agent", "多謝你肯同我講呢啲感受。你唔使一個人頂住，我哋而家先停一停，搵真人照顧者陪住你。");
    speak("多謝你肯同我講呢啲感受。我哋而家先停一停，搵真人照顧者陪住你。");
    return;
  }
  const reply = mockReply(text);
  const sensitive = SENSITIVE_PATTERNS.some((pattern) => text.includes(pattern));
  addMessage("agent", sensitive ? `我聽到你提到一段重要而可能難受嘅經歷。${reply}如果你想休息，我哋可以下次再傾。` : reply);
  speak(sensitive ? `我聽到你提到一段重要而可能難受嘅經歷。${reply}` : reply);
}

function startListening() {
  if (!supportsSpeech) {
    document.querySelector("#manual-input").focus();
    return;
  }
  if (state.listening) {
    state.recognition?.stop();
    return;
  }
  state.recognition = new SpeechRecognition();
  state.recognition.lang = "zh-HK";
  state.recognition.interimResults = false;
  state.recognition.continuous = false;
  state.recognition.onstart = () => { state.listening = true; render(); };
  state.recognition.onend = () => { state.listening = false; render(); };
  state.recognition.onerror = () => { state.listening = false; render(); };
  state.recognition.onresult = (event) => handleTranscript(event.results[0][0].transcript);
  state.recognition.start();
  render();
}

function renderFocusMode() {
  const lastAgent = [...state.messages].reverse().find((message) => message.role === "agent");
  const lastUser = [...state.messages].reverse().find((message) => message.role === "user");
  app.innerHTML = `<div class="focus-shell">
    <header class="focus-topbar">
      <button id="exit-focus" class="focus-back">← 返回完整畫面</button>
      <span class="brand"><span class="brand-mark">憶</span>憶旅</span>
      <span class="focus-time">本節 ${Math.floor((Date.now() - state.startedAt) / 60000)} / 45 分鐘</span>
    </header>
    <main class="focus-main">
      <p class="eyebrow">${state.topic ? `主題：${escapeHtml(memoryTopics.find(([id]) => id === state.topic)?.[1] || "")}` : "廣東話語音對話"}</p>
      <div class="focus-orb ${state.listening ? "is-listening" : ""}"><span>${state.listening ? "■" : "🎙"}</span></div>
      <h1>${state.listening ? "我聽緊你講…" : "可以同我講嘢喇"}</h1>
      <p class="focus-hint">${state.listening ? "講完之後，我會耐心聽你講完。" : "撳住下面個咪高風，慢慢講就得。"}</p>
      ${lastUser ? `<div class="focus-transcript"><span>你剛才講：</span><p>「${escapeHtml(lastUser.text)}」</p></div>` : ""}
      ${lastAgent ? `<div class="focus-agent"><span>憶旅</span><p>${escapeHtml(lastAgent.text)}</p><button id="focus-speak" class="speak-button">🔊 再讀一次</button></div>` : ""}
      <button id="focus-listen" class="focus-mic ${state.listening ? "active" : ""}"><span>${state.listening ? "■" : "🎙"}</span><strong>${state.listening ? "停止聆聽" : "按一下開始講"}</strong></button>
      <div class="focus-actions"><button id="focus-rest" class="secondary">休息一陣</button><button id="focus-end" class="text-button">結束今次對話</button></div>
    </main>
  </div>`;
  document.querySelector("#exit-focus").addEventListener("click", () => { state.focusMode = false; render(); });
  document.querySelector("#focus-listen").addEventListener("click", startListening);
  document.querySelector("#focus-speak").addEventListener("click", () => speak(lastAgent?.text || ""));
  document.querySelector("#focus-rest").addEventListener("click", () => alert("好，我哋休息一陣先。準備好再撳咪高風。"));
  document.querySelector("#focus-end").addEventListener("click", () => { state.focusMode = false; render(); });
}

function renderCaregiverDashboard() {
  const storyStatus = state.story?.confirmed ? "已確認" : state.story ? "待長者確認" : "未開始";
  const safetyStatus = state.paused ? "需要即時關注" : "目前沒有通知";
  app.innerHTML = `<div class="shell dashboard">
    <header class="topbar">
      <div><span class="brand-mark">憶</span><span class="brand">憶旅</span></div>
      <button id="back-to-senior" class="secondary">返回長者模式</button>
    </header>
    <section class="dashboard-hero">
      <p class="eyebrow">照顧者視角・Demo</p>
      <h1>早晨，陳姑娘</h1>
      <p>以下係阿梅婆婆主動同憶旅分享嘅內容。只顯示已獲同意嘅摘要。</p>
    </section>
    <section class="status-grid">
      <article class="status-card"><span class="status-icon">◷</span><small>最近對話</small><strong>今日 10:24</strong><span class="status-good">已完成</span></article>
      <article class="status-card"><span class="status-icon">♡</span><small>故事進度</small><strong>${storyStatus}</strong><span class="status-good">${state.story?.confirmed ? "可以分享" : "等待審閱"}</span></article>
      <article class="status-card ${state.paused ? "attention" : ""}"><span class="status-icon">!</span><small>安全狀態</small><strong>${safetyStatus}</strong><span>${state.paused ? "請聯絡長者" : "一切正常"}</span></article>
    </section>
    <section class="dashboard-panel">
      <div class="panel-heading"><div><p class="eyebrow">最近完成</p><h2>阿梅婆婆的故事</h2></div><span class="ai-label">長者已確認</span></div>
      ${state.story?.confirmed ? `<p class="dashboard-quote">「${escapeHtml(state.story.text.slice(0, 90))}${state.story.text.length > 90 ? "…" : ""}」</p>
        <div class="dashboard-actions"><button id="dashboard-preview" class="primary">預覽故事</button><button id="dashboard-message" class="secondary">留一句話</button></div>` : `<div class="dashboard-empty">長者完成審閱後，確認嘅故事會顯示喺呢度。</div>`}
    </section>
    <section class="dashboard-panel">
      <div class="panel-heading"><div><p class="eyebrow">回憶資料</p><h2>相片及內容</h2></div><span class="step">${state.photo ? "1 張相片" : "未有相片"}</span></div>
      ${state.photo ? `<div class="dashboard-memory"><img src="${state.photo.image}" alt="${escapeHtml(state.photo.title || "回憶相片")}" /><div><h3>${escapeHtml(state.photo.title || "未命名回憶")}</h3><p>${escapeHtml(state.photo.caption || "未有補充內容。")}</p><span class="status-good">由長者選擇分享</span></div></div>` : `<div class="dashboard-empty">長者尚未上載相片。</div>`}
    </section>
    <p class="dashboard-note">Demo 介面：真實版本會根據長者同意及機構權限顯示資料。</p>
  </div>`;
  document.querySelector("#back-to-senior").addEventListener("click", () => { state.view = "senior"; render(); });
  document.querySelector("#dashboard-preview")?.addEventListener("click", () => {
    state.view = "senior";
    render();
    document.querySelector(".story-section")?.scrollIntoView({ behavior: "smooth" });
  });
  document.querySelector("#dashboard-message")?.addEventListener("click", () => alert("家人留言功能（Demo）"));
}

function render() {
  if (state.focusMode) {
    renderFocusMode();
    return;
  }
  if (state.view === "caregiver") {
    renderCaregiverDashboard();
    return;
  }
  const elapsed = Math.floor((Date.now() - state.startedAt) / 60000);
  const selectedTopic = memoryTopics.find(([id]) => id === state.topic);
  const messages = state.messages.length
    ? state.messages.map((message) => `<article class="message ${message.role}">
        <span class="role">${message.role === "agent" ? "憶旅" : "我"}</span>
        <p>${escapeHtml(message.text)}</p>
        ${message.role === "agent" ? `<button class="speak-button" data-speak="${escapeHtml(message.text)}">🔊 再讀一次</button>` : ""}
      </article>`).join("")
    : `<div class="empty"><span class="wave">☊</span><p>準備好聽你講故事喇。</p></div>`;

  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div><span class="brand-mark">憶</span><span class="brand">憶旅</span></div>
        <div class="top-actions">
          <button id="load-demo" class="demo-button">▶ Demo 示範</button>
          <button id="caregiver-view" class="dashboard-button">照顧者模式</button>
          <button id="focus-view" class="focus-button">全屏傾偈</button>
          <span class="timer">本節 ${elapsed} / 45 分鐘</span>
        </div>
      </header>
      <section class="intro">
        <p class="eyebrow">廣東話 AI 回憶助手</p>
        <h1>${selectedTopic ? `今日講吓：${selectedTopic[1]}` : "今日想由邊段回憶開始？"}</h1>
        <p>我係 AI 助手，唔係真人。放心，我唔會問銀行資料、身份證號碼或者地址。</p>
      </section>
      <section class="topic-section">
        <div class="section-heading">
          <div><p class="eyebrow">揀一個你想講嘅方向</p><h2>由邊段回憶開始？</h2></div>
          ${selectedTopic ? `<button id="change-topic" class="text-button">更換主題</button>` : ""}
        </div>
        <div class="topic-grid">
          ${memoryTopics.map(([id, title, description, icon]) => `<button class="topic-card ${id === state.topic ? "selected" : ""}" data-topic="${id}">
            <span class="topic-icon">${icon}</span><strong>${title}</strong><small>${description}</small>
          </button>`).join("")}
        </div>
      </section>
      ${state.paused ? `<section class="safety-alert" role="alert">
        <strong>我哋先停一停</strong>
        <p>你嘅感受好重要。請搵身邊嘅真人照顧者陪住你。</p>
        <button id="notify-caregiver" class="primary">叫人嚟幫手（模擬通知）</button>
        <button id="resume" class="secondary">休息／下次再講</button>
      </section>` : ""}
      <section class="conversation" aria-live="polite">${messages}</section>
      <section class="story-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">長者主導</p>
            <h2>整理成一段故事</h2>
          </div>
          <span class="step">需要確認</span>
        </div>
        ${state.story ? `<article class="story-review">
          <span class="ai-label">AI 整理・${state.story.confirmed ? "已確認" : "尚未確認"}</span>
          <h3>${escapeHtml(state.story.title || "我的回憶")}</h3>
          <p class="review-help">以下內容只係草稿。你可以直接修改，確認後先會加入故事書。</p>
          <textarea id="story-editor" rows="7" aria-label="故事內容">${escapeHtml(state.story.text)}</textarea>
          <div class="review-actions">
            <button id="save-story-draft" class="secondary">儲存修改</button>
            ${state.story.confirmed ? `<div class="confirmed">✓ 已加入故事書</div>` : `<button id="confirm-story-text" class="primary">我確認呢段故事</button>`}
          </div>
        </article>` : `<div class="story-empty">
          <p>對話後，憶旅會將你講過嘅內容整理成草稿。</p>
          <button id="create-story" class="primary" ${draftStory() ? "" : "disabled"}>整理對話成故事草稿</button>
        </div>`}
      </section>
      <section class="share-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">分享給家人</p>
            <h2>故事分享頁</h2>
          </div>
          <span class="step">私隱由你決定</span>
        </div>
        ${state.story?.confirmed ? `<p class="share-help">只有已確認嘅故事先可以分享。家人掃描 QR code，就可以睇故事同留言。</p>
          <div class="share-controls">
            <label class="consent-toggle"><input id="sharing-consent" type="checkbox" ${state.sharing?.enabled ? "checked" : ""} /> 我同意分享呢段故事</label>
            <button id="create-share" class="primary" ${state.sharing?.enabled ? "" : "disabled"}>產生分享 QR Code</button>
          </div>
          ${state.sharing?.enabled ? `<div class="share-result">
            <div class="qr" aria-label="故事分享 QR Code">${createQrCode()}</div>
            <div>
              <strong>已建立私人分享頁</strong>
              <p class="share-url">${escapeHtml(state.sharing.url)}</p>
              <div class="share-buttons">
                <button id="share-whatsapp" class="share-button whatsapp" aria-label="分享到 WhatsApp">${shareIcons.whatsapp}<span>WhatsApp</span></button>
                <button id="share-facebook" class="share-button facebook" aria-label="分享到 Facebook">${shareIcons.facebook}<span>Facebook</span></button>
                <button id="share-wechat" class="share-button wechat" aria-label="分享到微信">${shareIcons.wechat}<span>微信</span></button>
                <button id="copy-share" class="share-button copy">複製連結</button>
                <button id="native-share" class="share-button more">更多分享</button>
              </div>
              <button id="open-share" class="text-button">預覽故事分享頁</button>
            </div>
          </div>` : ""}` : `<p class="share-help">完成故事確認後，先可以產生 QR Code 分享頁。</p>`}
      </section>
      <section class="memory-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">保存一段回憶</p>
            <h2>加一張舊相</h2>
          </div>
          <span class="step">下一步</span>
        </div>
        ${state.photo ? `<article class="story-card">
          <img src="${state.photo.image}" alt="${escapeHtml(state.photo.title || "長者上載的舊相")}" />
          <div class="story-card-content">
            <span class="ai-label">AI 整理・請長者確認</span>
            <h3>${escapeHtml(state.photo.title || "未命名回憶")}</h3>
            ${state.photo.year ? `<p class="memory-meta">${escapeHtml(state.photo.year)}${state.photo.people ? ` · ${escapeHtml(state.photo.people)}` : ""}</p>` : ""}
            <p>${escapeHtml(state.photo.caption || "你可以補充呢張相背後嘅故事。")}</p>
            ${state.photo.confirmed ? `<div class="confirmed">✓ 已由長者確認，加入故事書</div>` : `<button id="confirm-story" class="primary">我確認，加入故事書</button>`}
            <button id="remove-photo" class="text-button">移除呢張相</button>
          </div>
        </article>` : `<form id="photo-form" class="photo-form">
          <label class="upload-box" for="photo-input">
            <span class="upload-icon">＋</span>
            <strong>上載一張舊相</strong>
            <small>可以從手機相簿選擇，圖片只保存在此瀏覽器</small>
          </label>
          <input id="photo-input" type="file" accept="image/*" />
          <div class="photo-fields">
            <input id="photo-title" placeholder="相片標題，例如：婆婆煮飯嘅廚房" />
            <input id="photo-year" inputmode="numeric" placeholder="大約年份（可留空）" />
            <input id="photo-people" placeholder="相中人物（可留空）" />
            <textarea id="photo-caption" rows="3" placeholder="想記低嘅故事或長者原句（可留空）"></textarea>
          </div>
          <button class="primary" type="submit">生成故事卡</button>
        </form>`}
      </section>
      <form id="composer" class="${state.paused ? "disabled" : ""}">
        <input id="manual-input" aria-label="輸入你想講嘅內容" placeholder="可以打字，或者撳咪講嘢…" ${state.paused ? "disabled" : ""} />
        <button class="mic ${state.listening ? "active" : ""}" type="button" id="listen" aria-label="開始粵語語音輸入"><span>${state.listening ? "■" : "🎙"}</span><small>${state.listening ? "停止" : "講廣東話"}</small></button>
        <button class="send" type="submit" ${state.paused ? "disabled" : ""}>送出</button>
      </form>
      <footer>
        <button id="clear" class="text-button">清除本次逐字稿</button>
        <span>內容只儲存在此瀏覽器（Demo）</span>
      </footer>
      <details class="trust"><summary>了解憶旅如何工作</summary><p>${escapeHtml(AGENT_SYSTEM_PROMPT)}</p></details>
    </div>`;

  document.querySelector("#listen").addEventListener("click", startListening);
  document.querySelectorAll("[data-topic]").forEach((button) => button.addEventListener("click", () => selectTopic(button.dataset.topic)));
  document.querySelector("#change-topic")?.addEventListener("click", () => {
    state.topic = "";
    localStorage.removeItem("yiloi-topic-v1");
    render();
  });
  document.querySelector("#caregiver-view").addEventListener("click", () => { state.view = "caregiver"; render(); });
  document.querySelector("#focus-view").addEventListener("click", () => { state.focusMode = true; render(); });
  document.querySelector("#load-demo").addEventListener("click", () => {
    if (state.messages.length && !confirm("載入 Demo 內容會取代目前逐字稿，是否繼續？")) return;
    loadDemo();
  });
  document.querySelector("#sharing-consent")?.addEventListener("change", (event) => {
    document.querySelector("#create-share").disabled = !event.target.checked;
  });
  document.querySelector("#create-share")?.addEventListener("click", () => {
    state.sharing = {
      enabled: true,
      url: `${window.location.origin}${window.location.pathname}?story=demo-${Date.now()}`,
    };
    saveSharing();
    render();
  });
  document.querySelector("#copy-share")?.addEventListener("click", async (event) => {
    await copyShareUrl();
    event.currentTarget.textContent = "已複製連結";
  });
  document.querySelector("#share-whatsapp")?.addEventListener("click", () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${getShareText()} ${getShareUrl()}`)}`, "_blank", "noopener,noreferrer");
  });
  document.querySelector("#share-facebook")?.addEventListener("click", () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`, "_blank", "noopener,noreferrer");
  });
  document.querySelector("#share-wechat")?.addEventListener("click", async (event) => {
    await copyShareUrl();
    event.currentTarget.textContent = "連結已複製";
    alert("分享連結已複製，請貼到微信對話或朋友圈。");
  });
  document.querySelector("#native-share")?.addEventListener("click", async (event) => {
    if (navigator.share) {
      await navigator.share({ title: getShareText(), text: getShareText(), url: getShareUrl() });
      return;
    }
    await copyShareUrl();
    event.currentTarget.textContent = "連結已複製";
  });
  document.querySelector("#open-share")?.addEventListener("click", () => {
    window.open(state.sharing.url, "_blank", "noopener,noreferrer");
  });
  document.querySelector("#composer").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#manual-input");
    handleTranscript(input.value);
    input.value = "";
  });
  document.querySelector("#clear").addEventListener("click", () => {
    if (confirm("確定清除本次逐字稿？")) { state.messages = []; save(); render(); }
  });
  document.querySelector("#photo-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const file = document.querySelector("#photo-input").files[0];
    if (!file) {
      alert("請先選擇一張相片。");
      return;
    }

    async function copyShareUrl() {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(getShareUrl());
        return;
      }
      const input = document.createElement("input");
      input.value = getShareUrl();
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    const reader = new FileReader();
    reader.onload = () => {
      state.photo = {
        image: reader.result,
        title: document.querySelector("#photo-title").value.trim(),
        year: document.querySelector("#photo-year").value.trim(),
        people: document.querySelector("#photo-people").value.trim(),
        caption: document.querySelector("#photo-caption").value.trim(),
        confirmed: false,
      };
      savePhoto();
      render();
    };
    reader.readAsDataURL(file);
  });
  document.querySelector("#create-story")?.addEventListener("click", () => {
    state.story = {
      title: state.photo?.title || "我記得嘅一段日子",
      text: draftStory(),
      confirmed: false,
    };
    saveStory();
    render();
  });
  document.querySelector("#save-story-draft")?.addEventListener("click", () => {
    state.story.text = document.querySelector("#story-editor").value.trim();
    state.story.confirmed = false;
    saveStory();
    render();
  });
  document.querySelector("#confirm-story-text")?.addEventListener("click", () => {
    const text = document.querySelector("#story-editor").value.trim();
    if (!text) {
      alert("請先寫一點故事內容。");
      return;
    }
    state.story.text = text;
    state.story.confirmed = true;
    saveStory();
    render();
  });
  document.querySelector("#confirm-story")?.addEventListener("click", () => {
    state.photo.confirmed = true;
    savePhoto();
    render();
  });
  document.querySelector("#remove-photo")?.addEventListener("click", () => {
    state.photo = null;
    savePhoto();
    render();
  });
  document.querySelectorAll("[data-speak]").forEach((button) => button.addEventListener("click", () => speak(button.dataset.speak)));
  document.querySelector("#notify-caregiver")?.addEventListener("click", (event) => {
    event.currentTarget.textContent = "已通知照顧者（Demo）";
    event.currentTarget.disabled = true;
  });
  document.querySelector("#resume")?.addEventListener("click", () => {
    state.paused = false;
    addMessage("agent", "好，我哋休息一陣先。你準備好嘅時候，再同我講都得。");
  });
}

if (renderSharePage()) {
  // Read-only share view.
} else if (state.messages.length === 0) {
  addMessage("agent", "你好，我係憶旅，一個 AI 回憶助手，唔係真人。我唔會問你銀行資料、身份證號碼或者地址。今日食咗飯未？我哋可以先輕鬆傾兩句。");
} else {
  render();
}
