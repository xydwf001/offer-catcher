const REMOTIVE_API = "https://remotive.com/api/remote-jobs";
const CACHE_KEY = "offer-catcher-live-jobs-v2";
const CACHE_TTL = 1000 * 60 * 60 * 6;

const defaults = {
  profile:
    "大三信息管理专业，正在找暑期实习。做过校园招聘数据看板，熟悉 Python、SQL、Excel，参与过用户访谈和问卷分析，希望找数据分析或 AI 产品相关岗位。",
  role: "data",
  city: "不限",
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

const roleTags = {
  data: ["data analyst", "data science", "analytics", "sql", "python", "business intelligence"],
  "ai-product": ["ai product", "product manager", "machine learning", "prompt", "user research"],
  frontend: ["frontend", "front end", "react", "javascript", "typescript", "css"],
  growth: ["growth", "marketing", "user acquisition", "content", "conversion"],
};

const skillLexicon = [
  "SQL",
  "Python",
  "Excel",
  "Tableau",
  "Power BI",
  "A/B测试",
  "指标体系",
  "需求分析",
  "原型设计",
  "Prompt",
  "AIGC",
  "用户访谈",
  "JavaScript",
  "TypeScript",
  "React",
  "Vue",
  "CSS",
  "HTML",
  "可访问性",
  "组件化",
  "用户分层",
  "内容运营",
  "活动策划",
  "转化率",
  "SEO",
  "CRM",
];

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
const sourceStatus = document.querySelector("#source-status");
const jobSourceNote = document.querySelector("#job-source-note");
const scoreBreakdown = document.querySelector("#score-breakdown");
const resumeActions = document.querySelector("#resume-actions");
const agentLog = document.querySelector("#agent-log");
const statusPill = document.querySelector("#analysis-status");
const toast = document.querySelector("#toast");
const refreshButton = document.querySelector("#refresh-jobs");
const copyActionsButton = document.querySelector("#copy-actions");

let selectedJobId = null;
let latestRecommendations = [];
let liveJobs = [];
let sourceMeta = {
  label: "连接中",
  note: "正在拉取公开岗位源，并按你的画像重新排序。",
  loadedAt: null,
  state: "loading",
};

function describeScore(score) {
  if (score >= 80) return "优先投递";
  if (score >= 60) return "值得准备";
  return "谨慎备选";
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[，。；、]/g, " ");
}

function stripHtml(value) {
  const div = document.createElement("div");
  div.innerHTML = String(value || "");
  return div.textContent.replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeExternalUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
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
  return terms.filter((term) => candidate.text.includes(normalizeText(term)));
}

function countTextHits(text, terms) {
  const haystack = normalizeText(text);
  return terms.filter((term) => haystack.includes(normalizeText(term)));
}

function hasQuantifiedEvidence(text) {
  return /\d|%|人|条|次|份|小时|周|月/.test(text);
}

function formatDate(value) {
  if (!value) return "发布时间未知";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "发布时间未知";
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

function formatSourceTime(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function inferRoleFromJob(text) {
  let bestRole = "data";
  let bestHits = -1;
  Object.entries(roleTags).forEach(([role, terms]) => {
    const hits = countTextHits(text, terms).length;
    if (hits > bestHits) {
      bestRole = role;
      bestHits = hits;
    }
  });
  return bestRole;
}

function extractSkills(text) {
  const hits = countTextHits(text, skillLexicon);
  return [...new Set(hits)].slice(0, 8);
}

function normalizeRemotiveJob(raw) {
  const description = stripHtml(raw.description);
  const title = raw.title || "Untitled role";
  const company = raw.company_name || "Unknown company";
  const allText = `${title} ${company} ${description} ${raw.category || ""} ${raw.job_type || ""}`;
  const inferredRole = inferRoleFromJob(allText);
  const skills = extractSkills(allText);
  const remoteRegion = raw.candidate_required_location || "Remote";

  return {
    id: `remotive-${raw.id || raw.url || title}`,
    title,
    company,
    city: remoteRegion,
    role: inferredRole,
    skills: skills.length ? skills : roleTags[inferredRole].slice(0, 5),
    interests: roleTags[inferredRole].slice(0, 3),
    difficulty: 0.13,
    summary: description.slice(0, 138) || "公开岗位源暂未提供详细描述。",
    url: normalizeExternalUrl(raw.url),
    source: "Remotive",
    publishedAt: raw.publication_date,
    jobType: raw.job_type || raw.category || "Remote",
    salary: raw.salary || "",
  };
}

function buildApiUrl(candidate) {
  const params = new URLSearchParams({ limit: "50" });
  const tags = roleTags[candidate.role] || roleTags.data;
  params.set("search", tags.slice(0, 2).join(" "));
  return `${REMOTIVE_API}?${params.toString()}`;
}

async function fetchJsonWithTimeout(url, timeoutMs = 9000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function readCache(candidate) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (!cache || Date.now() - cache.loadedAt > CACHE_TTL) return null;
    if (cache.role !== candidate.role || cache.city !== candidate.city) return null;
    return cache;
  } catch {
    return null;
  }
}

function writeCache(candidate, jobs) {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      role: candidate.role,
      city: candidate.city,
      loadedAt: Date.now(),
      jobs,
    })
  );
}

