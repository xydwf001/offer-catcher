const JOBS_DATA_URL = "data/china-jobs.json";
const CACHE_KEY = "offer-catcher-china-jobs-v5";
const CACHE_TTL = 1000 * 60 * 60 * 6;
const INITIAL_VISIBLE_JOBS = 30;
const LOAD_MORE_STEP = 24;

const CHINA_CAREER_PORTALS = [
  { company: "腾讯", url: "https://careers.tencent.com/" },
  { company: "字节跳动", url: "https://jobs.bytedance.com/campus/position" },
  { company: "阿里巴巴", url: "https://talent.alibaba.com/campus/position-list" },
  { company: "美团", url: "https://zhaopin.meituan.com/web/campus" },
  { company: "百度", url: "https://talent.baidu.com/jobs/list" },
  { company: "京东", url: "https://campus.jd.com/" },
  { company: "华为", url: "https://career.huawei.com/reccampportal/portal5/index.html" },
  { company: "网易", url: "https://campus.163.com/" },
  { company: "联想", url: "https://talent.lenovo.com.cn/" },
];

const defaults = {
  profile:
    "大三信息管理专业，正在找暑期实习。做过校园招聘数据看板，熟悉 Python、SQL、Excel，参与过用户访谈和问卷分析，希望找数据分析或 AI 产品相关岗位。",
  role: "data",
  city: "全国",
  keywords: "Python, SQL, Excel, 数据看板, 用户访谈, A/B测试",
  resume:
    "校园招聘数据看板项目：使用 Python 清洗 3200 条招聘信息，用 SQL 建立岗位、城市、薪资字段，制作 Excel 数据透视表和 Tableau 看板，帮助社团筛选高匹配岗位。\n\n用户调研项目：访谈 12 名同学，整理求职痛点，输出需求优先级和原型草图。\n\n技能：Python、SQL、Excel、Tableau、问卷分析、原型设计。",
};

const roleLabels = {
  general: "综合探索",
  data: "数据与商业分析",
  "ai-product": "AI 产品与大模型应用",
  product: "产品经理与项目管理",
  frontend: "软件研发与互联网技术",
  growth: "运营与用户增长",
  marketing: "市场、品牌与内容传播",
  sales: "销售、商务与客户成功",
  consulting: "咨询、战略与管培生",
  finance: "财务、金融与审计",
  hr: "人力资源与行政",
  "supply-chain": "供应链、采购与物流",
  design: "设计、创意与用户体验",
  engineering: "硬件、工程与智能制造",
  education: "教育、培训与课程研发",
  healthcare: "医疗、健康与生命科学",
  legal: "法务、合规与风险管理",
};

