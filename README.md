# Offer Catcher

「Offer 捕手」学生求职匹配智能体 Demo。

## What It Does

- 读取腾讯招聘官网的校园与实习岗位快照，并提供字节跳动、阿里巴巴、美团、百度、京东、华为官方校招入口。
- 解释岗位匹配分，包括技能、兴趣、城市、简历证据和竞争风险。
- 计算简历初筛命中率，并指出关键词、项目证据和量化表达缺口。
- 生成可复制的简历优化建议和投递策略。
- 展示岗位来源、发布时间和原始岗位链接。
- 点击岗位卡片直接打开腾讯招聘官网或腾讯 Workday 正式申请页；接口失败时不展示模拟岗位。

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
- Official job updater: `scripts/update_tencent_jobs.py`
- Scheduled updater: `.github/workflows/update-jobs.yml` (every 6 hours + manual run)

## Deploy

This repo is a static site. Push to `main`, then open GitHub repository settings:

1. Settings -> Pages
2. Build and deployment -> Source: `Deploy from a branch`
3. Branch: `main`, folder: `/ (root)`

The public URL will be `https://xydwf001.github.io/offer-catcher/`.
