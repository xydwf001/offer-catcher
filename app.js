const jobs = [
  {
    id: "data-analyst",
    title: "商业数据分析实习生",
    company: "星河零售科技",
    city: "上海",
    role: "data",
    skills: ["SQL", "Python", "Excel", "Tableau", "A/B测试", "指标体系"],
    interests: ["数据分析", "业务洞察", "增长"],
    difficulty: 0.12,
    summary: "面向校园招聘，负责用户行为分析、经营看板和促销复盘。",
  },
  {
    id: "ai-product",
    title: "AI 产品经理助理",
    company: "云岸智能",
    city: "深圳",
    role: "ai-product",
    skills: ["需求分析", "原型设计", "Prompt", "数据分析", "用户访谈", "AIGC"],
    interests: ["AI产品", "用户研究", "效率工具"],
    difficulty: 0.16,
    summary: "参与智能客服和知识库产品迭代，连接用户反馈、模型能力和产品方案。",
  },
  {
    id: "frontend",
    title: "前端开发实习生",
    company: "北辰协作软件",
    city: "北京",
    role: "frontend",
    skills: ["JavaScript", "TypeScript", "React", "CSS", "可访问性", "组件化"],
    interests: ["前端开发", "产品体验", "工程效率"],
    difficulty: 0.18,
    summary: "负责协作工具 Web 端组件开发、交互优化和基础质量建设。",
  },
  {
    id: "growth",
    title: "用户增长运营实习生",
    company: "鹿鸣教育",
    city: "杭州",
    role: "growth",
    skills: ["用户分层", "内容运营", "数据分析", "活动策划", "Excel", "转化率"],
    interests: ["运营", "教育", "增长"],
    difficulty: 0.1,
    summary: "负责课程活动增长、社群转化和用户留存分析。",
  },
  {
    id: "data-product",
    title: "数据产品助理",
    company: "澄明金融科技",
    city: "上海",
    role: "data",
    skills: ["SQL", "需求分析", "BI", "数据治理", "用户访谈", "指标体系"],
    interests: ["数据产品", "金融科技", "B端工具"],
    difficulty: 0.15,
    summary: "维护内部数据平台需求池，推动指标口径、看板和权限流程落地。",
  },
];

const defaults = {
  profile:
    "大三信息管理专业，正在找暑期实习。做过校园招聘数据看板，熟悉 Python、SQL、Excel，参与过用户访谈和问卷分析，希望找数据分析或 AI 产品相关岗位。",
  role: "data",
  city: "上海",
  keywords: "Python, SQL, Excel, 数据看板, 用户访谈, A/B测试",
  resume:
    "校园招聘数据看板项目：使用 Python 清洗 3200 条招聘信息，用 SQL 建立岗位、城市、薪资字段，制作 Excel 数据透视表和 Tableau 看板，帮助社团筛选高匹配岗位。\n\n用户调研项目：访谈 12 名同学，整理求职痛点，输出需求优先级和原型草图。\n\n技能：Python、SQL、Excel、Tableau、问卷分析、原型设计。",
};

const roleLabels = {
  data: "数据分析",
  "ai-product": "AI 产品经理",
  frontend: "前端开发",
  growth: "用户增长运营",
};

const form = document.querySelector("#profile-form");
const profileInput = document.querySelector("#profile");
const roleInput = document.querySelector("#role");
const cityInput = document.querySelector("#city");
const keywordsInput = document.querySelector("#keywords");
const resumeInput = document.querySelector("#resume");
const jobList = document.querySelector("#job-list");
const topRole = document.querySelector("#top-role");
const topScore = document.querySelector("#top-score");
const screenScore = document.querySelector("#screen-score");
const scoreBreakdown = document.querySelector("#score-breakdown");
const resumeActions = document.querySelector("#resume-actions");
const agentLog = document.querySelector("#agent-log");
const statusPill = document.querySelector("#analysis-status");
const toast = document.querySelector("#toast");

let selectedJobId = jobs[0].id;
let latestRecommendations = [];

function normalizeText(value) {
  return value.toLowerCase().replace(/[，。；、]/g, " ");
}