async function loadLiveJobs(candidate, force = false) {
  const cached = !force ? readCache(candidate) : null;
  if (cached) {
    liveJobs = cached.jobs;
    sourceMeta = {
      label: `Remotive ${liveJobs.length}条`,
      note: `使用 Remotive 公开岗位源缓存，最后更新 ${formatSourceTime(cached.loadedAt)}。为遵守公开 API 频率限制，缓存保留 6 小时。`,
      loadedAt: cached.loadedAt,
      state: "ready",
    };
    return;
  }

  statusPill.textContent = "拉取岗位源";
  sourceStatus.textContent = "连接中";
  refreshButton.disabled = true;

  try {
    let data = await fetchJsonWithTimeout(buildApiUrl(candidate));
    let jobs = Array.isArray(data.jobs) ? data.jobs.map(normalizeRemotiveJob) : [];

    if (jobs.length < 6) {
      data = await fetchJsonWithTimeout(`${REMOTIVE_API}?limit=50`);
      jobs = Array.isArray(data.jobs) ? data.jobs.map(normalizeRemotiveJob) : jobs;
    }

    liveJobs = jobs;
    sourceMeta = jobs.length
      ? {
          label: `Remotive ${jobs.length}条`,
          note: "岗位来自 Remotive 官方公开 API，数据约延迟 24 小时；本页标注来源并链接回原始岗位。",
          loadedAt: Date.now(),
          state: "ready",
        }
      : {
          label: "暂无结果",
          note: "公开岗位源没有返回符合当前条件的岗位。请调整目标方向或稍后重试。",
          loadedAt: Date.now(),
          state: "empty",
        };

    if (jobs.length) writeCache(candidate, jobs);
  } catch (error) {
    liveJobs = [];
    sourceMeta = {
      label: "连接失败",
      note: `无法连接公开岗位源，页面不会展示编造岗位。请点击“刷新岗位”重试。错误：${error.name === "AbortError" ? "请求超时" : error.message}`,
      loadedAt: Date.now(),
      state: "error",
    };
  } finally {
    refreshButton.disabled = false;
  }
}

function scoreJob(job, candidate) {
  const skillHits = countHits(candidate, job.skills);
  const interestHits = countHits(candidate, job.interests);
  const roleTextHits = countTextHits(`${job.title} ${job.summary}`, roleTags[candidate.role] || []).length;
  const roleFit = candidate.role === job.role ? 20 : Math.min(14, roleTextHits * 5);
  const cityFit = candidate.city === "不限" || /remote|worldwide|asia|apac|china/i.test(job.city) ? 10 : 5;
  const skillScore = Math.round((skillHits.length / Math.max(1, job.skills.length)) * 32);
  const interestScore = Math.min(14, interestHits.length * 6);
  const evidenceScore = hasQuantifiedEvidence(candidate.resume) ? 9 : 4;
  const keywordBoost = Math.min(8, candidate.keywords.filter((word) => normalizeText(`${job.title} ${job.summary}`).includes(normalizeText(word))).length * 2);
  const freshnessBoost = job.publishedAt && Date.now() - new Date(job.publishedAt).getTime() < 1000 * 60 * 60 * 24 * 21 ? 5 : 2;
  const penalty = Math.round(job.difficulty * 12);
  const total = Math.max(
    24,
    Math.min(98, skillScore + interestScore + roleFit + cityFit + evidenceScore + keywordBoost + freshnessBoost - penalty)
  );

  return {
    ...job,
    score: total,
    skillHits,
    interestHits,
    missingSkills: job.skills.filter((skill) => !skillHits.includes(skill)).slice(0, 3),
    fit: {
      "技能覆盖": `${skillHits.length}/${job.skills.length}`,
      "方向贴合": roleFit >= 18 ? "高度相关" : roleFit >= 10 ? "可转向" : `更偏${roleLabels[job.role]}`,
      "岗位来源": job.source,
      "发布时间": formatDate(job.publishedAt),
    },
  };
}

