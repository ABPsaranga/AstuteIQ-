import time
from app.jobs.job_store import jobs


def run_review_job(job_id: str):
    try:
        # simulate processing
        for i in range(1, 6):
            time.sleep(2)
            jobs[job_id]["progress"] = i * 20

        # final result
        jobs[job_id]["status"] = "done"
        jobs[job_id]["result"] = {
            "score": 87,
            "findings": [
                {
                    "id": "1",
                    "title": "Missing Clause",
                    "status": "fail",
                    "message": "Important clause missing",
                },
                {
                    "id": "2",
                    "title": "Formatting Issue",
                    "status": "warning",
                    "message": "Formatting inconsistent",
                },
                {
                    "id": "3",
                    "title": "Valid Section",
                    "status": "pass",
                    "message": "Section is correct",
                },
            ],
        }

    except Exception as e:
        jobs[job_id]["status"] = "error"
        jobs[job_id]["error"] = str(e)