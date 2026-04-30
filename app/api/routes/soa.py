import os
import json
from typing import Any, AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic
from app.core.deps import get_current_user

router = APIRouter()


class DocumentPart(BaseModel):
    type:    str
    label:   str
    content: str


class SOAReviewRequest(BaseModel):
    mode:      str
    documents: list[DocumentPart]


# ── System prompts ────────────────────────────────────────────────────────────

def _build_system_prompt(mode: str, has_ref: bool) -> str:
    calib = (
        "CALIBRATION FROM REAL REVIEWED SOAs:\n"
        "C-EX1 FAIL: Salary sacrifice stated $52,000pa — correct was $5,200pa. Variance >5% = FAIL.\n"
        "C-EX3 FAIL: Better position 'your super will grow' — no client-specific figures. FAIL.\n"
        "C-EX4 FAIL: Age Pension $29,868 vs correct $35,246 — 18% variance. FAIL.\n"
        "C-EX9 FAIL: Risk profile change discussed but SOA used old profile.\n"
        "C-EX11 WARNING: AA variance >15% unexplained. WARNING if 10-15%.\n\n"
    )

    if mode == "quick":
        return (
            "You are a senior Australian financial planning compliance expert at AstuteIQ. "
            "Run a QUICK CHECK on this SOA.\n\n"
            "BALANCE VARIANCE RULE: ≤5% variance = PASS. >5% = FAIL with exact figures.\n\n"
            "Check ONLY:\n"
            "AREA 1 — CONSISTENCY: All monetary figures. Flag mismatches >5% as FAIL.\n"
            "AREA 2 — KEY COMPLIANCE: C1 numbers match, C2 balances consistent, C3 better position, "
            "C6 basis of advice, C9 platform fee justification, C10 PDS dates, C11 AA variances, "
            "C12 CGT, C14 fee changes, C16 fee totals, C19 required warnings, C21 product comparison, C25 fee disclosure.\n"
            "AREA 3 — PERSONALISATION: P7 generic language, P8 better position specificity.\n\n"
            "Only return FAIL and WARNING. Omit PASS entirely.\n\n"
            + calib +
            'Return ONLY valid JSON:\n'
            '{"client_name":"...","adviser_name":"...","practice_name":"...","advice_type":"...","date":"...",'
            '"summary":"CONSISTENCY: [mismatches or CLEAR].\\nCOMPLIANCE: [gaps or CLEAR].\\nPERSONALISATION: [issues or CLEAR].\\nPriority fixes: [top 3].",'
            '"risk_level":"LOW, MEDIUM, or HIGH","docs_reviewed":["..."],"mode":"quick",'
            '"checks":[{"id":"...","area":"consistency|compliance|personalisation","label":"short label","status":"fail|warning","note":"2-3 sentences."}]}'
        )

    structure = (
        "AREA 2 — STRUCTURE: Compare every section against the reference SOA." if has_ref else
        "AREA 2 — STRUCTURE: Check all critical sections are present: exec summary, personal circumstances, "
        "goals, scope, strategy rationale, product recommendations, fee disclosures, alternatives, implementation, appendices."
    )

    return (
        "You are a senior Australian financial planning compliance expert at AstuteIQ.\n\n"
        "CRITICAL: Produce checks for EVERY item C1-C29 and P1-P10. Fewer than 39 checks = incomplete.\n"
        "BALANCE VARIANCE RULE: ≤5% = PASS (note it). >5% = FAIL with exact figures.\n\n"
        "AREA 1 — CONSISTENCY: All monetary figures, names, dates, risk profiles across every document.\n"
        + structure + "\n"
        "AREA 3 — PERSONALISATION (P1-P10):\n"
        "P1 life stage/age, P2 family situation, P3 occupation/income, P4 goals with timeframes/amounts,\n"
        "P5 risk profile threaded through, P6 existing balances quantify benefit,\n"
        "P7 specific rationale (quote generic phrases), P8 better position with figures,\n"
        "P9 recommendations linked to goals, P10 quote all template language.\n\n"
        "AREA 4 — COMPLIANCE (C1-C29):\n"
        "C1 numbers match, C2 balances (5% tol), C3 better position with figures, C4 goals mapped,\n"
        "C5 no repeated points, C6 basis of advice, C7 reasons/advantages/disadvantages/alternatives,\n"
        "C8 numbers consistent, C9 platform cost justified, C10 PDS dates, C11 AA variances,\n"
        "C12 CGT, C13 no other client names, C14 fee changes before/after, C15 cashflow assumptions,\n"
        "C16 fee totals, C17 FSG version/date, C18 TOC, C19 required warnings, C20 alternatives documented,\n"
        "C21 product comparison, C22 replacement benefits, C23 overall better position,\n"
        "C24 cashflow projections, C25 fee breakdowns, C26 insurance affordability,\n"
        "C27 warnings (limited info/property/tax/SMSF), C28 client name consistent, C29 no previous client content.\n\n"
        + calib +
        'Return ONLY valid JSON — no markdown:\n'
        '{"client_name":"...","adviser_name":"...","practice_name":"...","advice_type":"...","date":"...",'
        '"summary":"CONSISTENCY: [max 3].\\nSTRUCTURE: [one sentence].\\nPERSONALISATION: [one sentence].\\nCOMPLIANCE: [top 2-3 gaps].",'
        '"risk_level":"LOW, MEDIUM, or HIGH","docs_reviewed":["..."],'
        '"checks":[{"id":"C1","area":"consistency|structure|personalisation|compliance","label":"...","status":"pass|fail|warning|na","note":"..."}]}'
    )


