from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.review_service import process_review

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("/run")
async def run_review(
    mode: str = Form(...),
    soa_file: UploadFile = File(...),
    reference_file: UploadFile | None = File(None),
    supporting_files: list[UploadFile] | None = File(None),
    db: Session = Depends(get_db),
):
    # Temporary user_id until JWT auth middleware/dependency is added.
    result = await process_review(
        db=db,
        user_id=1,
        mode=mode,
        soa_file=soa_file,
        reference_file=reference_file,
        supporting_files=supporting_files,
    )
    return {"message": "Review completed successfully", "data": result}
