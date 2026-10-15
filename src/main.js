import "./styles.css";
import { AGENT_SYSTEM_PROMPT, DANGER_PATTERNS } from "./agent-system-prompt.js";

const TRANSCRIPT_KEY = "yiloi-interview-transcript-v1";
const PHOTO_KEY = "yiloi-interview-photo-v1";
const STORY_KEY = "yiloi-interview-summary-v1";
const SHARE_KEY = "yiloi-interview-share-v1";
const INTERVIEW_ENDED_KEY = "yiloi-interview-ended-v1";
const supportsSpeech = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const state = {
  messages: JSON.parse(localStorage.getItem(TRANSCRIPT_KEY) || "[]"),
  photo: JSON.parse(localStorage.getItem(PHOTO_KEY) || "null"),
  story: JSON.parse(localStorage.getItem(STORY_KEY) || "null"),
  sharing: JSON.parse(localStorage.getItem(SHARE_KEY) || "null"),
  view: "caregiver",
  topic: localStorage.getItem("yiloi-topic-v1") || "",
  focusMode: false,
  workflowStage: 1,
  listening: false,
  paused: false,
  speaker: "staff",
  interviewConsent: false,
  liveTranscript: "",
  status: "",
  suggestions: [],
  suggestionsLoading: false,
  summaryLoading: false,
  interviewEnded: localStorage.getItem(INTERVIEW_ENDED_KEY) === "true",
  startedAt: Date.now(),
  recognition: null,
};

const app = document.querySelector("#app");

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[character]));
}

// 前端呼叫代理設定（可在 dev 時覆寫 window.PROXY_URL）
const PROXY_URL = window.PROXY_URL || import.meta.env.VITE_PROXY_URL || 'http://localhost:3001/api/chat';

// Send staff-only assistance requests to the server-side AI proxy.
async function queryProxy(messages) {
  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "deepseek-flash", messages }),
  });
  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`AI request failed (${response.status}): ${responseText.slice(0, 300)}`);
  }
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error("AI proxy returned an invalid response.");
  }
  const content = data.choices?.[0]?.message?.content || data.reply;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("AI proxy returned no text.");
  }
  return content.trim();
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
  const familyResponse = JSON.parse(localStorage.getItem("yiloi-interview-family-response-v1") || "null");
  const title = state.story.title || "我的回憶";
  app.innerHTML = `<div class="shell share-page">
    <header class="topbar"><div><span class="brand-mark">憶</span><span class="brand">憶旅</span></div><span class="step">長者已確認</span></header>
    <section class="share-hero"><p class="eyebrow">一段留給家人的回憶</p><h1>${escapeHtml(title)}</h1><p>呢段故事由長者親自審閱及確認。你可以慢慢睇，亦可以分享一小段自己嘅故事。</p></section>
    <div class="chapter-progress"><span class="active">1</span><i></i><span class="${familyResponse ? "active" : ""}">2</span><i></i><span class="${familyResponse ? "active" : ""}">3</span></div>
    <p class="chapter-label">CHAPTER 1 · 公公的故事</p>
    ${state.photo?.image ? `<img class="shared-photo" src="${state.photo.image}" alt="${escapeHtml(state.photo.title || "回憶相片")}" />` : ""}
    <article class="shared-story"><span class="ai-label">長者已確認</span><p>${escapeHtml(state.story.text)}</p></article>
    <section class="family-invite">
      <p class="eyebrow">輪到你了</p><h2>你還記得自己第一次工作嗎？</h2>
      <p>可以錄一段語音、寫幾句，或者跳過，繼續睇故事。你唔需要註冊帳戶。</p>
      ${familyResponse ? `<div class="response-saved"><strong>✓ 你已分享</strong><p>${escapeHtml(familyResponse.text)}</p></div>
        <section class="connection-card"><span class="ai-label">兩代人的第一次工作</span><h3>不同年代，相似的第一次</h3><p>公公 18 歲做裁縫，家人分享了自己的第一份工作。呢兩段經歷可以成為下一次見面時嘅話題。</p></section>` : `<div class="response-options">
          <button id="family-voice" class="response-option"><span>🎙</span><strong>錄一段語音分享</strong><small>保留你自己嘅語氣</small></button>
          <button id="family-text" class="response-option"><span>✍</span><strong>寫幾句就好</strong><small>分享一小段回憶</small></button>
          <button id="family-skip" class="response-option muted"><span>→</span><strong>先跳過</strong><small>繼續睇故事</small></button>
        </div>
        <div id="family-composer" class="family-composer" hidden><textarea id="family-note" rows="4" placeholder="例如：我第一份暑期工係喺咖啡店做，每日都好緊張。"></textarea><div><button id="save-family-note" class="primary">分享呢段回憶</button><button id="cancel-family-note" class="text-button">稍後先</button></div></div>`}
    </section>
    <section class="next-chapter"><p class="eyebrow">下一章</p><h2>屋企人返工返學後，一齊食飯</h2><p>繼續閱讀長者其他回憶，慢慢拼返一個屬於你哋嘅故事。</p><button id="continue-story" class="secondary">繼續睇故事（Demo）</button></section>
    <footer><span>憶旅・由長者決定分享內容</span><a href="${window.location.pathname}">返回我的憶旅</a></footer>
  </div>`;
  document.querySelector("#family-text")?.addEventListener("click", () => { document.querySelector("#family-composer").hidden = false; });
  document.querySelector("#family-voice")?.addEventListener("click", () => {
    document.querySelector("#family-composer").hidden = false;
    document.querySelector("#family-note").placeholder = "語音 Demo：請先用文字輸入你想分享嘅內容。";
    document.querySelector("#family-note").focus();
  });
  document.querySelector("#family-skip")?.addEventListener("click", () => {
    document.querySelector(".family-invite").innerHTML = `<p class="eyebrow">繼續閱讀</p><h2>你可以之後先分享</h2><p>唔緊要，先睇長者嘅下一段故事。下次返嚟，仍然可以分享你嘅回憶。</p>`;
  });
  document.querySelector("#save-family-note")?.addEventListener("click", () => {
    const text = document.querySelector("#family-note").value.trim();
    if (!text) return;
    localStorage.setItem("yiloi-interview-family-response-v1", JSON.stringify({ text, at: new Date().toISOString() }));
    renderSharePage();
  });
  document.querySelector("#cancel-family-note")?.addEventListener("click", () => { document.querySelector("#family-composer").hidden = true; });
  document.querySelector("#continue-story")?.addEventListener("click", (event) => {
    event.currentTarget.textContent = "下一章已打開（Demo）";
    event.currentTarget.disabled = true;
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
  localStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(state.messages));
}

