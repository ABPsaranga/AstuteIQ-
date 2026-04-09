from app.core.config import settings


async def run_claude_review(mode: str, filenames: list[str]) -> dict:
    # Placeholder response. Replace this with real Anthropic API integration.
    return {
        "client_name": "Sample Client",
        "adviser_name": "Sample Adviser",
        "practice_name": "Sample Practice",
        "advice_type": "Superannuation",
        "date": "2026-04-09",
        "summary": f"Initial backend test response using model {settings.anthropic_model}.",
        "risk_level": "MEDIUM",
        "docs_reviewed": filenames,
        "mode": mode,
        "checks": [
            {
                "id": "C1",
                "area": "compliance",
                "label": "Fee disclosure present",
                "status": "pass",
                "note": "Verified in uploaded draft.",
            },
            {
                "id": "P1",
                "area": "personalisation",
                "label": "Advice tailored to client goals",
                "status": "warning",
                "note": "Needs clearer reference to client-specific goals.",
            },
        ],
    }