def _build_message_content(documents: list[DocumentPart]) -> list[Any]:
    parts: list[Any] = [
        {"type": "text", "text": "Please conduct a comprehensive compliance review:"}
    ]
    for doc in documents:
        if doc.type == "pdf_b64":
            parts.append({"type": "text", "text": f"--- {doc.label} ---"})
            parts.append({
                "type": "document",
                "source": {"type": "base64", "media_type": "application/pdf", "data": doc.content},
            })
        else:
            truncated = doc.content[:120_000]
            parts.append({"type": "text", "text": f"--- {doc.label} ---\n{truncated}"})
    return parts


# ── Streaming generator ───────────────────────────────────────────────────────

async def _stream_review(body: SOAReviewRequest) -> AsyncGenerator[str, None]:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        yield f"data: {json.dumps({'error': 'ANTHROPIC_API_KEY not configured'})}\n\n"
        return

    has_ref     = any("REFERENCE SOA" in d.label.upper() for d in body.documents)
    system      = _build_system_prompt(body.mode, has_ref)
    content     = _build_message_content(body.documents)
    client      = anthropic.Anthropic(api_key=api_key)
    accumulated = ""

    try:
        with client.messages.stream(
            model      = "claude-opus-4-5",
            max_tokens = 4000 if body.mode == "quick" else 12000,
            system     = system,
            messages   = [{"role": "user", "content": content}],  # type: ignore[arg-type]
        ) as stream:
            for text in stream.text_stream:
                accumulated += text
                yield f"data: {json.dumps({'chunk': text})}\n\n"

        clean  = accumulated.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result = json.loads(clean)
        yield f"data: {json.dumps({'done': True, 'result': result})}\n\n"

    except json.JSONDecodeError as e:
        yield f"data: {json.dumps({'error': f'Invalid JSON: {e}', 'raw': accumulated[:500]})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/soa/review/stream")
async def soa_review_stream(
    body: SOAReviewRequest,
    user: str = Depends(get_current_user),
):
    """Streaming SSE endpoint — sends chunks as Claude generates them."""
    return StreamingResponse(
        _stream_review(body),
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/soa/review")
async def soa_review(
    body: SOAReviewRequest,
    user: str = Depends(get_current_user),
) -> dict[str, Any]:
    """Non-streaming endpoint — kept for compatibility."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured on server.")
    if not body.documents:
        raise HTTPException(status_code=400, detail="No documents provided.")

    has_ref = any("REFERENCE SOA" in d.label.upper() for d in body.documents)
    system  = _build_system_prompt(body.mode, has_ref)
    content = _build_message_content(body.documents)

    try:
        client   = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model      = "claude-opus-4-5",
            max_tokens = 4000 if body.mode == "quick" else 12000,
            system     = system,
            messages   = [{"role": "user", "content": content}],  # type: ignore[arg-type]
        )
        raw    = "".join(block.text for block in response.content if block.type == "text")
        clean  = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result = json.loads(clean)
        return result  # type: ignore[return-value]

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"AI returned invalid JSON: {e}")
    except anthropic.APIStatusError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e.message))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))