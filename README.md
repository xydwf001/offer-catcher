# Offer Catcher

「Offer 捕手」学生求职匹配智能体 Demo。

## What It Does

- 读取腾讯、字节跳动、京东、网易、联想官方招聘岗位快照，并提供华为、阿里巴巴、美团、百度等官方校招入口。
- 解释岗位匹配分，包括技能、兴趣、城市、简历证据和竞争风险。
- 计算简历初筛命中率，并指出关键词、项目证据和量化表达缺口。
- 生成可复制的简历优化建议和投递策略。
- 展示岗位来源、发布时间和原始岗位链接。
- 支持按公司和国内城市筛选，点击岗位卡片直接打开对应公司官网职位页；接口失败时不展示模拟岗位。

## Run Locally

```powershell
python -m http.server 4173
```

Open `http://localhost:4173`.

## Delivery Files

- Demo: `index.html`, `styles.css`, `app.js`
- Solution note: `docs/solution.md`
- PDF: `docs/offer-catcher-solution.pdf`
- GitHub Pages source: `main` branch, `/` root folder
- Official job updater: `scripts/update_official_jobs.py`
- ByteDance snapshot updater: `scripts/update_bytedance_jobs.mjs`

## Refresh Official Jobs

```powershell
npm install --no-save playwright
npx playwright install chromium
node scripts/update_bytedance_jobs.mjs
python scripts/update_official_jobs.py
```

The generated `data/china-jobs.json` contains only records returned by official recruitment sites.

## Deploy

This repo is a static site. Push to `main`, then open GitHub repository settings:

1. Settings -> Pages
2. Build and deployment -> Source: `Deploy from a branch`
3. Branch: `main`, folder: `/ (root)`

The public URL will be `https://xydwf001.github.io/offer-catcher/`.
