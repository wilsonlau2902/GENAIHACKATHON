# 憶旅 MVP

第一階段 Demo 是一個手機／平板優先的廣東話 AI 回憶助手原型，包含：

- Web Speech API 粵語 (`zh-HK`) 語音輸入及語音朗讀
- 沒有 API key 也可使用的 Mock Agent
- 自我介紹、防騙聲明及廣東話回應
- 自傷／情緒低落訊號的安全暫停、照顧者通知 Mock
- 逐字稿儲存在瀏覽器 `localStorage`
- 每段 Agent 回應可按鈕重讀
- 舊相上載、回憶資料填寫、故事卡預覽及長者確認
- 對話內容整理成故事草稿、可編輯及長者確認後加入故事書
- 一鍵 Demo 示範模式（預載對話、舊相故事卡及已確認故事）
- 長者同意後產生 QR Code 私人分享頁，家人可查看故事並留下文字留言
- 分享連結可直接分享到 WhatsApp、Facebook；微信使用複製連結後貼上；支援手機原生「更多分享」

## 啟動

```bash
npm install
npm run dev
```

請使用 Chrome 測試粵語語音功能；瀏覽器可能會要求允許咪高風。

## 發布到 GitHub Pages

這個 repository 已附上 GitHub Actions 部署設定。將 `main` push 到 GitHub 後，
Actions 會自動建置並發布到：

`https://wilsonlau2902.github.io/GENAIHACKATHON/`

第一次使用時，請在 GitHub repository 的 **Settings → Pages → Build and deployment**
將 Source 設為 **GitHub Actions**。部署完成後，其他人就可以開啟公開網址。

## 目前限制

本版本沒有連接 LLM、後端資料庫或真正的照顧者通知。所有對話回應由 [agent-system-prompt.js](./src/agent-system-prompt.js) 的原則及本地 Mock 邏輯產生，逐字稿只保存在目前瀏覽器。
上載的相片及故事卡資料同樣只保存在目前瀏覽器；尚未產生真正影片或 PDF。
