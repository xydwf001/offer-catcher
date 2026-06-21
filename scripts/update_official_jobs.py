from __future__ import annotations

import html
import json
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "china-jobs.json"
BYTEDANCE_SNAPSHOT = ROOT / "data" / "bytedance-jobs.json"
USER_AGENT = "Offer-Catcher/2.0 (+https://github.com/xydwf001/offer-catcher)"


def fetch_json(url: str, *, data: dict | None = None, referer: str = "") -> dict:
    encoded = None
    headers = {
        "Accept": "application/json",
        "User-Agent": USER_AGENT,
    }
    if referer:
        headers["Referer"] = referer
    if data is not None:
        encoded = json.dumps(data, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"

    request = urllib.request.Request(url, data=encoded, headers=headers)
    with urllib.request.urlopen(request, timeout=35) as response:
        return json.load(response)


def fetch_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=35) as response:
        return response.read().decode("utf-8", errors="replace")


def clean_text(value: object) -> str:
    text = html.unescape(str(value or ""))
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def iso_from_millis(value: object) -> str:
    try:
        return datetime.fromtimestamp(int(value) / 1000, timezone.utc).date().isoformat()
    except (TypeError, ValueError, OSError):
        return ""


def fetch_tencent_jobs() -> list[dict]:
    api_url = "https://careers.tencent.com/tencentcareer/api/post/Query"
    jobs = []
    for attr_id, job_type in ((2, "校园招聘"), (3, "实习岗位")):
        params = {
            "timestamp": str(int(time.time() * 1000)),
            "countryId": "",
            "cityId": "",
            "bgIds": "",
            "productId": "",
            "categoryId": "",
            "parentCategoryId": "",
            "attrId": str(attr_id),
            "keyword": "",
            "pageIndex": "1",
            "pageSize": "100",
            "language": "zh-cn",
            "area": "cn",
        }
        payload = fetch_json(f"{api_url}?{urllib.parse.urlencode(params)}")
        for post in payload.get("Data", {}).get("Posts", []):
            if not post.get("IsValid", True):
                continue
            raw_url = str(post.get("PostURL") or "").replace("https:////", "https://")
            date_text = str(post.get("LastUpdateTime") or "")
            date_match = re.search(r"(\d{4})年(\d{2})月(\d{2})日", date_text)
            jobs.append(
                {
                    "id": f"tencent-{post.get('PostId') or post.get('RecruitPostId')}",
                    "title": str(post.get("RecruitPostName") or "未命名岗位"),
                    "company": "腾讯",
                    "location": str(post.get("LocationName") or "地点未注明"),
                    "category": str(post.get("CategoryName") or "其他"),
                    "businessGroup": str(post.get("BGName") or ""),
                    "description": str(post.get("Responsibility") or ""),
                    "updatedAt": (
                        f"{date_match.group(1)}-{date_match.group(2)}-{date_match.group(3)}"
                        if date_match
                        else date_text
                    ),
                    "jobType": job_type,
                    "url": raw_url,
                    "source": "腾讯招聘官网",
                    "careersUrl": "https://careers.tencent.com/",
                }
            )
    return jobs


def fetch_jd_jobs() -> list[dict]:
    api_url = "https://campus.jd.com/api/wx/position/page"
    request_body = {
        "pageSize": 50,
        "pageIndex": 0,
        "parameter": {
            "positionName": "",
            "planIdList": [],
            "jobDirectionCodeList": [],
            "workCityCodeList": [],
            "positionDeptList": [],
        },
    }
    jobs = []
    for source_type, job_type in (
        ("present", "校园招聘"),
        ("internship", "实习岗位"),
        ("talent", "专项计划"),
    ):
        payload = fetch_json(
            f"{api_url}?type={source_type}",
            data=request_body,
            referer="https://campus.jd.com/#/jobs",
        )
        for item in payload.get("body", {}).get("items", []):
            requirements = item.get("requirementVoList") or []
            locations = list(
                dict.fromkeys(str(row.get("workCity") or "") for row in requirements if row.get("workCity"))
            )
            groups = list(
                dict.fromkeys(str(row.get("positionBg") or "") for row in requirements if row.get("positionBg"))
            )
            jobs.append(
                {
                    "id": f"jd-{item.get('publishId')}",
                    "title": str(item.get("positionName") or "未命名岗位"),
                    "company": "京东",
                    "location": " / ".join(locations[:5]) or "地点未注明",
                    "category": str(item.get("jobCategory") or item.get("jobDirection") or "其他"),
                    "businessGroup": " / ".join(groups[:4]),
                    "description": f"{item.get('workContent') or ''}\n{item.get('qualification') or ''}",
                    "updatedAt": iso_from_millis(item.get("publishTime")),
                    "jobType": job_type,
                    "url": "https://campus.jd.com/#/jobs",
                    "source": "京东校招官网",
                    "careersUrl": "https://campus.jd.com/",
                }
            )
    return jobs