const roleTags = {
  general: [],
  data: [
    "data analyst",
    "data scientist",
    "data science",
    "business analyst",
    "analytics",
    "sql",
    "business intelligence",
    "数据分析",
    "数据科学",
    "商业分析",
    "数据工程",
  ],
  "ai-product": [
    "ai product",
    "ai产品",
    "大模型产品",
    "智能产品",
    "agent产品",
    "prompt",
    "aigc产品",
    "模型应用",
  ],
  product: [
    "product manager",
    "product management",
    "project manager",
    "project management",
    "产品经理",
    "产品策划",
    "产品",
    "项目管理",
    "需求分析",
  ],
  frontend: [
    "frontend",
    "front end",
    "backend",
    "back end",
    "full stack",
    "software engineer",
    "software development",
    "web developer",
    "react",
    "javascript",
    "typescript",
    "前端",
    "后端",
    "全栈",
    "软件开发",
    "研发工程师",
    "客户端开发",
  ],
  growth: [
    "growth",
    "user acquisition",
    "content operation",
    "conversion",
    "增长",
    "运营",
    "用户运营",
    "内容运营",
    "平台运营",
    "游戏运营",
    "社群运营",
  ],
  marketing: [
    "marketing",
    "brand",
    "public relations",
    "communications",
    "市场",
    "品牌",
    "营销",
    "公关",
    "内容传播",
    "新媒体",
  ],
  sales: [
    "sales",
    "account representative",
    "business development",
    "customer success",
    "销售",
    "商务拓展",
    "客户成功",
    "客户经理",
    "渠道",
  ],
  consulting: [
    "consulting",
    "strategy",
    "management trainee",
    "business operations",
    "咨询",
    "战略",
    "管培生",
    "经营管理",
    "商业运营",
  ],
  finance: [
    "finance",
    "financial",
    "accounting",
    "audit",
    "internal control",
    "财务",
    "会计",
    "审计",
    "内控",
    "金融",
    "投资",
  ],
  hr: [
    "human resources",
    "talent acquisition",
    "people operations",
    "hr intern",
    "人力资源",
    "招聘",
    "培训",
    "组织发展",
    "行政",
  ],
  "supply-chain": [
    "supply chain",
    "procurement",
    "logistics",
    "purchasing",
    "供应链",
    "采购",
    "物流",
    "仓储",
    "库存",
    "采销",
  ],
  design: [
    "user experience",
    "ux design",
    "ui design",
    "visual design",
    "game art",
    "设计",
    "交互",
    "用户体验",
    "视觉",
    "美术",
    "视频制作",
  ],
  engineering: [
    "hardware engineering",
    "mechanical",
    "electrical",
    "manufacturing",
    "camera engineer",
    "硬件",
    "机械",
    "结构设计",
    "工业工程",
    "智能制造",
    "质量工程",
    "设备维养",
  ],
  education: [
    "teacher",
    "education",
    "curriculum",
    "teaching",
    "教师",
    "老师",
    "教育",
    "课程研发",
    "教学",
    "学业规划",
  ],
  healthcare: [
    "medical",
    "healthcare",
    "doctor",
    "pharmacy",
    "nurse",
    "医疗",
    "医师",
    "护理",
    "药房",
    "药学",
    "临床",
    "健康",
  ],
  legal: [
    "legal",
    "compliance",
    "risk control",
    "法务",
    "合规",
    "风控",
    "合同审核",
    "知识产权",
  ],
};

const skillLexicon = [
  "Office",
  "Word",
  "PPT",
  "英语",
  "沟通表达",
  "团队协作",
  "项目管理",
  "行业研究",
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
  "大模型",
  "用户访谈",
  "市场调研",
  "竞品分析",
  "商业分析",
  "JavaScript",
  "TypeScript",
  "Java",
  "C++",
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
  "品牌策划",
  "新媒体运营",
  "文案写作",
  "短视频",
  "商务拓展",
  "客户关系",
  "谈判",
  "财务分析",
  "会计",
  "审计",
  "成本管理",
  "招聘",
  "培训",
  "绩效管理",
  "人力资源",
  "供应链",
  "采购",
  "库存管理",
  "物流规划",
  "Figma",
  "Photoshop",
  "Illustrator",
  "视频剪辑",
  "教学设计",
  "课程研发",
  "临床",
  "护理",
  "药学",
  "法务",
  "合同审核",
  "风险控制",
  "CAD",
  "机械设计",
  "硬件",
  "质量管理",
  "信息检索",
  "活动组织",
  "产品规划",
  "PRD",
  "模型评测",
  "Agent",
  "Git",
  "数据库",
  "社群运营",
  "数据复盘",
  "用户增长",
  "公关传播",
  "媒介投放",
  "销售分析",
  "渠道管理",
  "方案演示",
  "客户成功",
  "结构化思维",
  "案例分析",
  "战略规划",
  "财务建模",
  "预算管理",
  "组织发展",
  "员工关系",
  "供应商管理",
  "需求预测",
  "交互设计",
  "视觉设计",
  "作品集",
  "结构设计",
  "生产制造",
  "课堂管理",
  "教育心理",
  "内容制作",
  "学习规划",
  "教师资格证",
  "健康管理",
  "医学研究",
  "患者沟通",
  "执业资格",
  "法律检索",
  "知识产权",
  "文书写作",
];

const commonKeywordSuggestions = ["沟通表达", "团队协作", "项目管理", "英语", "Excel"];

