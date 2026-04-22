from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.analyzer import extract_blocks, analyze_with_gpt

router = APIRouter()


@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    try:
        content = await file.read()

        pages_data = extract_blocks(content)
        issues = analyze_with_gpt(pages_data)

        return {"issues": issues}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))