function scoreResume(job, candidate) {
  const skillHits = countHits(candidate, job.skills);
  const projectEvidence = /项目|看板|原型|访谈|活动|组件|系统|平台/.test(candidate.resume) ? 78 : 42;
  const quantified = hasQuantifiedEvidence(candidate.resume) ? 86 : 48;
  const roleIntent = candidate.role === job.role ? 86 : 62;
  const keywordCoverage = Math.round((skillHits.length / Math.max(1, job.skills.length)) * 100);
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
  const missing = job.skills.filter((skill) => !candidate.text.includes(normalizeText(skill)));
  const topMissing = missing.slice(0, 3);
  const roleLine =
    job.role === "ai-product"
      ? "把用户访谈、Prompt 设计和原型结果写成同一条项目链路。"
      : job.role === "frontend"
      ? "补充组件、状态处理、性能或可访问性细节，证明能进入工程协作。"
      : job.role === "growth"
      ? "把活动目标、用户分层、转化率和复盘结论写清楚。"
      : "把数据口径、SQL 查询、看板指标和业务结论连起来写。";

  return [
    topMissing.length
      ? `优先补齐岗位原文里的 ${topMissing.join("、")} 证据，放进项目经历而不是只堆技能栏。`
      : "关键词覆盖不错，下一步重点提升项目结果的清晰度。",
    roleLine,
    resumeScore.rows.find(([label]) => label === "量化表达")[1] < 70
      ? "每条项目经历补一个数字：样本量、转化率、节省时间或覆盖用户数。"
      : "保留量化结果，把最强数字放在项目句子的前半段。",
    job.url ? `打开原始岗位链接，核对 JD 后再定制投递材料：${job.url}` : "先核对岗位原文，再投递。",
  ];
}

function renderJobs(recommendations, candidate) {
  jobList.innerHTML = "";

  recommendations.forEach((job, index) => {
    const card = document.createElement("article");
    card.className = `job-card${job.id === selectedJobId ? " is-selected" : ""}`;
    card.tabIndex = 0;
    card.setAttribute("role", "link");
    card.setAttribute("aria-label", `打开 ${job.company} 的 ${job.title} 真实职位页面`);
    card.dataset.jobId = job.id;

    const tags = [...job.skillHits.slice(0, 4), ...job.missingSkills.map((skill) => `缺 ${skill}`)]
      .map((tag) => `<span class="tag${tag.startsWith("缺 ") ? " missing" : ""}">${escapeHtml(tag)}</span>`)
      .join("");

    const fitItems = Object.entries(job.fit)
      .map(([label, value]) => `<div class="fit-item"><strong>${escapeHtml(label)}</strong>${escapeHtml(value)}</div>`)
      .join("");

    card.innerHTML = `
      <div class="job-main">
        <div class="job-title-row">
          <span class="rank-badge">${String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>${escapeHtml(job.title)}</h3>
            <p class="job-meta">${escapeHtml(job.company)} · ${escapeHtml(job.city)} · ${escapeHtml(job.jobType)}</p>
          </div>
        </div>
        <p class="job-summary">${escapeHtml(job.summary)}</p>
        <div class="tags">${tags || '<span class="tag missing">待补充关键词</span>'}</div>
        <div class="fit-grid">${fitItems}</div>
        <div class="job-actions">
          <span class="source-link">打开真实职位页 ↗</span>
          <button class="analyze-button" type="button">分析此岗位</button>
        </div>
      </div>
      <div class="score-block">
        <span class="score-caption">${describeScore(job.score)}</span>
        <span class="score-number">${job.score}</span>
        <span class="score-bar" aria-label="匹配分 ${job.score}">
          <span style="--value: ${job.score}%"></span>
        </span>
      </div>
    `;

    card.querySelector(".analyze-button").addEventListener("click", (event) => {
      event.stopPropagation();
      selectedJobId = job.id;
      render(candidate);
    });
    card.addEventListener("click", () => {
      if (job.url) window.open(job.url, "_blank", "noopener,noreferrer");
    });
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (job.url) window.open(job.url, "_blank", "noopener,noreferrer");
    });

    jobList.append(card);
  });
}

