import threading
from app.services.review_engine import run_review_job


def start_review_worker(job_id: str):
    thread = threading.Thread(target=run_review_job, args=(job_id,))
    thread.start()