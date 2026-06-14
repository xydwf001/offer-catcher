# Offer Catcher

「Offer 捕手」学生求职匹配智能体 Demo。

## What It Does

- 根据学生画像、目标方向、城市偏好和简历文本推荐岗位。
- 解释岗位匹配分，包括技能、兴趣、城市、简历证据和竞争风险。
- 计算简历初筛命中率，并指出关键词、项目证据和量化表达缺口。
- 生成可复制的简历优化建议和投递策略。

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

## Deploy

This repo is a static site. Push to `main`, then open GitHub repository settings:

1. Settings -> Pages
2. Build and deployment -> Source: `Deploy from a branch`
3. Branch: `main`, folder: `/ (root)`

The public URL will be `https://xydwf001.github.io/offer-catcher/`.
