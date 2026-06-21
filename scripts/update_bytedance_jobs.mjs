import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const moduleName = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = require(moduleName);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "data", "bytedance-jobs.json");
const jobs = new Map();

function normalizeJob(raw) {
  const cities = (raw.city_list || [])
    .map((city) => city.i18n_name || city.name)
    .filter(Boolean);
  const jobType = raw.recruit_type?.i18n_name || raw.recruit_type?.name || "校园招聘";
  return {
    id: `bytedance-${raw.id}`,
    title: raw.title || "未命名岗位",
    company: "字节跳动",
    location: cities.join(" / ") || raw.city_info?.i18n_name || "地点未注明",
    category: raw.job_category?.i18n_name || raw.job_category?.name || "其他",
    businessGroup: raw.job_subject?.name?.i18n || raw.job_subject?.name?.zh_cn || "",
    description: `${raw.description || ""}\n${raw.requirement || ""}`,
    updatedAt: raw.publish_time ? new Date(raw.publish_time).toISOString().slice(0, 10) : "",
    jobType: jobType === "实习" ? "实习岗位" : "校园招聘",
    url: `https://jobs.bytedance.com/campus/position/${raw.id}/detail`,
    source: "字节跳动校园招聘官网",
    careersUrl: "https://jobs.bytedance.com/campus/position",
  };
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

page.on("response", async (response) => {
  if (response.status() !== 200 || !response.url().includes("/api/v1/search/job/posts")) return;
  try {
    const payload = await response.json();
    for (const raw of payload?.data?.job_post_list || []) {
      const job = normalizeJob(raw);
      jobs.set(job.id, job);
    }
  } catch {
    // A later page response can still complete the snapshot.
  }
});

await page.goto("https://jobs.bytedance.com/campus/position", {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await page.waitForTimeout(7000);

for (let pageNumber = 2; pageNumber <= 5; pageNumber += 1) {
  const item = page.locator(`.atsx-pagination-item-${pageNumber}`);
  if ((await item.count()) === 0) break;
  await item.first().click();
  await page.waitForTimeout(2500);
}

await browser.close();

const payload = {
  source: "字节跳动校园招聘官网",
  updatedAt: new Date().toISOString(),
  jobs: [...jobs.values()],
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(payload, null, 2), "utf8");
console.log(`Wrote ${payload.jobs.length} jobs to ${output}`);
