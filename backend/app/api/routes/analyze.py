from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.analyzer import extract_blocks, analyze_with_gpt

router = APIRouter()


@router.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):

    # ✅ FIX: safe filename check
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    try:
        # ✅ read file
        content = await file.read()

        if not content:
            raise HTTPException(status_code=400, detail="Empty file")

        # ✅ extract + analyze
        pages_data = extract_blocks(content)
        issues = analyze_with_gpt(pages_data)

        return {
            "success": True,
            "total_issues": len(issues),
            "issues": issues,
        }

    except HTTPException:
        raise

    except Exception as e:
        print("❌ Analyze error:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")