function renderNoJobs() {
  topRole.textContent = "暂无真实岗位";
  topScore.textContent = "--";
  screenScore.textContent = "--";
  sourceStatus.textContent = sourceMeta.label;
  jobSourceNote.textContent = sourceMeta.note;
  statusPill.textContent = sourceMeta.state === "error" ? "连接失败" : "暂无结果";
  copyActionsButton.disabled = true;
  latestRecommendations = [];
  selectedJobId = null;

  jobList.innerHTML = `
    <div class="empty-state">
      <h3>没有展示任何模拟岗位</h3>
      <p>${escapeHtml(sourceMeta.note)}</p>
      <a href="https://remotive.com/remote-jobs" target="_blank" rel="noopener noreferrer">直接浏览 Remotive 真实岗位库</a>
    </div>
  `;
  scoreBreakdown.innerHTML = '<p class="empty-copy">获取到真实岗位后，这里会展示针对该岗位的简历命中率。</p>';
  resumeActions.innerHTML = "<li>先刷新岗位源，或直接进入 Remotive 岗位库查看真实职位。</li>";
  agentLog.innerHTML = `<li><strong>岗位源状态：</strong>${escapeHtml(sourceMeta.note)}</li>`;
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
    .map((job) => `${escapeHtml(job.title)} ${job.score}分`)
    .join("，");

  agentLog.innerHTML = [
    `<strong>拉取岗位：</strong>${escapeHtml(sourceMeta.note)}`,
    `<strong>筛选岗位：</strong>当前前三名为 ${topThree}。`,
    `<strong>诊断简历：</strong>${escapeHtml(selectedJob.title)} 的初筛命中率为 ${resumeScore.total}分，主要由关键词覆盖和项目证据决定。`,
    `<strong>行动建议：</strong>优先打开原始岗位链接核对 JD，再按分数顺序定制简历和投递材料。`,
  ]
    .map((item) => `<li>${item}</li>`)
    .join("");
}

function render(candidate = readCandidate()) {
  if (!liveJobs.length) {
    renderNoJobs();
    return;
  }

  const recommendations = liveJobs.map((job) => scoreJob(job, candidate)).sort((a, b) => b.score - a.score);
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
  sourceStatus.textContent = sourceMeta.label;
  jobSourceNote.textContent = sourceMeta.note;
  statusPill.textContent = "真实岗位源";
  copyActionsButton.disabled = false;

  renderJobs(recommendations, candidate);
  renderBreakdown(resumeScore);
  resumeActions.innerHTML = actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("");
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

async function refreshJobs(force = false) {
  const candidate = readCandidate();
  await loadLiveJobs(candidate, force);
  selectedJobId = liveJobs[0]?.id || null;
  render(candidate);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const candidate = readCandidate();
  await loadLiveJobs(candidate, false);
  if (!liveJobs.length) {
    render(candidate);
    showToast("没有获取到真实岗位，请重试或调整方向。");
    return;
  }
  const nextTop = liveJobs.map((job) => scoreJob(job, candidate)).sort((a, b) => b.score - a.score)[0];
  selectedJobId = nextTop?.id || null;
  render(candidate);
  showToast("已按实时岗位源更新匹配顺序。");
});

refreshButton.addEventListener("click", async () => {
  await refreshJobs(true);
  showToast("岗位源已刷新。");
});

document.querySelector("#load-sample").addEventListener("click", async () => {
  loadValues(defaults);
  selectedJobId = null;
  await refreshJobs(false);
  showToast("已载入示例画像并匹配实时岗位。");
});

copyActionsButton.addEventListener("click", async () => {
  const selectedJob = latestRecommendations.find((job) => job.id === selectedJobId) || latestRecommendations[0];
  if (!selectedJob) {
    showToast("暂无真实岗位可复制建议。");
    return;
  }
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
refreshJobs(false);
