import asyncio
from sqlalchemy.orm import Session

from app.models.review import Review
from app.services.analyzer import analyze_document
from app.core.ws_manager import ws_manager


async def process_review(review_id: str, file_path: str, db: Session):
    try:
        #  run AI analysis
        result = await analyze_document(file_path, review_id)

        review = db.query(Review).filter(Review.id == review_id).first()

        review.findings = result["findings"]
        review.severity = result["severity"]
        review.status = "done"

        db.commit()

        # 🚀 PUSH TO FRONTEND (THIS IS WHAT YOU WERE MISSING)
        await ws_manager.send(review_id, {
            "type": "completed",
            "data": {
                "findings": review.findings,
                "severity": review.severity,
            }
        })

    except Exception as e:
        print("Analysis failed:", e)

        await ws_manager.send(review_id, {
            "type": "error",
            "message": str(e)
        })