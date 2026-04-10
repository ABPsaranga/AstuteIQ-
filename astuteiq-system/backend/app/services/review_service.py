from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.repositories.review_repository import create_review
from app.utils.claude_client import run_claude_review
from app.utils.file_handler import validate_file_type


async def process_review(
    db: Session,
    user_id: int,
    mode: str,
    soa_file: UploadFile,
    reference_file: UploadFile | None,
    supporting_files: list[UploadFile] | None,
) -> dict:
    if mode not in {"quick", "full"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mode must be 'quick' or 'full'",
        )

    all_files = [soa_file]
    if reference_file:
        all_files.append(reference_file)
    if supporting_files:
        all_files.extend(supporting_files)

    for file in all_files:
        if not validate_file_type(file):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file.filename}",
            )

    filenames = [f.filename for f in all_files if f.filename]
    result = await run_claude_review(mode=mode, filenames=filenames)

    create_review(
        db=db,
        user_id=user_id,
        client_name=result.get("client_name"),
        adviser_name=result.get("adviser_name"),
        practice_name=result.get("practice_name"),
        advice_type=result.get("advice_type"),
        review_mode=result.get("mode", mode),
        risk_level=result.get("risk_level"),
        result_data=result,
    )

    return result