def fetch_netease_jobs() -> list[dict]:
    jobs = []
    for project_id, job_type in ((69, "校园招聘"), (76, "精英实习")):
        params = urllib.parse.urlencode(
            {
                "pageSize": 50,
                "currentPage": 1,
                "projectId": project_id,
                "timeStamp": int(time.time() * 1000),
            }
        )
        payload = fetch_json(
            f"https://campus.163.com/api/campuspc/position/getJobList?{params}",
            referer=f"https://campus.163.com/app/job/position?id={project_id}",
        )
        for item in payload.get("data", {}).get("list", []):
            jobs.append(
                {
                    "id": f"netease-campus-{item.get('id')}",
                    "title": str(item.get("positionName") or "未命名岗位"),
                    "company": "网易",
                    "location": str(item.get("workPlaceName") or "地点未注明"),
                    "category": str(item.get("positionTypeName") or "其他"),
                    "businessGroup": "",
                    "description": f"{item.get('positionDescription') or ''}\n{item.get('positionRequirement') or ''}",
                    "updatedAt": str(item.get("updateTime") or ""),
                    "jobType": job_type,
                    "url": (
                        "https://campus.163.com/app/detail/index"
                        f"?id={item.get('id')}&projectId={project_id}"
                    ),
                    "source": "网易校园招聘官网",
                    "careersUrl": "https://campus.163.com/",
                }
            )

    payload = fetch_json(
        "https://hr.163.com/api/hr163/position/queryPage",
        data={"currentPage": 1, "pageSize": 50, "workType": "1"},
        referer="https://hr.163.com/job-list.html?workType=1",
    )
    for item in payload.get("data", {}).get("list", []):
        locations = item.get("workPlaceNameList") or []
        jobs.append(
            {
                "id": f"netease-intern-{item.get('id')}",
                "title": str(item.get("name") or "未命名岗位"),
                "company": "网易",
                "location": " / ".join(str(value) for value in locations) or "地点未注明",
                "category": str(item.get("firstPostTypeName") or "其他"),
                "businessGroup": str(item.get("productName") or item.get("firstDepName") or ""),
                "description": f"{item.get('description') or ''}\n{item.get('requirement') or ''}",
                "updatedAt": iso_from_millis(item.get("updateTime")),
                "jobType": "日常实习",
                "url": f"https://hr.163.com/job-detail.html?id={item.get('id')}",
                "source": "网易招聘官网",
                "careersUrl": "https://hr.163.com/job-list.html?workType=1",
            }
        )
    return jobs


def fetch_lenovo_jobs() -> list[dict]:
    jobs = []
    for offset in (0, 10, 20, 30, 40):
        url = (
            "https://jobs.lenovo.com/zh_CN/careers/SearchJobs/"
            f"?jobRecordsPerPage=10&jobOffset={offset}"
        )
        content = fetch_text(url)
        article_pattern = re.compile(
            r'<h3[^>]*class="[^"]*article__header__text__title[^"]*"[^>]*>\s*'
            r'<a href="(?P<url>[^"]+)">\s*(?P<title>.*?)\s*</a>[\s\S]*?'
            r'<span class="paragraph">\s*(?P<category>.*?)\s*</span>[\s\S]*?'
            r'<div class="article__header__text__subtitle">(?P<meta>[\s\S]*?)</div>',
            re.IGNORECASE,
        )
        for match in article_pattern.finditer(content):
            meta = clean_text(match.group("meta"))
            location_match = re.search(r"(中国[^职]+?)\s+职位编号", meta)
            code_match = re.search(r"职位编号:\s*([^\s]+)", meta)
            date_match = re.search(r"已发布\s+([0-9]{1,2}-[A-Za-z]{3}-[0-9]{4})", meta)
            if not location_match:
                continue
            jobs.append(
                {
                    "id": f"lenovo-{code_match.group(1) if code_match else len(jobs)}",
                    "title": clean_text(match.group("title")),
                    "company": "联想",
                    "location": clean_text(location_match.group(1)),
                    "category": clean_text(match.group("category")),
                    "businessGroup": "",
                    "description": clean_text(match.group("category")),
                    "updatedAt": date_match.group(1) if date_match else "",
                    "jobType": "社会招聘",
                    "url": html.unescape(match.group("url")),
                    "source": "联想招聘官网",
                    "careersUrl": "https://jobs.lenovo.com/zh_CN/careers",
                }
            )
    return jobs


def load_bytedance_snapshot() -> list[dict]:
    if not BYTEDANCE_SNAPSHOT.exists():
        return []
    payload = json.loads(BYTEDANCE_SNAPSHOT.read_text(encoding="utf-8"))
    return payload.get("jobs", [])


def main() -> None:
    fetchers = {
        "腾讯": fetch_tencent_jobs,
        "京东": fetch_jd_jobs,
        "网易": fetch_netease_jobs,
        "联想": fetch_lenovo_jobs,
    }
    jobs = []
    errors = {}
    for company, fetcher in fetchers.items():
        try:
            company_jobs = fetcher()
            jobs.extend(company_jobs)
            print(f"{company}: {len(company_jobs)}")
        except Exception as error:  # Keep the last valid snapshot if one source changes.
            errors[company] = str(error)
            print(f"{company}: ERROR {error}")

    bytedance_jobs = load_bytedance_snapshot()
    jobs.extend(bytedance_jobs)
    print(f"字节跳动: {len(bytedance_jobs)}")

    unique_jobs = {}
    for job in jobs:
        if job.get("id") and str(job.get("url") or "").startswith("https://"):
            unique_jobs[str(job["id"])] = job

    ordered_jobs = sorted(
        unique_jobs.values(),
        key=lambda job: (str(job.get("updatedAt") or ""), str(job.get("company") or "")),
        reverse=True,
    )
    source_counts = {}
    for job in ordered_jobs:
        source_counts[job["company"]] = source_counts.get(job["company"], 0) + 1

    payload = {
        "source": "中国大厂官方招聘网站",
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "sources": source_counts,
        "errors": errors,
        "jobs": ordered_jobs,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(ordered_jobs)} jobs to {OUTPUT}")


if __name__ == "__main__":
    main()