function readCandidate() {
  const profile = profileInput.value.trim();
  const resume = resumeInput.value.trim();
  const keywords = keywordsInput.value
    .split(/[,，、\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    profile,
    resume,
    role: roleInput.value,
    city: cityInput.value,
    keywords,
    text: normalizeText(`${profile} ${resume} ${keywords.join(" ")}`),
  };
}

function countHits(candidate, terms) {
  return terms.filter((term) => candidate.text.includes(term.toLowerCase()));
}

function hasQuantifiedEvidence(text) {
  return /\d|%|人|条|次|份|小时|周|月/.test(text);
}

function scoreJob(job, candidate) {
  const skillHits = countHits(candidate, job.skills);
  const interestHits = countHits(candidate, job.interests);
  const roleFit = candidate.role === job.role ? 18 : 6;
  const cityFit = candidate.city === "不限" || candidate.city === job.city ? 12 : 4;
  const skillScore = Math.round((skillHits.length / job.skills.length) * 38);
  const interestScore = Math.min(16, interestHits.length * 8);
  const evidenceScore = hasQuantifiedEvidence(candidate.resume) ? 10 : 4;
  const keywordBoost = Math.min(6, candidate.keywords.length);
  const penalty = Math.round(job.difficulty * 18);
  const total = Math.max(
    28,
    Math.min(98, skillScore + interestScore + roleFit + cityFit + evidenceScore + keywordBoost - penalty)
  );

  return {
    ...job,
    score: total,
    skillHits,
    interestHits,
    missingSkills: job.skills.filter((skill) => !skillHits.includes(skill)).slice(0, 3),
    fit: {
      "技能覆盖": `${skillHits.length}/${job.skills.length}`,
      "方向贴合": candidate.role === job.role ? "目标一致" : `更偏${roleLabels[job.role]}`,
      "城市适配": cityFit === 12 ? "符合偏好" : `${job.city}可备选`,
      "简历证据": evidenceScore >= 10 ? "有量化项目" : "缺少量化结果",
    },
  };
}

function scoreResume(job, candidate) {
  const skillHits = countHits(candidate, job.skills);
  const projectEvidence = /项目|看板|原型|访谈|活动|组件|系统|平台/.test(candidate.resume) ? 78 : 42;
  const quantified = hasQuantifiedEvidence(candidate.resume) ? 86 : 48;
  const roleIntent = candidate.role === job.role ? 86 : 58;
  const keywordCoverage = Math.round((skillHits.length / job.skills.length) * 100);
  const readability = candidate.resume.length > 80 && candidate.resume.length < 900 ? 82 : 62;
  const total = Math.round(
    keywordCoverage * 0.34 + projectEvidence * 0.22 + quantified * 0.18 + roleIntent * 0.16 + readability * 0.1
  );

  return {
    total,
    rows: [
      ["关键词覆盖", keywordCoverage],
      ["项目证据", projectEvidence],
      ["量化表达", quantified],
      ["岗位意图", roleIntent],
      ["可读性", readability],
    ],
  };
}

function buildActions(job, candidate, resumeScore) {
  const missing = job.skills.filter((skill) => !candidate.text.includes(skill.toLowerCase()));
  const topMissing = missing.slice(0, 3);
  const roleLine =
    job.role === "ai-product"
      ? "把用户访谈、Prompt 设计和原型结果写成同一条项目链路。"
      : job.role === "frontend"
      ? "补充组件、状态处理、性能或可访问性细节，证明能进入工程协作。"
      : job.role === "growth"
      ? "把活动目标、用户分层、转化率和复盘结论写清楚。"
      : "把数据口径、SQL 查询、看板指标和业务结论连起来写。";

  const actions = [
    topMissing.length
      ? `在技能或项目描述中自然补入 ${topMissing.join("、")}，不要只堆在技能栏。`
      : "关键词覆盖已经不错，下一步重点提升项目结果的清晰度。",
    roleLine,
    resumeScore.rows.find(([label]) => label === "量化表达")[1] < 70
      ? "每条项目经历补一个数字：样本量、转化率、节省时间或覆盖用户数。"
      : "保留量化结果，把最强数字放在项目句子的前半段。",
    `投递 ${job.title} 前，准备一个 60 秒说明：为什么你的经历能解决“${job.summary}”里的问题。`,
  ];

  return actions;
}

function renderJobs(recommendations, candidate) {
  jobList.innerHTML = "";

  recommendations.forEach((job) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `job-card${job.id === selectedJobId ? " is-selected" : ""}`;
    card.setAttribute("aria-pressed", job.id === selectedJobId ? "true" : "false");
    card.dataset.jobId = job.id;

    const tags = [...job.skillHits.slice(0, 4), ...job.missingSkills.map((skill) => `缺 ${skill}`)]
      .map((tag) => `<span class="tag${tag.startsWith("缺 ") ? " missing" : ""}">${tag}</span>`)
      .join("");

    const fitItems = Object.entries(job.fit)
      .map(([label, value]) => `<div class="fit-item"><strong>${label}</strong>${value}</div>`)
      .join("");

    card.innerHTML = `
      <div>
        <h3>${job.title}</h3>
        <p class="job-meta">${job.company} · ${job.city} · ${job.summary}</p>
        <div class="tags">${tags || '<span class="tag missing">待补充关键词</span>'}</div>
        <div class="fit-grid">${fitItems}</div>
      </div>
      <div class="score-block">
        <span class="score-number">${job.score}</span>
        <span class="score-bar" aria-label="匹配分 ${job.score}">
          <span style="--value: ${job.score}%"></span>
        </span>
      </div>
    `;

    card.addEventListener("click", () => {
      selectedJobId = job.id;
      render(candidate);
    });

    jobList.append(card);
  });
}