function savePhoto() {
  localStorage.setItem(PHOTO_KEY, JSON.stringify(state.photo));
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
  render();
}

function getStoryProfile() {
  return state.story?.profile || {
    people: state.photo?.people || "婆婆、屋企人",
    place: state.photo?.title?.includes("深水埗") ? "深水埗" : "待長者補充",
    year: state.photo?.year || "待長者補充",
    quote: state.story?.text?.split("。")[0] || "待長者選出原句",
  };
}

function loadDemo() {
  state.messages = [
    { role: "staff", text: "你細個住喺邊度？有冇一段特別記得嘅日常生活？", at: new Date().toISOString() },
    { role: "elderly", text: "我細個住喺深水埗，最鍾意睇婆婆煮飯。", at: new Date().toISOString() },
    { role: "staff", text: "婆婆最常煮咩餸？", at: new Date().toISOString() },
    { role: "elderly", text: "佢最叻煮梅菜扣肉，屋企人返工返學都會一齊食。", at: new Date().toISOString() },
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
  state.story = null;
  state.suggestions = [];
  state.interviewEnded = false;
  state.paused = false;
  state.status = "已載入示範逐字稿。呢啲係示範內容，唔係實際訪談。";
  localStorage.removeItem(INTERVIEW_ENDED_KEY);
  save();
  saveStory();
  render();
}

function addTranscriptEntry(role, text) {
  const entry = { role, text: text.trim(), at: new Date().toISOString() };
  state.messages.push(entry);
  save();
  if (role === "elderly" && isDangerous(entry.text)) {
    state.paused = true;
    state.listening = false;
    state.recognition?.stop();
    state.status = "長者可能需要即時關心。請訪問者暫停訪談，陪伴長者並按機構安全流程處理。";
  } else {
    state.status = "逐字稿已儲存於此瀏覽器。";
  }
  render();
}

function isDangerous(text) {
  return DANGER_PATTERNS.some((pattern) => text.includes(pattern));
}

function handleTranscript(text, speaker = state.speaker) {
  const trimmedText = text.trim();
  if (!trimmedText || state.paused || state.interviewEnded) return;
  addTranscriptEntry(speaker, trimmedText);
}

function transcriptForAi() {
  return state.messages
    .map(({ role, text }) => `${role === "staff" ? "訪問者" : "長者"}：${text}`)
    .join("\n");
}

async function generateSuggestions() {
  if (!state.messages.some((message) => message.role === "elderly")) return;
  if (!state.interviewConsent) {
    state.status = "請先取得雙方同意，才可將逐字稿傳送至 AI 生成建議。";
    render();
    return;
  }
  state.suggestionsLoading = true;
  state.status = "AI 正為訪問者準備可選追問…";
  render();
  try {
    const suggestions = await queryProxy([
      {
        role: "system",
        content: "你是訪談工作人員的幕後助手，不會直接與長者對話。根據逐字稿，用香港繁體中文提供最多 3 條簡短、開放式、溫和的可選追問。只輸出問題清單，不要推測或補充逐字稿沒有的事實。",
      },
      { role: "user", content: `訪談逐字稿：\n${transcriptForAi()}` },
    ]);
    state.suggestions = suggestions
      .split("\n")
      .map((line) => line.replace(/^\s*[-*•\d.、)]+\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 3);
    state.status = "追問建議已準備好；由訪問者決定是否使用。";
  } catch (error) {
    console.error("Could not generate interview suggestions", error);
    state.status = `未能取得 AI 追問建議：${error.message}`;
  } finally {
    state.suggestionsLoading = false;
    render();
  }
}

async function endInterview() {
  if (state.listening) {
    await stopListening();
  }
  if (state.paused) {
    state.status = "請先由真人訪問者按安全流程跟進，再考慮整理摘要。";
    render();
    return;
  }
  if (!state.messages.some((message) => message.role === "elderly")) {
    state.status = "請先記錄長者分享的內容，再生成摘要。";
    render();
    return;
  }
  if (!state.interviewConsent) {
    state.status = "請先取得雙方同意，才可將逐字稿傳送至 AI 生成摘要。";
    render();
    return;
  }
  state.summaryLoading = true;
  state.status = "AI 正在整理逐字稿；請訪問者核對摘要。";
  render();
  try {
    const summary = await queryProxy([
      {
        role: "system",
        content: "你是訪談工作人員的幕後摘要助手，不會直接回覆長者。請以香港繁體中文忠實整理長者說過的內容，簡潔涵蓋重要人物、地點、事件、感受和待確認細節。不可捏造或把訪問者說的內容當成長者經歷。只輸出摘要草稿，並提醒工作人員及長者核對。",
      },
      { role: "user", content: `請根據以下人與人訪談逐字稿整理摘要：\n${transcriptForAi()}` },
    ]);
    state.story = {
      title: "訪談摘要（待核對）",
      text: summary,
      confirmed: false,
      profileConfirmed: false,
      profile: {
        people: state.photo?.people || "待長者補充",
        place: state.photo?.title?.includes("深水埗") ? "深水埗" : "待長者補充",
        year: state.photo?.year || "待長者補充",
        quote: summary.split("。")[0] || "待長者選出原句",
      },
      sharePermissions: { story: true, quote: false, photo: false, details: false },
    };
    saveStory();
    state.interviewEnded = true;
    localStorage.setItem(INTERVIEW_ENDED_KEY, "true");
    state.status = "摘要已生成並儲存。請與長者一起核對後再確認或分享。";
    state.focusMode = false;
    state.workflowStage = 3;
  } catch (error) {
    console.error("Could not summarize interview", error);
    state.status = `未能生成摘要：${error.message}`;
  } finally {
    state.summaryLoading = false;
    render();
  }
}

function startListening() {
  if (!supportsSpeech) {
    state.status = "此瀏覽器不支援語音轉錄；請使用下方文字欄記錄對話。";
    render();
    document.querySelector("#manual-input")?.focus();
    return;
  }
  if (!state.interviewConsent) {
    state.status = "請先取得訪問者及長者同意，並勾選訪談處理同意。";
    render();
    return;
  }
  if (state.listening) {
    stopListening();
    return;
  }
  state.listening = true;
  state.status = "正在準備語音轉錄；訪問者先開始說話。";
  startRecognitionSegment();
  render();
}

function startRecognitionSegment() {
  state.recognition = new SpeechRecognition();
  state.recognition.lang = "zh-HK";
  state.recognition.interimResults = true;
  state.recognition.continuous = true;
  const speaker = state.speaker;
  state.liveTranscript = "";
  const recognition = state.recognition;
  state.status = `正在轉錄${speaker === "staff" ? "訪問者" : "長者"}；切換說話者不會停止整段錄音。`;
  recognition.onstart = () => { render(); };
  recognition.onresult = (event) => {
    state.liveTranscript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join(" ")
      .trim();
    const preview = document.querySelector("#live-preview");
    if (preview) preview.textContent = state.liveTranscript;
  };
  recognition.onerror = (event) => {
    state.listening = false;
    state.status = `語音轉錄失敗（${event.error}）。可改用文字輸入。`;
    render();
  };
  recognition.onend = () => {
    const transcript = state.liveTranscript;
    state.liveTranscript = "";
    if (transcript) {
      handleTranscript(transcript, speaker);
    }
    if (state.listening && !state.paused) {
      startRecognitionSegment();
      render();
    } else if (!transcript && !state.paused) {
      state.status = "未辨識到語音；可以重試或改用文字輸入。";
      render();
    }
  };
  try {
    recognition.start();
  } catch (error) {
    state.listening = false;
    state.status = `無法啟動語音轉錄：${error.message}`;
    render();
  }
}

function switchSpeaker() {
  state.speaker = state.speaker === "staff" ? "elderly" : "staff";
  if (state.listening) {
    state.status = `正在切換至${state.speaker === "staff" ? "訪問者" : "長者"}；錄音會持續。`;
    state.recognition?.stop();
  } else {
    state.status = `已切換至${state.speaker === "staff" ? "訪問者" : "長者"}。`;
  }
  render();
}

function stopListening() {
  const recognition = state.recognition;
  if (!recognition || !state.listening) return Promise.resolve();
  state.listening = false;
  return new Promise((resolve) => {
    const onEnd = recognition.onend;
    recognition.onend = (event) => {
      onEnd?.call(recognition, event);
      resolve();
    };
    recognition.stop();
  });
}

function renderFocusMode() {
  const lastEntry = state.messages[state.messages.length - 1];
  const speakerLabel = (speaker) => speaker === "staff" ? "訪問者" : "長者";
  const storyReady = state.story?.confirmed && state.story.profileConfirmed !== false;
  app.innerHTML = `<div class="focus-shell">
    <header class="focus-topbar">
      <button id="exit-focus" class="focus-back">← 返回照顧者工作台</button>
      <span class="brand"><span class="brand-mark">憶</span>憶旅</span>
      <span class="focus-time">長者模式</span>
    </header>
    <main class="focus-main">
      <p class="eyebrow">${state.topic ? `訪談主題：${escapeHtml(memoryTopics.find(([id]) => id === state.topic)?.[1] || "")}` : "訪問者與長者面對面對話"}</p>
      <div class="focus-orb ${state.listening ? "is-listening" : ""}"><span>${state.listening ? "■" : "🎙"}</span></div>
      <h1>${state.listening ? `正在轉錄${speakerLabel(state.speaker)}…` : "繼續你們的對話"}</h1>
      <p class="focus-hint">AI 只會協助轉錄和整理摘要，不會代替訪問者發問或回覆。</p>
      <label class="transcription-consent"><input id="focus-transcription-consent" type="checkbox" ${state.interviewConsent ? "checked" : ""} /> 訪問者及長者同意使用瀏覽器語音轉錄，並將逐字稿傳送至設定的 AI 服務生成建議及摘要；本應用不保存音訊</label>
      ${lastEntry ? `<div class="focus-transcript"><span>${speakerLabel(lastEntry.role)}・最近記錄</span><p>「${escapeHtml(lastEntry.text)}」</p></div>` : ""}
      ${state.listening ? `<div class="live-preview" id="live-preview">${escapeHtml(state.liveTranscript || "聆聽中…")}</div>` : ""}
      <div class="speaker-picker" aria-live="polite">
        <span class="current-speaker">目前說話者：${speakerLabel(state.speaker)}</span>
        <button id="focus-switch-speaker" type="button">切換至${speakerLabel(state.speaker === "staff" ? "elderly" : "staff")}${state.listening ? "（錄音繼續）" : ""}</button>
      </div>
      <button id="focus-listen" class="focus-mic ${state.listening ? "active" : ""}" ${state.interviewEnded || state.paused ? "disabled" : ""}><span>${state.listening ? "■" : "🎙"}</span><strong>${state.listening ? "停止整段錄音" : "開始整段錄音"}</strong></button>
      <div class="focus-actions"><button id="focus-rest" class="secondary">我想休息</button><button id="focus-end" class="primary" ${!state.messages.some((message) => message.role === "elderly") || state.summaryLoading || state.interviewEnded ? "disabled" : ""}>${state.summaryLoading ? "正在生成摘要…" : state.interviewEnded ? "訪談已結束" : "結束訪談並生成摘要"}</button></div>
      ${storyReady ? `<section class="focus-sharing"><span class="ai-label">長者已確認</span><h2>你的故事準備好喇</h2><p>如果你願意，可以分享俾屋企人睇。</p><button id="focus-share" class="primary">${state.sharing?.enabled ? "分享連結已準備好" : "分享給家人"}</button><small>你可以隨時改變主意。</small></section>` : ""}
      ${state.status ? `<p class="status-message" role="status">${escapeHtml(state.status)}</p>` : ""}
    </main>
  </div>`;
  document.querySelector("#exit-focus").addEventListener("click", () => { state.focusMode = false; render(); });
  document.querySelector("#focus-listen").addEventListener("click", startListening);
  document.querySelector("#focus-transcription-consent").addEventListener("change", (event) => {
    state.interviewConsent = event.target.checked;
    if (!state.interviewConsent && state.listening) stopListening();
  });
  document.querySelector("#focus-switch-speaker")?.addEventListener("click", switchSpeaker);
  document.querySelector("#focus-end").addEventListener("click", endInterview);
  document.querySelector("#focus-rest").addEventListener("click", () => alert("好，我哋休息一陣先。準備好再撳咪高風。"));
  document.querySelector("#focus-share")?.addEventListener("click", () => {
    if (!state.sharing?.enabled) {
      state.sharing = {
        enabled: true,
        url: `${window.location.origin}${window.location.pathname}?story=demo-${Date.now()}`,
      };
      saveSharing();
    }
    renderFocusMode();
  });
}

function renderWorkflow() {
  const stages = [
    ["1", "活動前", "真人準備傾偈", "背景卡、建議題目、避開話題"],
    ["2", "活動中", "真人陪伴對話", "AI 記錄、標記重點，不打斷交流"],
    ["3", "活動後", "一起確認及延續", "故事卡、家人回應、下一次話題"],
  ];
  const stageContent = {
    1: `<div class="workflow-content">
      <div class="workflow-icon">▤</div><div><h3>俾訪問者一眼睇晒</h3><p>真人先了解長者背景，再決定點樣開始傾。AI 只提供準備資料，唔會代替訪問者發問。</p>
      <div class="prep-cards"><span>長者背景卡</span><span>今日 3 條建議題目</span><span>避開話題</span></div></div>
    </div>`,
    2: `<div class="workflow-content">
      <div class="workflow-icon live">●</div><div><h3>訪問者與長者真人對話</h3><p>訪問者主導提問及聆聽。AI 只按選定的說話者轉錄對話，並可提供可選追問，不會直接回覆長者。</p>
      <div class="tool-note"><strong>AI 幕後支援</strong><span>即時逐字稿</span><span>可選追問</span><span>不保存音訊</span></div></div>
    </div>`,
    3: `<div class="workflow-content">
      <div class="workflow-icon">♡</div><div><h3>故事係邀請，不係終點</h3><p>長者先確認內容及分享權限。之後家人可以閱讀、回應，為下一次真人見面帶來新話題。</p>
      <div class="prep-cards"><span>長者確認故事卡</span><span>家人語音／文字回應</span><span>下一次續談提示</span></div></div>
    </div>`,
  };
  return `<section class="workflow-section">
    <div class="workflow-heading"><div><p class="eyebrow">人係中心・AI 係工具</p><h2>一次互動，三個階段</h2></div><span class="human-badge">真人主導</span></div>
    <div class="workflow-steps">${stages.map(([number, title, subtitle]) => `<button class="workflow-step ${state.workflowStage === Number(number) ? "active" : ""}" data-workflow-stage="${number}"><b>${number}</b><strong>${title}</strong><small>${subtitle}</small></button>`).join("")}</div>
    ${stageContent[state.workflowStage]}
  </section>`;
}

function renderCaregiverDashboard() {
  const stage = state.workflowStage;
  const stageContent = {
    1: `<div class="caregiver-stage-grid">
      <section class="caregiver-card profile-card">
        <p class="eyebrow">長者備忘卡</p><h2>阿梅婆婆</h2>
        <p class="muted">深水埗 / 石硤尾 · 成長背景速讀</p>
        <div class="caregiver-divider"></div>
        <small>成長經歷</small><p>成長於石硤尾，18 歲起於深水埗製衣廠工作逾 20 年；性格爽朗好客，最拿手煮梅菜扣肉。</p>
        <small>溝通與健康提示</small><p>右耳聽力稍弱，對話時需正面面向長者，語速放慢。</p>
        <div class="caregiver-alert"><strong>⚠ 避開話題提醒</strong><span>避免主動問及丈夫數年前因病離世細節；若長者感傷，以溫和傾聽與適當為主。</span></div>
      </section>
      <section class="caregiver-card topic-card-panel">
        <p class="eyebrow">今日破冰題目</p><h2>選擇交談切入點</h2>
        <p class="muted">選取一個容易喚起愉快記憶的生活話題：</p>
        <button class="caregiver-topic selected" data-caregiver-topic="work"><strong>第一份工・車衣廠歲月</strong><span>年輕時的自豪感、師傅經歷、出第一份糧的滋味</span><small>開場問句：「阿梅婆婆，你仲記唔記得 18 歲嗰陣第一份工係做咩？」</small><b>✓ 今日已選</b></button>
        <button class="caregiver-topic" data-caregiver-topic="food"><strong>一餐飯與最重要的人</strong><span>圍坐開飯的味道、長輩手藝、難忘的團圓時光</span><small>開場問句：「細個圍埋食飯，邊個餸最令你記得？」</small></button>
        <button class="caregiver-topic" data-caregiver-topic="neighbourhood"><strong>舊樓鄰里與童年歲月</strong><span>石硤尾徙置區、走廊乘涼、街坊鄰里人情味</span><small>開場問句：「以前住樓嗰陣，街坊之間係咪好熱鬧？」</small></button>
        <button id="start-session" class="primary caregiver-start">開始陪伴長者（進入活動中） →</button>
      </section>
    </div>`,
    2: `<div class="caregiver-stage-grid">
      <section class="caregiver-card live-card">
        <div class="stage-card-heading"><div><p class="eyebrow">活動中・真人傾談</p><h2>專心望住阿梅婆婆</h2></div><span class="live-indicator">● 進行中</span></div>
        <p class="muted">AI 只在背景記錄，不會代替你發問。</p>
        <div class="live-transcript">${state.messages.length ? state.messages.slice(-3).map((message) => `<p><strong>${message.role === "elderly" ? "阿梅婆婆" : "訪問者"}</strong>${escapeHtml(message.text)}</p>`).join("") : `<p><strong>等待對話</strong>你可以由今日已選的題目開始。</p>`}</div>
        <div class="keyword-row"><span>深水埗 · 地點</span><span>18 歲 · 年份</span><span>裁縫 · 工作</span></div>
        <button id="open-conversation" class="primary caregiver-start">開啟對話工具 →</button>
      </section>
      <section class="caregiver-card followup-card"><p class="eyebrow">AI 幕後提示</p><h2>可以稍後追問</h2><div class="followup-item">「你當時第一日返工，最記得邊一樣嘢？」</div><div class="followup-item">「第一份人工，你有冇買啲嘢俾屋企人？」</div><div class="caregiver-note">如果長者感到疲倦，可以先休息，不需要完成所有問題。</div></section>
    </div>`,
    3: `<div class="caregiver-stage-grid">
      <section class="caregiver-card recap-card"><p class="eyebrow">活動後・手帳</p><h2>把今日對話留低</h2><p class="muted">長者確認後，故事才會交給家人，成為下一次見面的起點。</p><div class="recap-list"><div><strong>今日完成</strong><span>✓ 記錄第一份工作故事</span><span>✓ 找到深水埗與裁縫關鍵詞</span></div><div><strong>下次可以繼續</strong><span>・第一次出糧用來做什麼</span><span>・當年工作的同事和師傅</span></div></div><button id="open-story-profile" class="primary caregiver-start">查看 Story Profile →</button></section>
      <section class="caregiver-card next-visit-card"><p class="eyebrow">下一次見面</p><h2>留一句接續提示</h2><div class="next-visit-quote">「下次可以問阿梅婆婆：第一份人工有冇買嘢俾屋企人？」</div><p class="muted">這不是 AI 結論，而是給下一位訪問者的溫柔提示。</p><button id="back-to-prep" class="secondary caregiver-start">返回活動前準備</button></section>
    </div>`,
  };
  app.innerHTML = `<div class="shell dashboard">
    <header class="topbar">
      <div class="brand-lockup"><span class="brand-mark">憶</span><div><span class="brand">憶旅・照顧者工作台</span><small>真人陪伴・AI 幕後支援</small></div></div>
      <div class="caregiver-top-actions"><span class="resident-chip">阿梅婆婆（82 歲）</span><button id="back-to-senior" class="secondary">切換長者全屏</button><button class="size-button">標準</button><button class="size-button">大字</button><button id="load-demo" class="demo-button">▶ 示範數據</button></div>
    </header>
    <nav class="stage-tabs">${[["1","活動前・準備"],["2","活動中・傾談"],["3","活動後・手帳"]].map(([number, label]) => `<button class="${stage === Number(number) ? "active" : ""}" data-caregiver-stage="${number}"><b>${number}</b>${label}</button>`).join("")}</nav>
    ${stageContent[stage]}
    <p class="dashboard-note">Demo 介面：真實版本會根據長者同意及機構權限顯示資料。</p>
  </div>`;
  document.querySelector("#back-to-senior").addEventListener("click", () => {
    state.focusMode = true;
    render();
  });
  document.querySelectorAll("[data-caregiver-stage]").forEach((button) => button.addEventListener("click", () => {
    state.workflowStage = Number(button.dataset.caregiverStage);
    render();
  }));
  document.querySelector("#start-session")?.addEventListener("click", () => {
    state.workflowStage = 2;
    render();
  });
  document.querySelector("#open-conversation")?.addEventListener("click", () => {
    state.view = "senior";
    state.workflowStage = 2;
    render();
    document.querySelector(".conversation")?.scrollIntoView({ behavior: "smooth" });
  });
  document.querySelector("#open-story-profile")?.addEventListener("click", () => {
    state.view = "senior";
    render();
    document.querySelector(".story-section")?.scrollIntoView({ behavior: "smooth" });
  });
  document.querySelector("#back-to-prep")?.addEventListener("click", () => { state.workflowStage = 1; render(); });
  document.querySelector("#load-demo")?.addEventListener("click", () => loadDemo());
  document.querySelectorAll("[data-caregiver-topic]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-caregiver-topic]").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
  }));
  document.querySelector("#dashboard-preview")?.addEventListener("click", () => {
    state.view = "interview";
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
  const storyReady = state.story?.confirmed && state.story.profileConfirmed !== false;
  const messages = state.messages.length
    ? state.messages.map((message) => `<article class="message ${message.role}">
        <span class="role">${message.role === "staff" ? "訪問者" : "長者"}</span>
        <p>${escapeHtml(message.text)}</p>
      </article>`).join("")
    : `<div class="empty"><span class="wave">☊</span><p>訪問者與長者開始對話後，逐字稿會顯示喺呢度。</p></div>`;

  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div><span class="brand-mark">憶</span><span class="brand">憶旅</span></div>
        <div class="top-actions">
          <button id="load-demo" class="demo-button">▶ Demo 示範</button>
          <button id="caregiver-view" class="dashboard-button">訪問者工作台</button>
          <button id="focus-view" class="focus-button">全屏傾偈</button>
          <span class="timer">本節 ${elapsed} / 45 分鐘</span>
        </div>
      </header>
      <section class="intro">
        <p class="eyebrow">人與人對話・AI 幕後記錄</p>
        <h1>${selectedTopic ? `訪談主題：${selectedTopic[1]}` : "長者回憶訪談"}</h1>
        <p>訪問者與長者面對面傾談。AI 只負責轉錄、提供可選追問及整理摘要，不會代替訪問者同長者對話。</p>
      </section>
      ${renderWorkflow()}
      <section class="topic-section">
        <div class="section-heading">
          <div><p class="eyebrow">訪問前準備</p><h2>選擇訪談方向</h2></div>
          ${selectedTopic ? `<button id="change-topic" class="text-button">更換主題</button>` : ""}
        </div>
        <div class="topic-grid">
          ${memoryTopics.map(([id, title, description, icon]) => `<button class="topic-card ${id === state.topic ? "selected" : ""}" data-topic="${id}">
            <span class="topic-icon">${icon}</span><strong>${title}</strong><small>${description}</small>
          </button>`).join("")}
        </div>
      </section>
      ${state.paused ? `<section class="safety-alert" role="alert">
        <strong>請訪問者先停一停</strong>
        <p>逐字稿出現可能需要關心的內容。請由真人訪問者陪伴長者，並按機構安全流程處理；AI 不會自動回覆長者。</p>
        <button id="resume" class="secondary">訪問者確認後繼續記錄</button>
      </section>` : ""}
      <section class="interview-panel" aria-labelledby="transcript-heading">
        <div class="section-heading">
          <div><p class="eyebrow">訪談中</p><h2 id="transcript-heading">對話逐字稿</h2></div>
          <span class="step">${state.messages.length} 段記錄</span>
        </div>
        <p class="interview-instructions">開始前先取得訪問者及長者同意。語音可能由瀏覽器服務處理；生成追問或摘要時，逐字稿會傳送到設定的 AI 服務。本應用不會保存音訊。</p>
        <label class="transcription-consent"><input id="transcription-consent" type="checkbox" ${state.interviewConsent ? "checked" : ""} /> 訪問者及長者同意語音轉錄及將逐字稿傳送至 AI 服務</label>
        <section class="conversation" aria-live="polite">${messages}</section>
        ${state.listening ? `<div class="live-preview"><strong>即時辨識中・${state.speaker === "staff" ? "訪問者" : "長者"}</strong><p id="live-preview">${escapeHtml(state.liveTranscript || "聆聽中…")}</p></div>` : ""}
        <form id="composer" class="${state.paused || state.interviewEnded ? "disabled" : ""}">
          <div class="speaker-picker" aria-live="polite">
            <span class="current-speaker">目前說話者：${state.speaker === "staff" ? "訪問者" : "長者"}</span>
            <button id="switch-speaker" type="button">切換至${state.speaker === "staff" ? "長者" : "訪問者"}${state.listening ? "（錄音繼續）" : ""}</button>
          </div>
          <div class="composer-row">
            <input id="manual-input" aria-label="輸入訪談內容" placeholder="${state.speaker === "staff" ? "輸入訪問者說的內容…" : "輸入長者說的內容…"}" ${state.paused || state.interviewEnded ? "disabled" : ""} />
            <button class="mic ${state.listening ? "active" : ""}" type="button" id="listen" aria-label="${state.listening ? "停止整段錄音" : "開始整段錄音"}" ${state.paused || state.interviewEnded ? "disabled" : ""}><span>${state.listening ? "■" : "🎙"}</span><small>${state.listening ? "停止整段錄音" : "開始整段錄音"}</small></button>
            <button class="send" type="submit" ${state.paused || state.interviewEnded || state.listening ? "disabled" : ""}>加入逐字稿</button>
          </div>
        </form>
        ${state.status ? `<p class="status-message" role="status">${escapeHtml(state.status)}</p>` : ""}
      </section>
      <section class="followup-section">
        <div class="section-heading">
          <div><p class="eyebrow">只供工作人員參考</p><h2>可選追問建議</h2></div>
          <button id="suggest-questions" class="secondary" ${!state.messages.some((message) => message.role === "elderly") || state.suggestionsLoading || state.interviewEnded ? "disabled" : ""}>${state.suggestionsLoading ? "準備中…" : "生成追問建議"}</button>
        </div>
        <p class="interview-instructions">由訪問者自行決定是否採用；AI 不會把建議直接說給長者聽。</p>
        ${state.suggestions.length ? `<ul class="suggestion-list">${state.suggestions.map((suggestion) => `<li>${escapeHtml(suggestion)}</li>`).join("")}</ul>` : ""}
      </section>
      <section class="story-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">訪談後</p>
            <h2>AI 訪談摘要</h2>
          </div>
          <button id="end-interview" class="primary" ${!state.messages.some((message) => message.role === "elderly") || state.summaryLoading || state.interviewEnded ? "disabled" : ""}>${state.summaryLoading ? "正在生成摘要…" : state.interviewEnded ? "訪談已結束" : "結束訪談並生成摘要"}</button>
        </div>
        ${state.story ? `<article class="story-review">
          <span class="ai-label">AI 整理・${storyReady ? "已確認" : "尚未確認"}</span>
          <h3>${escapeHtml(state.story.title || "我的回憶")}</h3>
          <p class="review-help">以下內容只係草稿。你可以直接修改，確認後先會加入故事書。</p>
          <div class="profile-heading"><div><p class="eyebrow">Story Profile</p><strong>長者可以逐項確認嘅資料</strong></div><span class="step">${storyReady ? "已確認" : "待確認"}</span></div>
          <div class="profile-fields">
            ${Object.entries({ people: "人物", place: "地點", year: "年份", quote: "長者原句" }).map(([key, label]) => `<label class="profile-field"><input type="checkbox" data-profile="${key}" ${storyReady ? "checked" : ""} /><span><small>${label}</small><strong>${escapeHtml(getStoryProfile()[key])}</strong></span></label>`).join("")}
          </div>
          <textarea id="story-editor" rows="7" aria-label="故事內容">${escapeHtml(state.story.text)}</textarea>
          <div class="review-actions">
            <button id="save-story-draft" class="secondary">儲存修改</button>
            ${storyReady ? `<div class="confirmed">✓ 已加入故事書</div>` : `<button id="confirm-story-text" class="primary">確認 Story Profile 及故事</button>`}
          </div>
          <p class="review-help profile-disclaimer">AI 只係整理內容，未經長者逐項確認前，不會加入故事書或分享。</p>
        </article>` : `<div class="story-empty">
          <p>結束訪談後，AI 會整理長者說過的內容；摘要會先供工作人員和長者核對。</p>
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
        ${storyReady ? `<p class="share-help">只有已確認嘅故事先可以分享。家人掃描 QR code，就可以睇故事同留言。</p>
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
      <footer>
        <button id="clear" class="text-button" ${state.listening ? "disabled" : ""}>清除本次逐字稿</button>
        <span>逐字稿及摘要儲存在此瀏覽器；音訊不會由本應用保存。</span>
      </footer>
      <details class="trust"><summary>了解語音轉錄及 AI 摘要</summary><p>${escapeHtml(AGENT_SYSTEM_PROMPT)} 語音辨識可能由瀏覽器或作業系統服務處理；開始前請先取得訪談者及長者同意。</p></details>
    </div>`;

  document.querySelector("#listen").addEventListener("click", startListening);
  document.querySelector("#transcription-consent").addEventListener("change", (event) => {
    state.interviewConsent = event.target.checked;
    if (!state.interviewConsent && state.listening) stopListening();
  });
  document.querySelector("#switch-speaker")?.addEventListener("click", switchSpeaker);
  document.querySelector("#suggest-questions").addEventListener("click", generateSuggestions);
  document.querySelector("#end-interview").addEventListener("click", endInterview);
  document.querySelectorAll("[data-workflow-stage]").forEach((button) => button.addEventListener("click", () => {
    state.workflowStage = Number(button.dataset.workflowStage);
    render();
  }));
  document.querySelectorAll("[data-topic]").forEach((button) => button.addEventListener("click", () => selectTopic(button.dataset.topic)));
  document.querySelector("#change-topic")?.addEventListener("click", () => {
    state.topic = "";
    localStorage.removeItem("yiloi-topic-v1");
    render();
  });
  document.querySelector("#caregiver-view").addEventListener("click", () => { state.view = "caregiver"; render(); });
  document.querySelector("#focus-view").addEventListener("click", () => { state.focusMode = true; render(); });
  document.querySelector("#load-demo").addEventListener("click", () => {
    if (state.messages.length && !confirm("載入示範逐字稿會取代目前逐字稿及摘要，是否繼續？")) return;
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
    const text = input.value;
    input.value = "";
    handleTranscript(text);
  });
  document.querySelector("#clear").addEventListener("click", () => {
    if (confirm("確定清除本次逐字稿及未確認摘要？")) {
      state.messages = [];
      state.suggestions = [];
      state.interviewEnded = false;
      state.paused = false;
      if (!state.story?.confirmed) {
        state.story = null;
        saveStory();
      }
      state.status = "已清除本次逐字稿。";
      localStorage.removeItem(INTERVIEW_ENDED_KEY);
      save();
      render();
    }
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
    const text = draftStory();
    state.story = {
      title: state.photo?.title || "我記得嘅一段日子",
      text,
      confirmed: false,
      profileConfirmed: false,
      profile: {
        people: state.photo?.people || "待長者補充",
        place: state.photo?.title?.includes("深水埗") ? "深水埗" : "待長者補充",
        year: state.photo?.year || "待長者補充",
        quote: text.split("。")[0] || "待長者選出原句",
      },
      sharePermissions: { story: true, quote: false, photo: false, details: false },
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
    const profileChecks = [...document.querySelectorAll("[data-profile]")];
    if (profileChecks.some((checkbox) => !checkbox.checked)) {
      alert("請先逐項確認人物、地點、年份同原句。");
      return;
    }
    state.story.text = text;
    state.story.confirmed = true;
    state.story.profileConfirmed = true;
    state.story.profile = getStoryProfile();
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
  document.querySelector("#resume")?.addEventListener("click", () => {
    state.paused = false;
    state.status = "訪問者已確認可繼續記錄。";
    render();
  });
}

if (renderSharePage()) {
  // Read-only share view.
} else {
  render();
}