const keywordSuggestionsByRole = {
  general: ["Office", "PPT", "行业研究", "信息检索", "文案写作", "活动组织", "数据整理", "公众表达"],
  data: ["SQL", "Python", "Excel", "Tableau", "Power BI", "商业分析", "指标体系", "数据可视化", "A/B测试"],
  "ai-product": ["Prompt", "AIGC", "大模型", "需求分析", "原型设计", "用户访谈", "竞品分析", "模型评测", "Agent"],
  product: ["需求分析", "原型设计", "用户访谈", "竞品分析", "项目管理", "产品规划", "PRD", "用户体验"],
  frontend: ["JavaScript", "TypeScript", "React", "Vue", "Java", "C++", "Python", "Git", "数据库"],
  growth: ["内容运营", "活动策划", "用户分层", "转化率", "A/B测试", "社群运营", "数据复盘", "用户增长"],
  marketing: ["市场调研", "品牌策划", "新媒体运营", "文案写作", "短视频", "公关传播", "SEO", "媒介投放"],
  sales: ["商务拓展", "客户关系", "谈判", "CRM", "销售分析", "渠道管理", "方案演示", "客户成功"],
  consulting: ["行业研究", "商业分析", "PPT", "Excel", "结构化思维", "案例分析", "战略规划", "项目管理"],
  finance: ["财务分析", "会计", "审计", "成本管理", "Excel", "财务建模", "预算管理", "风险控制"],
  hr: ["招聘", "培训", "绩效管理", "人力资源", "组织发展", "员工关系", "Excel", "活动组织"],
  "supply-chain": ["供应链", "采购", "库存管理", "物流规划", "Excel", "成本管理", "供应商管理", "需求预测"],
  design: ["Figma", "Photoshop", "Illustrator", "用户体验", "交互设计", "视觉设计", "视频剪辑", "作品集"],
  engineering: ["CAD", "机械设计", "硬件", "质量管理", "C++", "项目管理", "结构设计", "生产制造"],
  education: ["教学设计", "课程研发", "课堂管理", "公众表达", "教育心理", "内容制作", "学习规划", "教师资格证"],
  healthcare: ["临床", "护理", "药学", "健康管理", "医学研究", "患者沟通", "数据整理", "执业资格"],
  legal: ["法务", "合同审核", "风险控制", "合规", "法律检索", "知识产权", "文书写作", "英语"],
};

const form = document.querySelector("#profile-form");
const profileInput = document.querySelector("#profile");
const roleInput = document.querySelector("#role");
const cityInput = document.querySelector("#city");
const keywordsInput = document.querySelector("#keywords");
const keywordSuggestions = document.querySelector("#keyword-suggestions");
const resumeInput = document.querySelector("#resume");
const jobList = document.querySelector("#job-list");
const topRole = document.querySelector("#top-role");
const topScore = document.querySelector("#top-score");
const screenScore = document.querySelector("#screen-score");
const topScoreProgress = document.querySelector("#top-score-progress");
const screenScoreProgress = document.querySelector("#screen-score-progress");
const sourceStatus = document.querySelector("#source-status");
const jobSourceNote = document.querySelector("#job-source-note");
const scoreBreakdown = document.querySelector("#score-breakdown");
const resumeActions = document.querySelector("#resume-actions");
const agentLog = document.querySelector("#agent-log");
const statusPill = document.querySelector("#analysis-status");
const toast = document.querySelector("#toast");
const refreshButton = document.querySelector("#refresh-jobs");
const copyActionsButton = document.querySelector("#copy-actions");
const companyFilters = document.querySelector("#company-filters");
const resultCount = document.querySelector("#result-count");
const loadMoreButton = document.querySelector("#load-more-jobs");
const resultsPanel = document.querySelector(".results-panel");

let selectedJobId = null;
let latestRecommendations = [];
let liveJobs = [];
let activeCompany = "全部";
let visibleJobLimit = INITIAL_VISIBLE_JOBS;
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
  let decoded = String(value || "");
  for (let index = 0; index < 3; index += 1) {
    div.innerHTML = decoded;
    const next = div.textContent;
    if (next === decoded) break;
    decoded = next;
  }
  return decoded.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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

