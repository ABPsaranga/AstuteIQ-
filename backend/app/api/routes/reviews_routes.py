from fastapi import APIRouter, UploadFile, File
from app.utils.pdf_parser import extract_text_from_pdf
from app.services.ai_service import analyze_soa

router = APIRouter()


@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    contents = await file.read()

    text = extract_text_from_pdf(contents)

    issues = analyze_soa(text)

    return {
        "issues": issues
    }