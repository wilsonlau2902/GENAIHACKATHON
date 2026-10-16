(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))c(n);new MutationObserver(n=>{for(const d of n)if(d.type==="childList")for(const u of d.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&c(u)}).observe(document,{childList:!0,subtree:!0});function s(n){const d={};return n.integrity&&(d.integrity=n.integrity),n.referrerPolicy&&(d.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?d.credentials="include":n.crossOrigin==="anonymous"?d.credentials="omit":d.credentials="same-origin",d}function c(n){if(n.ep)return;n.ep=!0;const d=s(n);fetch(n.href,d)}})();const pe=`
你是「憶旅」的人與人長者訪談幕後助手，不會直接與長者對話，也不是醫療工具。
只按訪問者要求協助整理逐字稿或提供可選追問；所有建議由訪問者自行決定是否採用。
不可捏造人名、年份、地點、事件、感受或其他逐字稿沒有的事實。
清楚區分訪問者和長者說的內容；摘要以長者親自分享的內容為主。
不確定的細節要標示「待確認」，並提醒訪問者與長者核對。
如逐字稿提及自傷或即時危險，不要提供診斷或自動回覆長者；提醒訪問者按機構安全流程由真人跟進。
`.trim(),ue=["想死","自殺","唔想生存","活著冇意思"],W="yiloi-interview-transcript-v1",G="yiloi-interview-photo-v1",X="yiloi-interview-summary-v1",ee="yiloi-interview-share-v1",M="yiloi-interview-ended-v1",te="yiloi-interview-recording-v1",ge="SpeechRecognition"in window||"webkitSpeechRecognition"in window,me=window.SpeechRecognition||window.webkitSpeechRecognition,e={messages:JSON.parse(localStorage.getItem(W)||"[]"),photo:JSON.parse(localStorage.getItem(G)||"null"),story:JSON.parse(localStorage.getItem(X)||"null"),sharing:JSON.parse(localStorage.getItem(ee)||"null"),view:"caregiver",topic:localStorage.getItem("yiloi-topic-v1")||"",focusMode:!1,workflowStage:1,listening:!1,paused:!1,speaker:"staff",autoSpeaker:"staff",interviewConsent:!1,liveTranscript:"",status:"",suggestions:[],suggestionsLoading:!1,summaryLoading:!1,interviewEnded:localStorage.getItem(M)==="true",recording:JSON.parse(localStorage.getItem(te)||"null"),recordingPlaying:!1,recordingPosition:0,recordingTimer:null,startedAt:Date.now(),recognition:null},j=document.querySelector("#app");function l(t){return t.replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[o])}function ve(){return"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520">
      <rect width="800" height="520" fill="#d9c8a9"/>
      <rect x="70" y="70" width="660" height="330" rx="18" fill="#f4ead8"/>
      <circle cx="400" cy="210" r="92" fill="#c98762"/>
      <path d="M310 190c20-100 160-100 180 0-40-30-140-30-180 0Z" fill="#4d4038"/>
      <path d="M260 390c20-110 260-110 280 0Z" fill="#6f8f78"/>
      <text x="400" y="465" text-anchor="middle" font-family="sans-serif" font-size="26" fill="#4d4038">梅菜扣肉的回憶</text>
    </svg>`)}function F(){localStorage.setItem(te,JSON.stringify(e.recording))}function fe(){if(e.recording){if(e.recordingPlaying){clearInterval(e.recordingTimer),e.recordingPlaying=!1,i();return}e.recordingPlaying=!0,e.recordingTimer=setInterval(()=>{e.recordingPosition+=1,e.recordingPosition>=e.recording.duration&&(clearInterval(e.recordingTimer),e.recordingPlaying=!1,e.recordingPosition=0);const t=document.querySelector("#recording-position"),o=document.querySelector("#recording-time");document.querySelector(".recording-segment.active"),t&&(t.value=e.recordingPosition),o&&(o.textContent=D(e.recordingPosition)),document.querySelectorAll(".recording-segment").forEach(s=>{s.classList.toggle("active",Number(s.dataset.start)<=e.recordingPosition&&Number(s.dataset.end)>e.recordingPosition)}),e.recordingPlaying||i()},1e3)}}function D(t){return`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`}const he=window.PROXY_URL||void 0||"http://localhost:3001/api/chat";async function se(t){var d,u,p;const o=await fetch(he,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"deepseek-flash",messages:t})}),s=await o.text();if(!o.ok)throw new Error(`AI request failed (${o.status}): ${s.slice(0,300)}`);let c;try{c=JSON.parse(s)}catch{throw new Error("AI proxy returned an invalid response.")}const n=((p=(u=(d=c.choices)==null?void 0:d[0])==null?void 0:u.message)==null?void 0:p.content)||c.reply;if(typeof n!="string"||!n.trim())throw new Error("AI proxy returned no text.");return n.trim()}function oe(){return`<svg viewBox="0 0 19 19" role="img" aria-label="故事分享 QR Code">${["1111111001011111111","1000001011011000001","1011101000011011101","1011101011011011101","1011101001011011101","1000001010111000001","1111111010101111111","0000000011010000000","1101111010111011011","0010100101100100100","1110011110011110001","0101110001110001110","1111111001001011011","1000001011110010100","1011101000101110111","1011101011001001001","1011101000111011100","1000001011010010111","1111111010101110101"].map((o,s)=>[...o].map((c,n)=>c==="1"?`<rect x="${n}" y="${s}" width="1" height="1" />`:"").join("")).join("")}</svg>`}function re(){var s,c,n,d,u,p,y,b;if(!new URLSearchParams(window.location.search).has("story")||!((s=e.story)!=null&&s.confirmed))return!1;const t=JSON.parse(localStorage.getItem("yiloi-interview-family-response-v1")||"null"),o=e.story.title||"我的回憶";return j.innerHTML=`<div class="shell share-page">
    <header class="topbar"><div><span class="brand-mark">憶</span><span class="brand">憶旅</span></div><span class="step">長者已確認</span></header>
    <section class="share-hero"><p class="eyebrow">一段留給家人的回憶</p><h1>${l(o)}</h1><p>呢段故事由長者親自審閱及確認。你可以慢慢睇，亦可以分享一小段自己嘅故事。</p></section>
    <div class="chapter-progress"><span class="active">1</span><i></i><span class="${t?"active":""}">2</span><i></i><span class="${t?"active":""}">3</span></div>
    <p class="chapter-label">CHAPTER 1 · 公公的故事</p>
    ${(c=e.photo)!=null&&c.image?`<img class="shared-photo" src="${e.photo.image}" alt="${l(e.photo.title||"回憶相片")}" />`:""}
    <article class="shared-story"><span class="ai-label">長者已確認</span><p>${l(e.story.text)}</p></article>
    <section class="family-invite">
      <p class="eyebrow">輪到你了</p><h2>你還記得自己第一次工作嗎？</h2>
      <p>可以錄一段語音、寫幾句，或者跳過，繼續睇故事。你唔需要註冊帳戶。</p>
      ${t?`<div class="response-saved"><strong>✓ 你已分享</strong><p>${l(t.text)}</p></div>
        <section class="connection-card"><span class="ai-label">兩代人的第一次工作</span><h3>不同年代，相似的第一次</h3><p>公公 18 歲做裁縫，家人分享了自己的第一份工作。呢兩段經歷可以成為下一次見面時嘅話題。</p></section>`:`<div class="response-options">
          <button id="family-voice" class="response-option"><span>🎙</span><strong>錄一段語音分享</strong><small>保留你自己嘅語氣</small></button>
          <button id="family-text" class="response-option"><span>✍</span><strong>寫幾句就好</strong><small>分享一小段回憶</small></button>
          <button id="family-skip" class="response-option muted"><span>→</span><strong>先跳過</strong><small>繼續睇故事</small></button>
        </div>
        <div id="family-composer" class="family-composer" hidden><textarea id="family-note" rows="4" placeholder="例如：我第一份暑期工係喺咖啡店做，每日都好緊張。"></textarea><div><button id="save-family-note" class="primary">分享呢段回憶</button><button id="cancel-family-note" class="text-button">稍後先</button></div></div>`}
    </section>
    <section class="next-chapter"><p class="eyebrow">下一章</p><h2>屋企人返工返學後，一齊食飯</h2><p>繼續閱讀長者其他回憶，慢慢拼返一個屬於你哋嘅故事。</p><button id="continue-story" class="secondary">繼續睇故事（Demo）</button></section>
    <footer><span>憶旅・由長者決定分享內容</span><a href="${window.location.pathname}">返回我的憶旅</a></footer>
  </div>`,(n=document.querySelector("#family-text"))==null||n.addEventListener("click",()=>{document.querySelector("#family-composer").hidden=!1}),(d=document.querySelector("#family-voice"))==null||d.addEventListener("click",()=>{document.querySelector("#family-composer").hidden=!1,document.querySelector("#family-note").placeholder="語音 Demo：請先用文字輸入你想分享嘅內容。",document.querySelector("#family-note").focus()}),(u=document.querySelector("#family-skip"))==null||u.addEventListener("click",()=>{document.querySelector(".family-invite").innerHTML='<p class="eyebrow">繼續閱讀</p><h2>你可以之後先分享</h2><p>唔緊要，先睇長者嘅下一段故事。下次返嚟，仍然可以分享你嘅回憶。</p>'}),(p=document.querySelector("#save-family-note"))==null||p.addEventListener("click",()=>{const f=document.querySelector("#family-note").value.trim();f&&(localStorage.setItem("yiloi-interview-family-response-v1",JSON.stringify({text:f,at:new Date().toISOString()})),re())}),(y=document.querySelector("#cancel-family-note"))==null||y.addEventListener("click",()=>{document.querySelector("#family-composer").hidden=!0}),(b=document.querySelector("#continue-story"))==null||b.addEventListener("click",f=>{f.currentTarget.textContent="下一章已打開（Demo）",f.currentTarget.disabled=!0}),!0}function U(){var t;return((t=e.sharing)==null?void 0:t.url)||window.location.href}function Z(){var t;return`同你分享一段回憶：${((t=e.story)==null?void 0:t.title)||"我的回憶"}`}const H={whatsapp:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .4 5.2.4 11.7c0 2.1.6 4.1 1.6 5.9L.3 24l6.6-1.7a11.7 11.7 0 0 0 5.2 1.2h.1c6.4 0 11.7-5.2 11.7-11.7 0-3.1-1.2-6.1-3.4-8.3Zm-8.3 18c-1.6 0-3.2-.4-4.6-1.2l-.3-.2-3.9 1 1-3.8-.2-.4a9.7 9.7 0 1 1 8 4.6Zm5.3-7.3c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-1.7-.8-2.8-1.5-3.9-3.4-.3-.5.3-.5.8-1.6.1-.2.1-.4 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.2 4.5 1.9.8 2.6.9 3.5.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z"/></svg>',facebook:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 24v-11h3.7l.6-4.3h-4.3V6c0-1.2.3-2.1 2.2-2.1h2.3V.1C17.6.1 16.4 0 15.1 0c-3.4 0-5.7 2.1-5.7 5.9v2.8H5.7V13h3.7v11h4.1Z"/></svg>',wechat:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.8 4C4 4 .2 7.2.2 11.2c0 2.3 1.4 4.4 3.5 5.7l-.8 2.8 3.2-1.6c.8.2 1.7.3 2.6.3h.5c-.2-.6-.3-1.2-.3-1.9 0-3.6 3.4-6.5 7.7-6.5.5 0 1 0 1.4.1C17.4 6.5 13.6 4 8.8 4Zm-2.9 7.8c-.7 0-1.2-.5-1.2-1.1s.5-1.1 1.2-1.1 1.2.5 1.2 1.1-.5 1.1-1.2 1.1Zm5.7 0c-.7 0-1.2-.5-1.2-1.1s.5-1.1 1.2-1.1 1.2.5 1.2 1.1-.5 1.1-1.2 1.1Zm3.5 0c-4.1 0-7.4 2.6-7.4 5.9 0 3.2 3.3 5.8 7.4 5.8.8 0 1.6-.1 2.3-.3l2.8 1.4-.7-2.5c1.8-1.1 3-2.7 3-4.5 0-3.2-3.3-5.8-7.4-5.8Zm-2.4 5.2c-.6 0-1-.4-1-.9s.4-.9 1-.9 1 .4 1 .9-.4.9-1 .9Zm4.7 0c-.6 0-1-.4-1-.9s.4-.9 1-.9 1 .4 1 .9-.4.9-1 .9Z"/></svg>'};function _(){localStorage.setItem(W,JSON.stringify(e.messages))}function N(){localStorage.setItem(G,JSON.stringify(e.photo))}function w(){localStorage.setItem(X,JSON.stringify(e.story))}function J(){localStorage.setItem(ee,JSON.stringify(e.sharing))}function ye(){var t,o;!((t=e.sharing)!=null&&t.url)&&((o=e.story)!=null&&o.confirmed)&&e.story.profileConfirmed!==!1&&(e.sharing={enabled:!0,url:`${window.location.origin}${window.location.pathname}?story=story-${Date.now()}`},J())}const Y=[["childhood","細個嘅生活","街坊、玩伴，同屋企嘅日子","☀"],["family","屋企人","一餐飯、一句說話，一個重要嘅人","♡"],["work","第一份工","人生第一步，做過最難忘嘅工作","▣"],["festival","節日回憶","過年、團年飯，同最熱鬧嘅時光","✦"],["proud","最自豪嘅事","你最想留俾家人知道嘅故事","★"],["message","留俾家人的話","想對屋企人講，但一直未講出口嘅話","✉"]];function be(t){e.topic=t,localStorage.setItem("yiloi-topic-v1",t),i()}function V(){var t,o,s,c,n,d,u;return((t=e.story)==null?void 0:t.profile)||{people:((o=e.photo)==null?void 0:o.people)||"婆婆、屋企人",place:(c=(s=e.photo)==null?void 0:s.title)!=null&&c.includes("深水埗")?"深水埗":"待長者補充",year:((n=e.photo)==null?void 0:n.year)||"待長者補充",quote:((u=(d=e.story)==null?void 0:d.text)==null?void 0:u.split("。")[0])||"待長者選出原句"}}function ne(){e.messages=[{role:"staff",text:"你細個住喺邊度？有冇一段特別記得嘅日常生活？",at:new Date().toISOString()},{role:"elderly",text:"我細個住喺深水埗，最鍾意睇婆婆煮飯。",at:new Date().toISOString()},{role:"staff",text:"婆婆最常煮咩餸？",at:new Date().toISOString()},{role:"elderly",text:"佢最叻煮梅菜扣肉，屋企人返工返學都會一齊食。",at:new Date().toISOString()}],e.photo={image:ve(),title:"婆婆煮梅菜扣肉的廚房",year:"1968",people:"婆婆、屋企人",caption:"婆婆最叻煮梅菜扣肉，屋企人返工返學都會一齊食。",confirmed:!0},e.story={title:"婆婆煮梅菜扣肉的回憶",text:"阿梅婆婆記得，細個住喺深水埗，最期待婆婆煮梅菜扣肉。屋企人返工返學後一齊食飯，係一家人最溫暖嘅時光。",confirmed:!0,profileConfirmed:!0,profile:{people:"阿梅婆婆、婆婆、屋企人",place:"深水埗",year:"1968",quote:"最鍾意睇婆婆煮飯"},sharePermissions:{story:!0,quote:!0,photo:!0,details:!0}},e.sharing=null,e.suggestions=[],e.workflowStage=3,e.interviewEnded=!1,e.paused=!1,e.status="已載入示範逐字稿。呢啲係示範內容，唔係實際訪談。",localStorage.removeItem(M),_(),w(),i()}function we(t,o){var c;const s={role:t,text:o.trim(),at:new Date().toISOString()};if(e.messages.push(s),e.recording){const n=e.recording.duration;e.recording.segments.push({id:`${Date.now()}-${e.recording.segments.length}`,role:t,text:s.text,start:n,end:n+8,corrected:!1}),e.recording.duration+=8,F()}_(),t==="elderly"&&$e(s.text)?(e.paused=!0,e.listening=!1,(c=e.recognition)==null||c.stop(),e.status="長者可能需要即時關心。請訪問者暫停訪談，陪伴長者並按機構安全流程處理。"):e.status="逐字稿已儲存於此瀏覽器。",i()}function $e(t){return ue.some(o=>t.includes(o))}function ie(t,o=e.speaker){const s=t.trim();!s||e.paused||e.interviewEnded||we(o,s)}function ae(){var t,o;return(o=(t=e.recording)==null?void 0:t.segments)!=null&&o.length?e.recording.segments.map(({role:s,text:c})=>`${s==="staff"?"訪問者":"長者"}：${c}`).join(`
`):e.messages.map(({role:s,text:c})=>`${s==="staff"?"訪問者":"長者"}：${c}`).join(`
`)}async function ce(){if(e.messages.some(t=>t.role==="elderly")){if(!e.interviewConsent){e.status="請先取得雙方同意，才可將逐字稿傳送至 AI 生成建議。",i();return}e.suggestionsLoading=!0,e.status="AI 正為訪問者準備可選追問…",i();try{const t=await se([{role:"system",content:"你是訪談工作人員的幕後助手，不會直接與長者對話。根據逐字稿，用香港繁體中文提供最多 3 條簡短、開放式、溫和的可選追問。只輸出問題清單，不要推測或補充逐字稿沒有的事實。"},{role:"user",content:`訪談逐字稿：
${ae()}`}]);e.suggestions=t.split(`
`).map(o=>o.replace(/^\s*[-*•\d.、)]+\s*/,"").trim()).filter(Boolean).slice(0,3),e.status="追問建議已準備好；由訪問者決定是否使用。"}catch(t){console.error("Could not generate interview suggestions",t),e.status=`未能取得 AI 追問建議：${t.message}`}finally{e.suggestionsLoading=!1,i()}}}async function K(){var t,o,s,c;if(e.listening&&await S(),e.paused){e.status="請先由真人訪問者按安全流程跟進，再考慮整理摘要。",i();return}if(!e.messages.some(n=>n.role==="elderly")){e.status="請先記錄長者分享的內容，再生成摘要。",i();return}if(!e.interviewConsent){e.status="請先取得雙方同意，才可將逐字稿傳送至 AI 生成摘要。",i();return}e.summaryLoading=!0,e.status="AI 正在整理逐字稿；請訪問者核對摘要。",i();try{const n=await se([{role:"system",content:"你是訪談工作人員的幕後摘要助手，不會直接回覆長者。請以香港繁體中文忠實整理長者說過的內容，簡潔涵蓋重要人物、地點、事件、感受和待確認細節。不可捏造或把訪問者說的內容當成長者經歷。只輸出摘要草稿，並提醒工作人員及長者核對。"},{role:"user",content:`請根據以下人與人訪談逐字稿整理摘要：
${ae()}`}]);e.story={title:"訪談摘要（待核對）",text:n,confirmed:!1,profileConfirmed:!1,profile:{people:((t=e.photo)==null?void 0:t.people)||"待長者補充",place:(s=(o=e.photo)==null?void 0:o.title)!=null&&s.includes("深水埗")?"深水埗":"待長者補充",year:((c=e.photo)==null?void 0:c.year)||"待長者補充",quote:n.split("。")[0]||"待長者選出原句"},sharePermissions:{story:!0,quote:!1,photo:!1,details:!1}},w(),e.interviewEnded=!0,localStorage.setItem(M,"true"),e.status="摘要已生成並儲存。請與長者一起核對後再確認或分享。",e.focusMode=!1,e.workflowStage=3}catch(n){console.error("Could not summarize interview",n),e.status=`未能生成摘要：${n.message}`}finally{e.summaryLoading=!1,i()}}function B(){if(!ge){e.status="此瀏覽器不支援語音轉錄；請使用下方文字欄記錄對話。",i();return}if(!e.interviewConsent){e.status="請先取得訪問者及長者同意，並勾選訪談處理同意。",i();return}if(e.listening){S();return}e.autoSpeaker="staff",e.recording={demo:!0,duration:0,createdAt:new Date().toISOString(),segments:[]},e.recordingPosition=0,F(),e.listening=!0,e.status="AI 正在持續轉錄，並自動辨識訪問者與長者的說話段落。",le(),i()}function le(){e.recognition=new me,e.recognition.lang="zh-HK",e.recognition.interimResults=!0,e.recognition.continuous=!0;const t=e.autoSpeaker;e.liveTranscript="";const o=e.recognition;e.status=`AI 正在辨識${t==="staff"?"訪問者":"長者"}的說話內容。`,o.onstart=()=>{i()},o.onresult=s=>{e.liveTranscript=Array.from(s.results).map(n=>n[0].transcript).join(" ").trim();const c=document.querySelector("#live-preview");c&&(c.textContent=e.liveTranscript)},o.onerror=s=>{e.listening=!1,e.status=`語音轉錄失敗（${s.error}）。可改用文字輸入。`,i()},o.onend=()=>{const s=e.liveTranscript;e.liveTranscript="",s&&(ie(s,t),e.autoSpeaker=t==="staff"?"elderly":"staff"),e.listening&&!e.paused?(le(),i()):!s&&!e.paused&&(e.status="未辨識到語音；可以重試或改用文字輸入。",i())};try{o.start()}catch(s){e.listening=!1,e.status=`無法啟動語音轉錄：${s.message}`,i()}}function Se(){var t;e.speaker=e.speaker==="staff"?"elderly":"staff",e.listening?(e.status=`正在切換至${e.speaker==="staff"?"訪問者":"長者"}；錄音會持續。`,(t=e.recognition)==null||t.stop()):e.status=`已切換至${e.speaker==="staff"?"訪問者":"長者"}。`,i()}function S(){const t=e.recognition;return!t||!e.listening?Promise.resolve():(e.listening=!1,new Promise(o=>{const s=t.onend;t.onend=c=>{s==null||s.call(t,c),o()},t.stop()}))}function de(){var c,n,d,u;const t=e.messages[e.messages.length-1],o=p=>p==="staff"?"訪問者":"長者",s=((c=e.story)==null?void 0:c.confirmed)&&e.story.profileConfirmed!==!1;j.innerHTML=`<div class="focus-shell">
    <header class="focus-topbar">
      <button id="exit-focus" class="focus-back">← 返回照顧者工作台</button>
      <span class="brand"><span class="brand-mark">憶</span>憶旅</span>
      <span class="focus-time">長者模式</span>
    </header>
    <main class="focus-main">
      <p class="eyebrow">${e.topic?`訪談主題：${l(((n=Y.find(([p])=>p===e.topic))==null?void 0:n[1])||"")}`:"訪問者與長者面對面對話"}</p>
      <div class="focus-orb ${e.listening?"is-listening":""}"><span>${e.listening?"■":"🎙"}</span></div>
      <h1>${e.listening?"AI 正在持續轉錄…":"繼續你們的對話"}</h1>
      <p class="focus-hint">AI 只會協助轉錄和整理摘要，不會代替訪問者發問或回覆。</p>
      <label class="transcription-consent"><input id="focus-transcription-consent" type="checkbox" ${e.interviewConsent?"checked":""} /> 訪問者及長者同意使用瀏覽器語音轉錄，並將逐字稿傳送至設定的 AI 服務生成建議及摘要；本應用不保存音訊</label>
      ${t?`<div class="focus-transcript"><span>${o(t.role)}・最近記錄</span><p>「${l(t.text)}」</p></div>`:""}
      ${e.listening?`<div class="live-preview" id="live-preview">${l(e.liveTranscript||"聆聽中…")}</div>`:""}
      <button id="focus-listen" class="focus-mic ${e.listening?"active":""}" ${e.interviewEnded||e.paused?"disabled":""}><span>${e.listening?"■":"🎙"}</span><strong>${e.listening?"停止錄音":"開始錄音"}</strong></button>
      <div class="focus-actions"><button id="focus-rest" class="secondary">我想休息</button><button id="focus-end" class="primary" ${!e.messages.some(p=>p.role==="elderly")||e.summaryLoading||e.interviewEnded?"disabled":""}>${e.summaryLoading?"正在生成摘要…":e.interviewEnded?"訪談已結束":"結束訪談並生成摘要"}</button></div>
      ${s?`<section class="focus-sharing"><span class="ai-label">長者已確認</span><h2>你的故事準備好喇</h2><p>如果你願意，可以分享俾屋企人睇。</p><button id="focus-share" class="primary">${(d=e.sharing)!=null&&d.enabled?"分享連結已準備好":"分享給家人"}</button><small>你可以隨時改變主意。</small></section>`:""}
      ${e.status?`<p class="status-message" role="status">${l(e.status)}</p>`:""}
    </main>
  </div>`,document.querySelector("#exit-focus").addEventListener("click",()=>{e.focusMode=!1,i()}),document.querySelector("#focus-listen").addEventListener("click",B),document.querySelector("#focus-transcription-consent").addEventListener("change",p=>{e.interviewConsent=p.target.checked,!e.interviewConsent&&e.listening&&S()}),document.querySelector("#focus-end").addEventListener("click",K),document.querySelector("#focus-rest").addEventListener("click",()=>alert("好，我哋休息一陣先。準備好再撳咪高風。")),(u=document.querySelector("#focus-share"))==null||u.addEventListener("click",()=>{var p;(p=e.sharing)!=null&&p.enabled||(e.sharing={enabled:!0,url:`${window.location.origin}${window.location.pathname}?story=demo-${Date.now()}`},J()),de()})}function ke(){const t=[["1","活動前","真人準備傾偈","背景卡、建議題目、避開話題"],["2","活動中","真人陪伴對話","AI 記錄、標記重點，不打斷交流"],["3","活動後","一起確認及延續","故事卡、家人回應、下一次話題"]],o={1:`<div class="workflow-content">
      <div class="workflow-icon">▤</div><div><h3>俾訪問者一眼睇晒</h3><p>真人先了解長者背景，再決定點樣開始傾。AI 只提供準備資料，唔會代替訪問者發問。</p>
      <div class="prep-cards"><span>長者背景卡</span><span>今日 3 條建議題目</span><span>避開話題</span></div></div>
    </div>`,2:`<div class="workflow-content">
      <div class="workflow-icon live">●</div><div><h3>訪問者與長者真人對話</h3><p>訪問者主導提問及聆聽。AI 只按選定的說話者轉錄對話，並可提供可選追問，不會直接回覆長者。</p>
      <div class="tool-note"><strong>AI 幕後支援</strong><span>即時逐字稿</span><span>可選追問</span><span>不保存音訊</span></div></div>
    </div>`,3:`<div class="workflow-content">
      <div class="workflow-icon">♡</div><div><h3>故事係邀請，不係終點</h3><p>長者先確認內容及分享權限。之後家人可以閱讀、回應，為下一次真人見面帶來新話題。</p>
      <div class="prep-cards"><span>長者確認故事卡</span><span>家人語音／文字回應</span><span>下一次續談提示</span></div></div>
    </div>`};return`<section class="workflow-section">
    <div class="workflow-heading"><div><p class="eyebrow">人係中心・AI 係工具</p><h2>一次互動，三個階段</h2></div><span class="human-badge">真人主導</span></div>
    <div class="workflow-steps">${t.map(([s,c,n])=>`<button class="workflow-step ${e.workflowStage===Number(s)?"active":""}" data-workflow-stage="${s}"><b>${s}</b><strong>${c}</strong><small>${n}</small></button>`).join("")}</div>
    ${o[e.workflowStage]}
  </section>`}function qe(){var c,n,d,u,p,y,b,f,k,q,E,x,L,I,A,C,P;ye();const t=e.workflowStage,o=((c=e.story)==null?void 0:c.confirmed)&&e.story.profileConfirmed!==!1,s={1:`<div class="caregiver-stage-grid">
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
    </div>`,2:`<section class="dashboard-wide-card interview-panel">
      <div class="section-heading"><div><p class="eyebrow">訪談中</p><h2>對話逐字稿</h2></div><span class="step">${e.messages.length} 段記錄</span></div>
      <p class="interview-instructions">開始前先取得訪問者及長者同意。開始錄音後，AI 會持續轉錄，並自動標記訪問者與長者的說話段落。</p>
      <label class="transcription-consent"><input id="transcription-consent" type="checkbox" ${e.interviewConsent?"checked":""} /> 訪問者及長者同意語音轉錄及將逐字稿傳送至 AI 服務</label>
      <section class="recording-action-card">
        <span class="recording-action-icon">${e.listening?"■":"🎙"}</span>
        <h3>${e.listening?"正在錄音":"準備好就開始訪談"}</h3>
        <p>${e.listening?"AI 正在持續整理對話內容":"按一下，開始記錄訪問者和長者的對話"}</p>
        <button id="fake-record" class="primary recording-start-button" aria-label="${e.listening?"停止錄音":"開始錄音"}">${e.listening?"停止錄音":"開始錄音"}</button>
      </section>
      <section class="conversation" aria-live="polite">${e.messages.length?e.messages.map(r=>`<article class="message ${r.role}"><span class="role">${r.role==="elderly"?"長者":"訪問者"}</span><p>${l(r.text)}</p></article>`).join(""):""}</section>
      ${e.listening?`<div class="live-preview"><strong>AI 即時辨識中・${e.autoSpeaker==="staff"?"訪問者":"長者"}</strong><p id="live-preview">${l(e.liveTranscript||"聆聽中…")}</p></div>`:""}
      ${e.recording?`<section class="recording-review"><div class="recording-heading"><div><p class="eyebrow">錄音回顧</p><strong>可以播放並核對逐字稿</strong></div><div class="recording-controls"><button id="play-recording" class="secondary">${e.recordingPlaying?"Ⅱ 暫停播放":"▶ 播放錄音"}</button><span id="recording-time">${D(e.recordingPosition)} / ${D(e.recording.duration)}</span></div></div><div class="fake-waveform" aria-label="錄音波形">${Array.from({length:56},(r,g)=>`<i style="height:${12+g*17%28}px"></i>`).join("")}<b class="wave-playhead" style="left:${e.recording.duration?e.recordingPosition/e.recording.duration*100:0}%"></b></div><input id="recording-position" class="recording-range" type="range" min="0" max="${Math.max(e.recording.duration,1)}" value="${e.recordingPosition}" aria-label="錄音播放位置" /><div class="recording-segments">${e.recording.segments.map(r=>`<article class="recording-segment ${e.recordingPosition>=r.start&&e.recordingPosition<r.end?"active":""}" data-start="${r.start}" data-end="${r.end}"><span>${D(r.start)} · ${r.role==="elderly"?"長者":"訪問者"}</span><textarea data-recording-segment="${r.id}" rows="2">${l(r.text)}</textarea><button class="text-button save-segment" data-recording-id="${r.id}">${r.corrected?"✓ 已修正":"保存修正"}</button></article>`).join("")}</div></section>`:""}
      ${e.status?`<p class="status-message" role="status">${l(e.status)}</p>`:""}
    </section>
    <section class="dashboard-wide-card followup-section"><div class="section-heading"><div><p class="eyebrow">只供工作人員參考</p><h2>可選追問建議</h2></div><button id="suggest-questions" class="secondary" ${!e.messages.some(r=>r.role==="elderly")||e.suggestionsLoading||e.interviewEnded?"disabled":""}>${e.suggestionsLoading?"準備中…":"生成追問建議"}</button></div><p class="interview-instructions">由訪問者自行決定是否採用；AI 不會把建議直接說給長者聽。</p>${e.suggestions.length?`<ul class="suggestion-list">${e.suggestions.map(r=>`<li>${l(r)}</li>`).join("")}</ul>`:""}</section>`,3:`<section class="dashboard-wide-card story-section"><div class="section-heading"><div><p class="eyebrow">訪談後</p><h2>AI 訪談摘要</h2></div><button id="end-interview" class="primary" ${!e.messages.some(r=>r.role==="elderly")||e.summaryLoading||e.interviewEnded?"disabled":""}>${e.summaryLoading?"正在生成摘要…":e.interviewEnded?"訪談已結束":"結束訪談並生成摘要"}</button></div>${e.story?`<article class="story-review"><span class="ai-label">AI 整理・${o?"已確認":"尚未確認"}</span><h3>${l(e.story.title||"訪談摘要")}</h3><p class="review-help">摘要會先供工作人員和長者核對，確認後才可以分享。</p><textarea id="story-editor" rows="6" aria-label="故事內容">${l(e.story.text)}</textarea><div class="review-actions">${o?'<div class="confirmed">✓ 已加入故事書</div>':'<button id="confirm-story-text" class="primary">確認 Story Profile 及故事</button>'}</div></article>`:'<div class="story-empty"><p>結束訪談後，AI 會整理長者說過的內容；摘要會先供工作人員和長者核對。</p></div>'}</section>
    <section class="dashboard-wide-card share-section"><div class="section-heading"><div><p class="eyebrow">分享給家人</p><h2>故事分享頁</h2></div><span class="step">私隱由你決定</span></div>${o?`<p class="share-help">故事已確認，分享頁已準備好。照片不是必要條件，你可以直接分享文字故事。</p><div class="share-result"><div class="qr">${oe()}</div><div><strong>私人分享頁已準備好</strong><p class="share-url">${l(e.sharing.url)}</p><div class="share-actions"><button id="share-wechat" class="primary">分享到微信</button><button id="copy-share" class="secondary">複製連結</button><button id="open-share" class="text-button">預覽分享頁</button></div></div></div>`:'<p class="share-help">先完成訪談摘要，並由工作人員和長者確認故事內容；確認後就可以分享，不需要照片。</p>'}</section>
    <section class="dashboard-wide-card memory-section"><div class="section-heading"><div><p class="eyebrow">保存一段回憶</p><h2>加一張舊相</h2></div><span class="step">下一步</span></div>${e.photo?`<article class="story-card"><img src="${e.photo.image}" alt="${l(e.photo.title||"回憶相片")}" /><div class="story-card-content"><h3>${l(e.photo.title||"未命名回憶")}</h3><p>${l(e.photo.caption||"你可以補充呢張相背後嘅故事。")}</p></div></article>`:'<form id="photo-form" class="photo-form"><label class="upload-box" for="photo-input"><span class="upload-icon">＋</span><strong>上載一張舊相</strong><small>可以從手機相簿選擇，圖片只保存在此瀏覽器</small></label><input id="photo-input" type="file" accept="image/*" /><div class="photo-fields"><input id="photo-title" placeholder="相片標題" /><input id="photo-year" inputmode="numeric" placeholder="大約年份（可留空）" /><input id="photo-people" placeholder="相中人物（可留空）" /><textarea id="photo-caption" rows="3" placeholder="想記低嘅故事或長者原句（可留空）"></textarea></div><button class="primary" type="submit">生成故事卡</button></form>'}</section>`};j.innerHTML=`<div class="shell dashboard">
    <header class="topbar">
      <div class="brand-lockup"><span class="brand-mark">憶</span><div><span class="brand">憶旅・照顧者工作台</span><small>真人陪伴・AI 幕後支援</small></div></div>
      <div class="caregiver-top-actions"><span class="resident-chip">阿梅婆婆（82 歲）</span><button id="back-to-senior" class="secondary">切換長者全屏</button><button class="size-button">標準</button><button class="size-button">大字</button><button id="load-demo" class="demo-button">▶ 示範數據</button></div>
    </header>
    <nav class="stage-tabs">${[["1","活動前・準備"],["2","活動中・傾談"],["3","活動後・手帳"]].map(([r,g])=>`<button class="${t===Number(r)?"active":""}" data-caregiver-stage="${r}"><b>${r}</b>${g}</button>`).join("")}</nav>
    ${s[t]}
    <p class="dashboard-note">Demo 介面：真實版本會根據長者同意及機構權限顯示資料。</p>
  </div>`,document.querySelector("#back-to-senior").addEventListener("click",()=>{e.focusMode=!0,i()}),document.querySelectorAll("[data-caregiver-stage]").forEach(r=>r.addEventListener("click",()=>{e.workflowStage=Number(r.dataset.caregiverStage),i()})),(n=document.querySelector("#start-session"))==null||n.addEventListener("click",()=>{e.workflowStage=2,i()}),(d=document.querySelector("#transcription-consent"))==null||d.addEventListener("change",r=>{e.interviewConsent=r.target.checked,!e.interviewConsent&&e.listening&&S()}),(u=document.querySelector("#suggest-questions"))==null||u.addEventListener("click",ce),(p=document.querySelector("#fake-record"))==null||p.addEventListener("click",()=>{e.listening?S():B()}),(y=document.querySelector("#play-recording"))==null||y.addEventListener("click",fe),(b=document.querySelector("#recording-position"))==null||b.addEventListener("input",r=>{e.recordingPosition=Number(r.target.value),i()}),document.querySelectorAll(".save-segment").forEach(r=>r.addEventListener("click",()=>{var R;const g=(R=e.recording)==null?void 0:R.segments.find($=>$.id===r.dataset.recordingId),h=document.querySelector(`[data-recording-segment="${r.dataset.recordingId}"]`);if(!g||!h)return;g.text=h.value.trim(),g.corrected=!0;const T=e.recording.segments.findIndex($=>$.id===g.id);e.messages[T]&&(e.messages[T].text=g.text),_(),F(),e.status="已保存人工修正，之後摘要會以修正後內容為準。",i()})),(f=document.querySelector("#end-interview"))==null||f.addEventListener("click",K),(k=document.querySelector("#save-story-draft"))==null||k.addEventListener("click",()=>{e.story.text=document.querySelector("#story-editor").value.trim(),e.story.confirmed=!1,w(),i()}),(q=document.querySelector("#confirm-story-text"))==null||q.addEventListener("click",()=>{const r=document.querySelector("#story-editor").value.trim();if(!r){alert("請先寫一點故事內容。");return}e.story.text=r,e.story.confirmed=!0,e.story.profileConfirmed=!0,w(),i()}),(E=document.querySelector("#sharing-consent"))==null||E.addEventListener("change",r=>{document.querySelector("#create-share").disabled=!r.target.checked}),(x=document.querySelector("#create-share"))==null||x.addEventListener("click",()=>{e.sharing={enabled:!0,url:`${window.location.origin}${window.location.pathname}?story=demo-${Date.now()}`},J(),i()}),(L=document.querySelector("#open-share"))==null||L.addEventListener("click",()=>window.open(e.sharing.url,"_blank","noopener,noreferrer")),(I=document.querySelector("#photo-form"))==null||I.addEventListener("submit",r=>{r.preventDefault();const g=document.querySelector("#photo-input").files[0];if(!g){alert("請先選擇一張相片。");return}const h=new FileReader;h.onload=()=>{e.photo={image:h.result,title:document.querySelector("#photo-title").value.trim(),year:document.querySelector("#photo-year").value.trim(),people:document.querySelector("#photo-people").value.trim(),caption:document.querySelector("#photo-caption").value.trim(),confirmed:!1},N(),i()},h.readAsDataURL(g)}),(A=document.querySelector("#load-demo"))==null||A.addEventListener("click",()=>ne()),document.querySelectorAll("[data-caregiver-topic]").forEach(r=>r.addEventListener("click",()=>{document.querySelectorAll("[data-caregiver-topic]").forEach(g=>g.classList.remove("selected")),r.classList.add("selected")})),(C=document.querySelector("#dashboard-preview"))==null||C.addEventListener("click",()=>{var r;e.view="interview",i(),(r=document.querySelector(".story-section"))==null||r.scrollIntoView({behavior:"smooth"})}),(P=document.querySelector("#dashboard-message"))==null||P.addEventListener("click",()=>alert("家人留言功能（Demo）"))}function i(){var n,d,u,p,y,b,f,k,q,E,x,L,I,A,C,P,r,g,h,T,R,$;if(e.focusMode){de();return}if(e.view==="caregiver"){qe();return}const t=Math.floor((Date.now()-e.startedAt)/6e4),o=Y.find(([a])=>a===e.topic),s=((n=e.story)==null?void 0:n.confirmed)&&e.story.profileConfirmed!==!1,c=e.messages.length?e.messages.map(a=>`<article class="message ${a.role}">
        <span class="role">${a.role==="staff"?"訪問者":"長者"}</span>
        <p>${l(a.text)}</p>
      </article>`).join(""):'<div class="empty"><span class="wave">☊</span><p>訪問者與長者開始對話後，逐字稿會顯示喺呢度。</p></div>';j.innerHTML=`
    <div class="shell">
      <header class="topbar">
        <div><span class="brand-mark">憶</span><span class="brand">憶旅</span></div>
        <div class="top-actions">
          <button id="load-demo" class="demo-button">▶ Demo 示範</button>
          <button id="caregiver-view" class="dashboard-button">訪問者工作台</button>
          <button id="focus-view" class="focus-button">全屏傾偈</button>
          <span class="timer">本節 ${t} / 45 分鐘</span>
        </div>
      </header>
      <section class="intro">
        <p class="eyebrow">人與人對話・AI 幕後記錄</p>
        <h1>${o?`訪談主題：${o[1]}`:"長者回憶訪談"}</h1>
        <p>訪問者與長者面對面傾談。AI 只負責轉錄、提供可選追問及整理摘要，不會代替訪問者同長者對話。</p>
      </section>
      ${ke()}
      <section class="topic-section">
        <div class="section-heading">
          <div><p class="eyebrow">訪問前準備</p><h2>選擇訪談方向</h2></div>
          ${o?'<button id="change-topic" class="text-button">更換主題</button>':""}
        </div>
        <div class="topic-grid">
          ${Y.map(([a,m,v,O])=>`<button class="topic-card ${a===e.topic?"selected":""}" data-topic="${a}">
            <span class="topic-icon">${O}</span><strong>${m}</strong><small>${v}</small>
          </button>`).join("")}
        </div>
      </section>
      ${e.paused?`<section class="safety-alert" role="alert">
        <strong>請訪問者先停一停</strong>
        <p>逐字稿出現可能需要關心的內容。請由真人訪問者陪伴長者，並按機構安全流程處理；AI 不會自動回覆長者。</p>
        <button id="resume" class="secondary">訪問者確認後繼續記錄</button>
      </section>`:""}
      <section class="interview-panel" aria-labelledby="transcript-heading">
        <div class="section-heading">
          <div><p class="eyebrow">訪談中</p><h2 id="transcript-heading">對話逐字稿</h2></div>
          <span class="step">${e.messages.length} 段記錄</span>
        </div>
        <p class="interview-instructions">開始前先取得訪問者及長者同意。開始錄音後，AI 會持續轉錄並自動標記說話者。</p>
        <label class="transcription-consent"><input id="transcription-consent" type="checkbox" ${e.interviewConsent?"checked":""} /> 訪問者及長者同意語音轉錄及將逐字稿傳送至 AI 服務</label>
        <section class="conversation" aria-live="polite">${c}</section>
        ${e.listening?`<div class="live-preview"><strong>AI 即時辨識中・${e.autoSpeaker==="staff"?"訪問者":"長者"}</strong><p id="live-preview">${l(e.liveTranscript||"聆聽中…")}</p></div>`:""}
        <button class="mic ${e.listening?"active":""}" type="button" id="listen" aria-label="${e.listening?"停止錄音":"開始錄音"}" ${e.paused||e.interviewEnded?"disabled":""}><span>${e.listening?"■":"🎙"}</span><small>${e.listening?"停止錄音":"開始錄音"}</small></button>
        ${e.status?`<p class="status-message" role="status">${l(e.status)}</p>`:""}
      </section>
      <section class="followup-section">
        <div class="section-heading">
          <div><p class="eyebrow">只供工作人員參考</p><h2>可選追問建議</h2></div>
          <button id="suggest-questions" class="secondary" ${!e.messages.some(a=>a.role==="elderly")||e.suggestionsLoading||e.interviewEnded?"disabled":""}>${e.suggestionsLoading?"準備中…":"生成追問建議"}</button>
        </div>
        <p class="interview-instructions">由訪問者自行決定是否採用；AI 不會把建議直接說給長者聽。</p>
        ${e.suggestions.length?`<ul class="suggestion-list">${e.suggestions.map(a=>`<li>${l(a)}</li>`).join("")}</ul>`:""}
      </section>
      <section class="story-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">訪談後</p>
            <h2>AI 訪談摘要</h2>
          </div>
          <button id="end-interview" class="primary" ${!e.messages.some(a=>a.role==="elderly")||e.summaryLoading||e.interviewEnded?"disabled":""}>${e.summaryLoading?"正在生成摘要…":e.interviewEnded?"訪談已結束":"結束訪談並生成摘要"}</button>
        </div>
        ${e.story?`<article class="story-review">
          <span class="ai-label">AI 整理・${s?"已確認":"尚未確認"}</span>
          <h3>${l(e.story.title||"我的回憶")}</h3>
          <p class="review-help">以下內容只係草稿。你可以直接修改，確認後先會加入故事書。</p>
          <div class="profile-heading"><div><p class="eyebrow">Story Profile</p><strong>長者可以逐項確認嘅資料</strong></div><span class="step">${s?"已確認":"待確認"}</span></div>
          <div class="profile-fields">
            ${Object.entries({people:"人物",place:"地點",year:"年份",quote:"長者原句"}).map(([a,m])=>`<label class="profile-field"><input type="checkbox" data-profile="${a}" ${s?"checked":""} /><span><small>${m}</small><strong>${l(V()[a])}</strong></span></label>`).join("")}
          </div>
          <textarea id="story-editor" rows="7" aria-label="故事內容">${l(e.story.text)}</textarea>
          <div class="review-actions">
            <button id="save-story-draft" class="secondary">儲存修改</button>
            ${s?'<div class="confirmed">✓ 已加入故事書</div>':'<button id="confirm-story-text" class="primary">確認 Story Profile 及故事</button>'}
          </div>
          <p class="review-help profile-disclaimer">AI 只係整理內容，未經長者逐項確認前，不會加入故事書或分享。</p>
        </article>`:`<div class="story-empty">
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
        ${s?`<p class="share-help">只有已確認嘅故事先可以分享。家人掃描 QR code，就可以睇故事同留言。</p>
          <div class="share-controls">
            <label class="consent-toggle"><input id="sharing-consent" type="checkbox" ${(d=e.sharing)!=null&&d.enabled?"checked":""} /> 我同意分享呢段故事</label>
            <button id="create-share" class="primary" ${(u=e.sharing)!=null&&u.enabled?"":"disabled"}>產生分享 QR Code</button>
          </div>
          ${(p=e.sharing)!=null&&p.enabled?`<div class="share-result">
            <div class="qr" aria-label="故事分享 QR Code">${oe()}</div>
            <div>
              <strong>已建立私人分享頁</strong>
              <p class="share-url">${l(e.sharing.url)}</p>
              <div class="share-buttons">
                <button id="share-whatsapp" class="share-button whatsapp" aria-label="分享到 WhatsApp">${H.whatsapp}<span>WhatsApp</span></button>
                <button id="share-facebook" class="share-button facebook" aria-label="分享到 Facebook">${H.facebook}<span>Facebook</span></button>
                <button id="share-wechat" class="share-button wechat" aria-label="分享到微信">${H.wechat}<span>微信</span></button>
                <button id="copy-share" class="share-button copy">複製連結</button>
                <button id="native-share" class="share-button more">更多分享</button>
              </div>
              <button id="open-share" class="text-button">預覽故事分享頁</button>
            </div>
          </div>`:""}`:'<p class="share-help">完成故事確認後，先可以產生 QR Code 分享頁。</p>'}
      </section>
      <section class="memory-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">保存一段回憶</p>
            <h2>加一張舊相</h2>
          </div>
          <span class="step">下一步</span>
        </div>
        ${e.photo?`<article class="story-card">
          <img src="${e.photo.image}" alt="${l(e.photo.title||"長者上載的舊相")}" />
          <div class="story-card-content">
            <span class="ai-label">AI 整理・請長者確認</span>
            <h3>${l(e.photo.title||"未命名回憶")}</h3>
            ${e.photo.year?`<p class="memory-meta">${l(e.photo.year)}${e.photo.people?` · ${l(e.photo.people)}`:""}</p>`:""}
            <p>${l(e.photo.caption||"你可以補充呢張相背後嘅故事。")}</p>
            ${e.photo.confirmed?'<div class="confirmed">✓ 已由長者確認，加入故事書</div>':'<button id="confirm-story" class="primary">我確認，加入故事書</button>'}
            <button id="remove-photo" class="text-button">移除呢張相</button>
          </div>
        </article>`:`<form id="photo-form" class="photo-form">
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
        <button id="clear" class="text-button" ${e.listening?"disabled":""}>清除本次逐字稿</button>
        <span>逐字稿及摘要儲存在此瀏覽器；音訊不會由本應用保存。</span>
      </footer>
      <details class="trust"><summary>了解語音轉錄及 AI 摘要</summary><p>${l(pe)} 語音辨識可能由瀏覽器或作業系統服務處理；開始前請先取得訪談者及長者同意。</p></details>
    </div>`,document.querySelector("#listen").addEventListener("click",B),document.querySelector("#transcription-consent").addEventListener("change",a=>{e.interviewConsent=a.target.checked,!e.interviewConsent&&e.listening&&S()}),(y=document.querySelector("#switch-speaker"))==null||y.addEventListener("click",Se),document.querySelector("#suggest-questions").addEventListener("click",ce),document.querySelector("#end-interview").addEventListener("click",K),document.querySelectorAll("[data-workflow-stage]").forEach(a=>a.addEventListener("click",()=>{e.workflowStage=Number(a.dataset.workflowStage),i()})),document.querySelectorAll("[data-topic]").forEach(a=>a.addEventListener("click",()=>be(a.dataset.topic))),(b=document.querySelector("#change-topic"))==null||b.addEventListener("click",()=>{e.topic="",localStorage.removeItem("yiloi-topic-v1"),i()}),document.querySelector("#caregiver-view").addEventListener("click",()=>{e.view="caregiver",i()}),document.querySelector("#focus-view").addEventListener("click",()=>{e.focusMode=!0,i()}),document.querySelector("#load-demo").addEventListener("click",()=>{e.messages.length&&!confirm("載入示範逐字稿會取代目前逐字稿及摘要，是否繼續？")||ne()}),(f=document.querySelector("#sharing-consent"))==null||f.addEventListener("change",a=>{document.querySelector("#create-share").disabled=!a.target.checked}),(k=document.querySelector("#create-share"))==null||k.addEventListener("click",()=>{e.sharing={enabled:!0,url:`${window.location.origin}${window.location.pathname}?story=demo-${Date.now()}`},J(),i()}),(q=document.querySelector("#copy-share"))==null||q.addEventListener("click",async a=>{await copyShareUrl(),a.currentTarget.textContent="已複製連結"}),(E=document.querySelector("#share-whatsapp"))==null||E.addEventListener("click",()=>{window.open(`https://wa.me/?text=${encodeURIComponent(`${Z()} ${U()}`)}`,"_blank","noopener,noreferrer")}),(x=document.querySelector("#share-facebook"))==null||x.addEventListener("click",()=>{window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(U())}`,"_blank","noopener,noreferrer")}),(L=document.querySelector("#share-wechat"))==null||L.addEventListener("click",async a=>{await copyShareUrl(),a.currentTarget.textContent="連結已複製",alert("分享連結已複製，請貼到微信對話或朋友圈。")}),(I=document.querySelector("#native-share"))==null||I.addEventListener("click",async a=>{if(navigator.share){await navigator.share({title:Z(),text:Z(),url:U()});return}await copyShareUrl(),a.currentTarget.textContent="連結已複製"}),(A=document.querySelector("#open-share"))==null||A.addEventListener("click",()=>{window.open(e.sharing.url,"_blank","noopener,noreferrer")}),(C=document.querySelector("#composer"))==null||C.addEventListener("submit",a=>{a.preventDefault();const m=document.querySelector("#manual-input"),v=m.value;m.value="",ie(v)}),document.querySelector("#clear").addEventListener("click",()=>{var a;confirm("確定清除本次逐字稿及未確認摘要？")&&(e.messages=[],e.suggestions=[],e.interviewEnded=!1,e.paused=!1,(a=e.story)!=null&&a.confirmed||(e.story=null,w()),e.status="已清除本次逐字稿。",localStorage.removeItem(M),_(),i())}),(P=document.querySelector("#photo-form"))==null||P.addEventListener("submit",a=>{a.preventDefault();const m=document.querySelector("#photo-input").files[0];if(!m){alert("請先選擇一張相片。");return}const v=new FileReader;v.onload=()=>{e.photo={image:v.result,title:document.querySelector("#photo-title").value.trim(),year:document.querySelector("#photo-year").value.trim(),people:document.querySelector("#photo-people").value.trim(),caption:document.querySelector("#photo-caption").value.trim(),confirmed:!1},N(),i()},v.readAsDataURL(m)}),(r=document.querySelector("#create-story"))==null||r.addEventListener("click",()=>{var m,v,O,Q,z;const a=draftStory();e.story={title:((m=e.photo)==null?void 0:m.title)||"我記得嘅一段日子",text:a,confirmed:!1,profileConfirmed:!1,profile:{people:((v=e.photo)==null?void 0:v.people)||"待長者補充",place:(Q=(O=e.photo)==null?void 0:O.title)!=null&&Q.includes("深水埗")?"深水埗":"待長者補充",year:((z=e.photo)==null?void 0:z.year)||"待長者補充",quote:a.split("。")[0]||"待長者選出原句"},sharePermissions:{story:!0,quote:!1,photo:!1,details:!1}},w(),i()}),(g=document.querySelector("#save-story-draft"))==null||g.addEventListener("click",()=>{e.story.text=document.querySelector("#story-editor").value.trim(),e.story.confirmed=!1,w(),i()}),(h=document.querySelector("#confirm-story-text"))==null||h.addEventListener("click",()=>{const a=document.querySelector("#story-editor").value.trim();if(!a){alert("請先寫一點故事內容。");return}if([...document.querySelectorAll("[data-profile]")].some(v=>!v.checked)){alert("請先逐項確認人物、地點、年份同原句。");return}e.story.text=a,e.story.confirmed=!0,e.story.profileConfirmed=!0,e.story.profile=V(),w(),i()}),(T=document.querySelector("#confirm-story"))==null||T.addEventListener("click",()=>{e.photo.confirmed=!0,N(),i()}),(R=document.querySelector("#remove-photo"))==null||R.addEventListener("click",()=>{e.photo=null,N(),i()}),($=document.querySelector("#resume"))==null||$.addEventListener("click",()=>{e.paused=!1,e.status="訪問者已確認可繼續記錄。",i()})}re()||i();