function parseKeywords(value) {
  return String(value || "")
    .split(/[,，、；;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readCandidate() {
  const profile = profileInput.value.trim();
  const resume = resumeInput.value.trim();
  const keywords = parseKeywords(keywordsInput.value);

  return {
    profile,
    resume,
    role: roleInput.value,
    city: cityInput.value,
    keywords,
    text: normalizeText(`${profile} ${resume} ${keywords.join(" ")}`),
  };
}

function renderKeywordSuggestions() {
  const selectedKeywords = parseKeywords(keywordsInput.value);
  const selectedNormalized = new Set(selectedKeywords.map(normalizeText));
  const roleSuggestions = keywordSuggestionsByRole[roleInput.value] || keywordSuggestionsByRole.general;
  const suggestions = [...new Set([...commonKeywordSuggestions, ...roleSuggestions])];

  keywordSuggestions.innerHTML = suggestions
    .map((keyword) => {
      const isSelected = selectedNormalized.has(normalizeText(keyword));
      return `
        <button
          class="keyword-chip${isSelected ? " is-selected" : ""}"
          type="button"
          data-keyword="${escapeHtml(keyword)}"
          aria-pressed="${isSelected}"
        >
          ${isSelected ? "已选 " : "+ "}${escapeHtml(keyword)}
        </button>
      `;
    })
    .join("");

  keywordSuggestions.querySelectorAll(".keyword-chip").forEach((button) => {
    button.addEventListener("click", () => {
      const keyword = button.dataset.keyword;
      const current = parseKeywords(keywordsInput.value);
      const exists = current.some((item) => normalizeText(item) === normalizeText(keyword));
      const next = exists
        ? current.filter((item) => normalizeText(item) !== normalizeText(keyword))
        : [...current, keyword];
      keywordsInput.value = next.join(", ");
      renderKeywordSuggestions();
    });
  });
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

function buildSourceLabel(jobs) {
  const companies = new Set(jobs.map((job) => job.company));
  return `${companies.size}家官网 ${jobs.length}岗`;
}

function buildSourceBreakdown(jobs) {
  const counts = jobs.reduce((result, job) => {
    result[job.company] = (result[job.company] || 0) + 1;
    return result;
  }, {});
  return Object.entries(counts)
    .map(([company, count]) => `${company}${count}`)
    .join("、");
}

function matchesRegion(location, preference) {
  const text = normalizeText(location);
  const domesticCities = [
    "中国",
    "北京",
    "上海",
    "深圳",
    "广州",
    "杭州",
    "成都",
    "武汉",
    "南京",
    "西安",
    "苏州",
    "天津",
    "重庆",
    "长沙",
    "厦门",
    "郑州",
    "合肥",
    "青岛",
    "宁波",
    "无锡",
    "珠海",
    "东莞",
  ];
  const isDomestic = domesticCities.some((term) => text.includes(term));
  if (preference === "全国") return isDomestic;
  if (preference === "其他国内") {
    return isDomestic && !["北京", "上海", "深圳", "杭州", "广州", "成都"].some((city) => text.includes(city));
  }
  return text.includes(normalizeText(preference));
}

function inferRoleFromJob(text, title = text) {
  const normalizedTitle = normalizeText(title);
  let titleRole = "unknown";
  let titleScore = 0;
  Object.entries(roleTags).forEach(([role, terms]) => {
    const score = terms
      .filter((term) => normalizedTitle.includes(normalizeText(term)))
      .reduce((total, term) => total + normalizeText(term).replace(/\s+/g, "").length, 0);
    if (score > titleScore) {
      titleRole = role;
      titleScore = score;
    }
  });
  if (titleScore > 0) return titleRole;

  let bestRole = "unknown";
  let bestHits = 0;
  Object.entries(roleTags).forEach(([role, terms]) => {
    const hits = countTextHits(text, terms).length;
    if (hits > bestHits) {
      bestRole = role;
      bestHits = hits;
    }
  });
  return bestHits >= 2 ? bestRole : "unknown";
}

function extractSkills(text) {
  const hits = countTextHits(text, skillLexicon);
  return [...new Set(hits)].slice(0, 8);
}

function normalizeOfficialJob(raw) {
  const description = stripHtml(raw.description);
  const title = raw.title || "Untitled role";
  const company = raw.company || "公司未注明";
  const allText = `${title} ${company} ${description} ${raw.category || ""} ${raw.businessGroup || ""}`;
  const inferredRole = inferRoleFromJob(allText, title);
  const skills = extractSkills(allText);
  const location = raw.location || "地区未注明";

  return {
    id: raw.id,
    title,
    company,
    city: location,
    role: inferredRole,
    skills: skills.length ? skills : ["岗位要求"],
    interests: roleTags[inferredRole]?.slice(0, 3) || [],
    difficulty: 0.13,
    summary: description.slice(0, 138) || `${company}招聘官网暂未提供详细岗位描述。`,
    url: normalizeExternalUrl(raw.url),
    source: raw.source || `${company}招聘官网`,
    publishedAt: raw.updatedAt,
    jobType: raw.jobType || "学生岗位",
    salary: "",
    careersUrl: normalizeExternalUrl(raw.careersUrl),
  };
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

async function fetchJsonWithRetry(url, timeoutMs = 16000, attempts = 2) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fetchJsonWithTimeout(url, timeoutMs);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
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

function setDashboardLoading(isLoading) {
  resultsPanel.classList.toggle("is-loading", isLoading);
  resultsPanel.setAttribute("aria-busy", String(isLoading));
}

function setSourceVisualState(state) {
  resultsPanel.dataset.sourceState = state;
  statusPill.dataset.state = state;
}

function updateKpiProgress(matchScore = 0, resumeScore = 0) {
  topScoreProgress.style.width = `${Math.max(0, Math.min(100, matchScore))}%`;
  screenScoreProgress.style.width = `${Math.max(0, Math.min(100, resumeScore))}%`;
}

async function fetchChinaStudentJobs() {
  const separator = JOBS_DATA_URL.includes("?") ? "&" : "?";
  const data = await fetchJsonWithRetry(`${JOBS_DATA_URL}${separator}v=${Date.now()}`, 12000, 2);
  if (!Array.isArray(data.jobs)) throw new Error("岗位数据格式无效");
  return {
    jobs: data.jobs.map(normalizeOfficialJob).filter((job) => job.url),
    updatedAt: data.updatedAt,
    sources: data.sources || {},
  };
}

async function loadLiveJobs(candidate, force = false) {
  const cached = !force ? readCache(candidate) : null;
  if (cached) {
    liveJobs = cached.jobs;
    sourceMeta = {
      label: buildSourceLabel(liveJobs),
      note: `使用中国大厂官网岗位缓存，最后更新 ${formatSourceTime(cached.loadedAt)}。岗位分布：${buildSourceBreakdown(liveJobs)}。`,
      loadedAt: cached.loadedAt,
      state: "ready",
    };
    return;
  }

  statusPill.textContent = "拉取岗位源";
  sourceStatus.textContent = "连接中";
  refreshButton.disabled = true;
  setSourceVisualState("loading");
  setDashboardLoading(true);

  try {
    const result = await fetchChinaStudentJobs();
    const jobs = result.jobs;

    liveJobs = jobs;
    sourceMeta = jobs.length
      ? {
          label: buildSourceLabel(jobs),
          note: `岗位来自中国大厂官方招聘网站，快照更新于 ${formatSourceTime(result.updatedAt)}。岗位分布：${buildSourceBreakdown(jobs)}。`,
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
      note: `无法读取中国大厂官方岗位快照，页面不会展示编造岗位。请点击“刷新岗位”重试。错误：${error.name === "AbortError" ? "请求超时" : error.message}`,
      loadedAt: Date.now(),
      state: "error",
    };
  } finally {
    refreshButton.disabled = false;
    setDashboardLoading(false);
  }
}

function scoreJob(job, candidate) {
  const skillHits = countHits(candidate, job.skills);
  const interestHits = countHits(candidate, job.interests);
  const roleTextHits = countTextHits(`${job.title} ${job.summary}`, roleTags[candidate.role] || []).length;
  const roleFit =
    candidate.role === "general" ? 10 : candidate.role === job.role ? 20 : Math.min(14, roleTextHits * 5);
  const cityFit = matchesRegion(job.city, candidate.city) ? 10 : 2;
  const domesticBoost = matchesRegion(job.city, "全国") ? 5 : 0;
  const skillScore = Math.round((skillHits.length / Math.max(1, job.skills.length)) * 32);
  const interestScore = Math.min(14, interestHits.length * 6);
  const evidenceScore = hasQuantifiedEvidence(candidate.resume) ? 9 : 4;
  const keywordBoost = Math.min(8, candidate.keywords.filter((word) => normalizeText(`${job.title} ${job.summary}`).includes(normalizeText(word))).length * 2);
  const freshnessBoost = job.publishedAt && Date.now() - new Date(job.publishedAt).getTime() < 1000 * 60 * 60 * 24 * 21 ? 5 : 2;
  const penalty = Math.round(job.difficulty * 12);
  const total = Math.max(
    24,
    Math.min(
      98,
      skillScore +
        interestScore +
        roleFit +
        cityFit +
        domesticBoost +
        evidenceScore +
        keywordBoost +
        freshnessBoost -
        penalty
    )
  );

  return {
    ...job,
    score: total,
    skillHits,
    interestHits,
    missingSkills: job.skills.filter((skill) => !skillHits.includes(skill)).slice(0, 3),
    fit: {
      "技能覆盖": `${skillHits.length}/${job.skills.length}`,
      "方向贴合":
        candidate.role === "general"
          ? "综合探索"
          : roleFit >= 18
          ? "高度相关"
          : roleFit >= 10
          ? "可转向"
          : `更偏${roleLabels[job.role] || "其他方向"}`,
      "岗位来源": job.company,
      "发布时间": formatDate(job.publishedAt),
    },
  };
}

function scoreResume(job, candidate) {
  const skillHits = countHits(candidate, job.skills);
  const projectEvidence = /项目|看板|原型|访谈|活动|组件|系统|平台/.test(candidate.resume) ? 78 : 42;
  const quantified = hasQuantifiedEvidence(candidate.resume) ? 86 : 48;
  const roleIntent = candidate.role === "general" ? 74 : candidate.role === job.role ? 86 : 62;
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
  const roleAdvice = {
    data: "把数据口径、分析方法、核心指标和业务结论连起来写。",
    "ai-product": "把用户问题、模型能力、评测方式和产品结果写成一条完整链路。",
    product: "写清需求来源、方案取舍、项目协作和最终交付结果。",
    frontend: "补充技术选型、工程实现、性能优化或质量保障细节。",
    growth: "把用户分层、运营动作、转化指标和复盘结论写清楚。",
    marketing: "展示目标人群、传播策略、内容产出和曝光转化结果。",
    sales: "写清客户需求、跟进过程、解决方案和成交或留存结果。",
    consulting: "用问题拆解、研究过程、分析框架和建议落地证明结构化能力。",
    finance: "补充报表分析、预算成本、审计核对或风险识别的具体证据。",
    hr: "写清招聘培训、员工沟通、活动组织或效率提升的实际结果。",
    "supply-chain": "展示采购、库存、物流、供应商或成本效率的优化过程。",
    design: "用作品目标、设计过程、用户反馈和迭代结果证明设计能力。",
    engineering: "写清工程约束、设计验证、质量指标和问题解决过程。",
    education: "补充教学对象、课程设计、授课方法和学习效果反馈。",
    healthcare: "突出专业规范、服务对象、操作流程和安全质量意识。",
    legal: "补充法规检索、合同审核、风险识别和合规建议的实践证据。",
  };
  const roleLine =
    roleAdvice[job.role] || "根据岗位原文补充最关键的项目证据，并删除与岗位无关的泛化描述。";

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

function renderCompanyFilters() {
  const preferredOrder = ["腾讯", "字节跳动", "京东", "网易", "联想"];
  const counts = liveJobs.reduce((result, job) => {
    result[job.company] = (result[job.company] || 0) + 1;
    return result;
  }, {});
  const companies = preferredOrder.filter((company) => counts[company]);

  companyFilters.innerHTML = ["全部", ...companies]
    .map((company) => {
      const count = company === "全部" ? liveJobs.length : counts[company];
      return `
        <button
          class="company-filter${activeCompany === company ? " is-active" : ""}"
          type="button"
          data-company="${escapeHtml(company)}"
          aria-pressed="${activeCompany === company}"
        >
          ${escapeHtml(company)} <span>${count}</span>
        </button>
      `;
    })
    .join("");

  companyFilters.querySelectorAll(".company-filter").forEach((button) => {
    button.addEventListener("click", () => {
      activeCompany = button.dataset.company;
      visibleJobLimit = INITIAL_VISIBLE_JOBS;
      selectedJobId = null;
      render(readCandidate());
    });
  });
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
  updateKpiProgress();
  sourceStatus.textContent = sourceMeta.label;
  jobSourceNote.textContent = sourceMeta.note;
  statusPill.textContent = sourceMeta.state === "error" ? "连接失败" : "暂无结果";
  setSourceVisualState(sourceMeta.state);
  copyActionsButton.disabled = true;
  resultCount.textContent = "暂无可展示岗位";
  companyFilters.innerHTML = "";
  loadMoreButton.hidden = true;
  latestRecommendations = [];
  selectedJobId = null;

  jobList.innerHTML = `
    <div class="empty-state">
      <h3>没有展示任何模拟岗位</h3>
      <p>${escapeHtml(sourceMeta.note)}</p>
      <div class="official-source-links">
        ${CHINA_CAREER_PORTALS.map(
          (portal) =>
            `<a href="${portal.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(portal.company)}校招</a>`
        ).join("")}
      </div>
    </div>
  `;
  scoreBreakdown.innerHTML = '<p class="empty-copy">获取到真实岗位后，这里会展示针对该岗位的简历命中率。</p>';
  resumeActions.innerHTML = "<li>先刷新岗位源，或直接进入上方公司官方 Careers 页面查看职位。</li>";
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

  renderCompanyFilters();
  const allRecommendations = liveJobs.map((job) => scoreJob(job, candidate)).sort((a, b) => b.score - a.score);
  if (activeCompany !== "全部" && !allRecommendations.some((job) => job.company === activeCompany)) {
    activeCompany = "全部";
    renderCompanyFilters();
  }
  const recommendations =
    activeCompany === "全部"
      ? allRecommendations
      : allRecommendations.filter((job) => job.company === activeCompany);
  latestRecommendations = recommendations;
  const visibleRecommendations = recommendations.slice(0, visibleJobLimit);

  if (!visibleRecommendations.some((job) => job.id === selectedJobId)) {
    selectedJobId = visibleRecommendations[0]?.id || recommendations[0].id;
  }

  const selectedJob = recommendations.find((job) => job.id === selectedJobId) || recommendations[0];
  const resumeScore = scoreResume(selectedJob, candidate);
  const actions = buildActions(selectedJob, candidate, resumeScore);

  topRole.textContent = `${recommendations[0].title}`;
  topScore.textContent = `${recommendations[0].score}`;
  screenScore.textContent = `${resumeScore.total}`;
  updateKpiProgress(recommendations[0].score, resumeScore.total);
  sourceStatus.textContent = sourceMeta.label;
  jobSourceNote.textContent = sourceMeta.note;
  statusPill.textContent = "真实岗位源";
  setSourceVisualState("ready");
  copyActionsButton.disabled = false;
  resultCount.textContent = `展示 ${visibleRecommendations.length} / ${recommendations.length} 个匹配岗位`;
  loadMoreButton.hidden = visibleRecommendations.length >= recommendations.length;

  renderJobs(visibleRecommendations, candidate);
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
  const validRoles = Array.from(roleInput.options).map((option) => option.value);
  roleInput.value = validRoles.includes(values.role) ? values.role : "general";
  const validCities = Array.from(cityInput.options).map((option) => option.value);
  cityInput.value = validCities.includes(values.city) ? values.city : "全国";
  keywordsInput.value = values.keywords;
  resumeInput.value = values.resume;
  renderKeywordSuggestions();
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
  visibleJobLimit = INITIAL_VISIBLE_JOBS;
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
  visibleJobLimit = INITIAL_VISIBLE_JOBS;
  const nextTop = liveJobs.map((job) => scoreJob(job, candidate)).sort((a, b) => b.score - a.score)[0];
  selectedJobId = nextTop?.id || null;
  render(candidate);
  showToast("已按实时岗位源更新匹配顺序。");
});

refreshButton.addEventListener("click", async () => {
  await refreshJobs(true);
  showToast("岗位源已刷新。");
});

loadMoreButton.addEventListener("click", () => {
  visibleJobLimit += LOAD_MORE_STEP;
  render(readCandidate());
});

roleInput.addEventListener("change", renderKeywordSuggestions);
keywordsInput.addEventListener("input", renderKeywordSuggestions);

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