function renderBreakdown(resumeScore) {
  scoreBreakdown.innerHTML = resumeScore.rows
    .map(
      ([label, value]) => `
        <div class="breakdown-row">
          <strong>${label}</strong>
          <span class="score-bar" aria-label="${label} ${value}">
            <span style="--value: ${value}%"></span>
          </span>
          <span>${value}</span>
        </div>
      `
    )
    .join("");
}

function renderLog(selectedJob, recommendations, resumeScore) {
  const topThree = recommendations
    .slice(0, 3)
    .map((job) => `${job.title} ${job.score}分`)
    .join("，");

  agentLog.innerHTML = [
    `<strong>解析画像：</strong>识别目标方向、城市偏好、技能关键词和简历中的项目证据。`,
    `<strong>筛选岗位：</strong>当前前三名为 ${topThree}。`,
    `<strong>诊断简历：</strong>${selectedJob.title} 的初筛命中率为 ${resumeScore.total}分，主要由关键词覆盖和项目证据决定。`,
    `<strong>行动建议：</strong>优先修改简历后投递 ${selectedJob.company}，再按分数顺序投递相邻岗位。`,
  ]
    .map((item) => `<li>${item}</li>`)
    .join("");
}

function render(candidate = readCandidate()) {
  const recommendations = jobs.map((job) => scoreJob(job, candidate)).sort((a, b) => b.score - a.score);
  latestRecommendations = recommendations;

  if (!recommendations.some((job) => job.id === selectedJobId)) {
    selectedJobId = recommendations[0].id;
  }

  const selectedJob = recommendations.find((job) => job.id === selectedJobId) || recommendations[0];
  const resumeScore = scoreResume(selectedJob, candidate);
  const actions = buildActions(selectedJob, candidate, resumeScore);

  topRole.textContent = `${recommendations[0].title}`;
  topScore.textContent = `${recommendations[0].score}`;
  screenScore.textContent = `${resumeScore.total}`;
  statusPill.textContent = candidate.resume ? "已完成分析" : "请补充简历";

  renderJobs(recommendations, candidate);
  renderBreakdown(resumeScore);
  resumeActions.innerHTML = actions.map((action) => `<li>${action}</li>`).join("");
  renderLog(selectedJob, recommendations, resumeScore);

  localStorage.setItem(
    "offer-catcher-profile",
    JSON.stringify({
      profile: profileInput.value,
      role: roleInput.value,
      city: cityInput.value,
      keywords: keywordsInput.value,
      resume: resumeInput.value,
    })
  );
}

function loadValues(values) {
  profileInput.value = values.profile;
  roleInput.value = values.role;
  cityInput.value = values.city;
  keywordsInput.value = values.keywords;
  resumeInput.value = values.resume;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const candidate = readCandidate();
  const nextTop = jobs.map((job) => scoreJob(job, candidate)).sort((a, b) => b.score - a.score)[0];
  selectedJobId = nextTop.id;
  render(candidate);
  showToast("匹配完成，已更新岗位顺序和简历命中率。");
});

document.querySelector("#load-sample").addEventListener("click", () => {
  loadValues(defaults);
  selectedJobId = jobs[0].id;
  render();
  showToast("已载入示例画像。");
});

document.querySelector("#copy-actions").addEventListener("click", async () => {
  const selectedJob = latestRecommendations.find((job) => job.id === selectedJobId) || latestRecommendations[0];
  const text = Array.from(resumeActions.querySelectorAll("li"))
    .map((item, index) => `${index + 1}. ${item.textContent}`)
    .join("\n");

  try {
    await navigator.clipboard.writeText(`Offer 捕手建议：${selectedJob.title}\n${text}`);
    showToast("优化建议已复制。");
  } catch {
    showToast("浏览器未允许复制，可以直接选中文本。");
  }
});

const saved = localStorage.getItem("offer-catcher-profile");
loadValues(saved ? JSON.parse(saved) : defaults);
render();
