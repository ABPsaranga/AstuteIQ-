from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from app.repositories.review_repository import create_review
from app.utils.file_handler import (
    extract_file_bytes,
    validate_file_type,
    basic_malware_scan,
)
from app.utils.claude_client import run_claude_review


async def process_review(
    db: Session,
    user_id: int,
    mode: str,
    soa_file: UploadFile | None = None,
    reference_files: list[UploadFile] | None = None,
    supporting_files: list[UploadFile] | None = None,
) -> dict:

    if mode not in {"QUICK", "FULL"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid mode. Must be 'QUICK' or 'FULL'",
        )

    all_files: list[UploadFile] = []

    if soa_file:
        all_files.append(soa_file)
    if reference_files:
        all_files.extend(reference_files)
    if supporting_files:
        if len(supporting_files) > 10:
            raise HTTPException(
                status_code=400,
                detail="Too many supporting files (max 10)",
            )
        all_files.extend(supporting_files)

    processed_files: list[dict] = []

    for upload in all_files:
        if not upload.filename:
            raise HTTPException(status_code=400, detail="Missing filename")

        file_bytes = await extract_file_bytes(upload)

        # ✅ MIME validation
        if not validate_file_type(upload.filename, file_bytes):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {upload.filename}",
            )

        # ✅ Basic malware scan
        if not basic_malware_scan(file_bytes):
            raise HTTPException(
                status_code=400,
                detail=f"Suspicious file detected: {upload.filename}",
            )

        processed_files.append({
            "filename": upload.filename,
            "content_type": upload.content_type or "application/octet-stream",
            "size": len(file_bytes),
            "content": file_bytes,
        })

    result = await run_claude_review(mode=mode, files=processed_files)

    create_review(
        db=db,
        user_id=user_id,
        client_name=result["client_name"],
        advisor_name=result.get("advisor_name", "Unknown"),
        advice_type=mode,
        review_model="claude-3",
        risk_level=result.get("risk_score", 0),
        result_data=result,
        summary=result.get("summary", ""),
        practice_name=result.get("practice_name", "Unknown"),
    )

    return result