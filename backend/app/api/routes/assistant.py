from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(
    prefix="/assistant",
    tags=["Assistant"],
)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


ASTUTEIQ_KNOWLEDGE = {
    "soa": (
        "SOA Analysis reviews Statements of Advice and highlights "
        "potential compliance risks, missing disclosures and quality issues."
    ),
    "asic": (
        "AstuteIQ assists advisers in reviewing documents against "
        "ASIC regulatory expectations including RG175 guidance."
    ),
    "review": (
        "Upload a document in Run Review. AstuteIQ extracts content, "
        "evaluates compliance risks and generates findings."
    ),
    "privacy": (
        "Uploaded files are processed securely and access is restricted "
        "to authorised users."
    ),
    "billing": (
        "Billing information and subscription management are available "
        "from the Billing section."
    ),
    "dashboard": (
        "The dashboard provides compliance metrics, review history, "
        "usage statistics and activity summaries."
    ),
}


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):

    message = request.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty"
        )

    query = message.lower()

    for keyword, answer in ASTUTEIQ_KNOWLEDGE.items():
        if keyword in query:
            return ChatResponse(reply=answer)

    return ChatResponse(
        reply=(
            "I'm the AstuteIQ Assistant. "
            "I can help with SOA Analysis, ASIC compliance reviews, "
            "billing, dashboards, review workflows, and platform usage."
        )
    )