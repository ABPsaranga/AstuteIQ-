from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.analyzer import extract_blocks, analyze_with_gpt

router = APIRouter()


@router.post("/analyze")
async def analyze_document(file_path: str):
    # TODO: plug your real LLM here

    return {
        "severity": "High Risk",
        "findings": [
            {
                "id": "1",
                "category": "Compliance",
                "title": "Example issue",
                "detail": "Detected issue from document",
                "markedIncorrect": False,
            }
        ],
    }