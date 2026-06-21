from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "tencent-jobs.json"
API_URL = "https://careers.tencent.com/tencentcareer/api/post/Query"


def fetch_jobs(attr_id: int) -> list[dict]:
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
    request = urllib.request.Request(
        f"{API_URL}?{urllib.parse.urlencode(params)}",
        headers={"User-Agent": "Offer-Catcher/1.0"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.load(response)

    posts = payload.get("Data", {}).get("Posts", [])
    job_type = "校园招聘" if attr_id == 2 else "实习岗位"
    return [normalize_job(post, job_type) for post in posts if post.get("IsValid", True)]


def normalize_job(post: dict, job_type: str) -> dict:
    raw_url = str(post.get("PostURL") or "").replace("https:////", "https://")
    date_text = str(post.get("LastUpdateTime") or "")
    match = re.search(r"(\d{4})年(\d{2})月(\d{2})日", date_text)
    updated_at = f"{match.group(1)}-{match.group(2)}-{match.group(3)}" if match else date_text

    return {
        "id": str(post.get("PostId") or post.get("RecruitPostId") or ""),
        "title": str(post.get("RecruitPostName") or "未命名岗位"),
        "company": "腾讯",
        "location": str(post.get("LocationName") or "地点未注明"),
        "category": str(post.get("CategoryName") or "其他"),
        "businessGroup": str(post.get("BGName") or ""),
        "description": str(post.get("Responsibility") or ""),
        "updatedAt": updated_at,
        "jobType": job_type,
        "url": raw_url,
    }


def main() -> None:
    jobs = fetch_jobs(2) + fetch_jobs(3)
    unique_jobs = {}
    for job in jobs:
        if job["id"] and job["url"].startswith("https://"):
            unique_jobs[job["id"]] = job

    payload = {
        "source": "腾讯招聘官网",
        "sourceUrl": "https://careers.tencent.com/",
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "jobs": list(unique_jobs.values()),
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(payload['jobs'])} jobs to {OUTPUT}")


if __name__ == "__main__":
    main()
