# 憶旅 MVP

憶旅是一個手機／平板優先的廣東話長者回憶訪談原型。長者由工作人員真人訪問；AI 不會直接與長者對話。

- 工作人員選擇訪談主題，與長者面對面交談
- 預設由訪問者開始，以瀏覽器 Web Speech API (`zh-HK`) 即時轉錄；可在錄音期間切換說話者，或手動輸入逐字稿
- 工作人員可按需請 AI 提供最多三條可選追問
- 結束訪談後，AI 根據逐字稿生成摘要草稿，供工作人員和長者核對、修改及確認
- 開始語音轉錄或傳送逐字稿給 AI 前，介面會要求訪問者及長者同意
- 本應用不保存音訊；瀏覽器的語音辨識可能由瀏覽器服務處理。逐字稿及摘要保存在目前瀏覽器的 `localStorage`
- 逐字稿和摘要由前端傳到 `server/proxy.js`，再轉送至設定的 AI 服務；請勿輸入未獲授權的敏感資料
- 訪談示範逐字稿、長者確認摘要後的故事分享頁，以及照顧者／工作人員 Dashboard

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

語音轉錄依賴瀏覽器支援及麥克風權限，並非說話者自動辨識；錄音預設由訪問者開始，工作人員可在同一錄音期間切換目前說話者，無須手動停止再開始。AI 摘要和追問需要設定 `server/proxy.js` 的 API key 及服務環境變數。此原型沒有後端資料庫、登入或真正的照顧者通知；逐字稿、摘要、相片及故事卡資料只保存在目前瀏覽器。

## AI API 設定

在本機複製 `.env.example` 為 `.env`，設定 `API_KEY`、`API_BASE_URL`、`API_CHAT_PATH`、`API_KEY_HEADER` 及 `API_KEY_PREFIX`，再執行：

```bash
npm run start-server
```

不要提交 `.env` 或把 API key 放入前端程式碼。部署代理時請在主機的環境變數／Secret 設定中提供 API key，並設定 `FRONTEND_ORIGINS` 為允許的網站來源（逗號分隔）及 `RATE_LIMIT_MAX`（預設每個 IP 每小時 10 次 AI 請求）。GitHub Pages 的 repository variable `VITE_PROXY_URL` 應設定為公開代理的完整 `/api/chat` URL；此值不是秘密。設定後重新執行 Pages 部署。
