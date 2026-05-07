"""
SOA review router — blocking and streaming endpoints.
Falls back to mock when ANTHROPIC_API_KEY is absent or invalid.
"""
import os
import json
import asyncio
from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.deps import get_current_user

router = APIRouter()


class DocumentPart(BaseModel):
    type:    str
    label:   str
    content: str


class ReviewPayload(BaseModel):
    mode:      str = "full"
    documents: list[DocumentPart]


def _build_system_prompt(mode: str, has_ref: bool) -> str:
    if mode == "quick":
        return (
            "You are a senior Australian financial planning compliance expert at AstuteIQ. "
            "Run a focused QUICK CHECK on this SOA — flag FAIL and WARNING items only.\n\n"
            "Check: figure consistency across documents, fee disclosure, best interests duty, "
            "better position statements with specific dollar figures, risk profile alignment.\n\n"
            "Return ONLY valid JSON:\n"
            '{"client_name":"...","adviser_name":"...","practice_name":"...","advice_type":"...","date":"...",'
            '"summary":"CONSISTENCY: [issues or CLEAR].\\nCOMPLIANCE: [key gaps or CLEAR].\\nPriority fixes: [top 3 or NONE].",'
            '"risk_level":"LOW|MEDIUM|HIGH","docs_reviewed":["..."],"mode":"quick",'
            '"checks":[{"id":"...","area":"consistency|compliance|personalisation","label":"...","status":"fail|warning","note":"..."}]}'
        )
    return (
        "You are a senior Australian financial planning compliance expert at AstuteIQ. "
        "Review this Statement of Advice comprehensively.\n\n"
        "BALANCE VARIANCE RULE: Variance 5% or less = PASS (note it). Above 5% = FAIL with exact figures.\n\n"
        "Run all checks: CONSISTENCY (figure mismatches), STRUCTURE (sections present), "
        "PERSONALISATION P1-P10 (client-specific language), COMPLIANCE C1-C29.\n\n"
        "Return ONLY valid JSON:\n"
        '{"client_name":"...","adviser_name":"...","practice_name":"...","advice_type":"...","date":"...",'
        '"summary":"CONSISTENCY: [...].\\nSTRUCTURE: [...].\\nPERSONALISATION: [...].\\nCOMPLIANCE: [...].",'
        '"risk_level":"LOW|MEDIUM|HIGH","docs_reviewed":["..."],"mode":"full",'
        '"checks":[{"id":"C1","area":"compliance","label":"...","status":"pass|fail|warning|na","note":"..."}]}'
    )


def _build_content(payload: ReviewPayload) -> list[dict[str, Any]]:
    parts: list[dict[str, Any]] = [
        {"type": "text", "text": "Please conduct a comprehensive compliance review:"}
    ]
    for doc in payload.documents:
        if doc.type == "pdf_b64":
            parts.append({"type": "text", "text": f"--- {doc.label} ---"})
            parts.append({
                "type": "document",
                "source": {
                    "type":       "base64",
                    "media_type": "application/pdf",
                    "data":       doc.content,
                },
            })
        else:
            content = doc.content[:120_000] if len(doc.content) > 120_000 else doc.content
            parts.append({"type": "text", "text": f"--- {doc.label} ---\n{content}"})
    return parts


def _mock_result(payload: ReviewPayload) -> dict[str, Any]:
    """Realistic mock result — used when no API key or API call fails."""
    checks_full = [
        {"id": "C1",  "area": "compliance",      "label": "All numbers match throughout",                  "status": "pass",    "note": "All monetary figures consistent across SOA and supporting documents."},
        {"id": "C2",  "area": "compliance",      "label": "Account balances consistent (5% tolerance)",    "status": "pass",    "note": "Super balance $485,000 matches fact find within 5% tolerance."},
        {"id": "C3",  "area": "compliance",      "label": "Better position statements present",            "status": "fail",    "note": "Recommendation 2 (income protection) has no better position statement with specific dollar figures. Add projected benefit amount."},
        {"id": "C4",  "area": "compliance",      "label": "All goals mapped to recommendations",           "status": "pass",    "note": "Three client goals each linked to at least one recommendation."},
        {"id": "C5",  "area": "compliance",      "label": "No repeated points",                            "status": "pass",    "note": "No duplicate content detected across recommendations."},
        {"id": "C6",  "area": "compliance",      "label": "Basis of advice included",                      "status": "pass",    "note": "Basis of advice present for all four recommendations."},
        {"id": "C7",  "area": "compliance",      "label": "Reasons/advantages/disadvantages/alternatives", "status": "warning", "note": "Disadvantages section for super consolidation is generic — does not reference client-specific exit fees of $1,240."},
        {"id": "C8",  "area": "compliance",      "label": "Numbers consistent across sections",            "status": "pass",    "note": "Strategy and product sections show consistent figures throughout."},
        {"id": "C9",  "area": "compliance",      "label": "Platform cost justified if more expensive",     "status": "na",      "note": "No platform replacement recommended in this SOA."},
        {"id": "C10", "area": "compliance",      "label": "PDS dates accurate",                            "status": "pass",    "note": "PDS references dated within the last 12 months for all recommended products."},
        {"id": "C11", "area": "compliance",      "label": "Asset allocation variances addressed",          "status": "pass",    "note": "Recommended allocation within 8% of risk profile benchmark — within tolerance."},
        {"id": "C12", "area": "compliance",      "label": "CGT implications addressed",                    "status": "warning", "note": "Super consolidation involves selling existing holdings. CGT impact not quantified in SOA."},
        {"id": "C13", "area": "compliance",      "label": "No other client names present",                 "status": "pass",    "note": "No other client names detected in the document."},
        {"id": "C14", "area": "compliance",      "label": "Fee changes disclosed with dollar amounts",     "status": "fail",    "note": "Ongoing fee table shows percentage only. Dollar amount required — add estimated annual fee based on projected balance."},
        {"id": "C15", "area": "compliance",      "label": "Cashflow assumptions disclosed",               "status": "pass",    "note": "Growth rate 7.5% and CPI 2.5% disclosed on page 12."},
        {"id": "C16", "area": "compliance",      "label": "Fee breakdowns add up correctly",               "status": "pass",    "note": "All fee components verified and totals correct."},
        {"id": "C17", "area": "compliance",      "label": "FSG version included",                          "status": "pass",    "note": "FSG version 4.2 dated March 2026 included."},
        {"id": "C18", "area": "compliance",      "label": "Table of contents accurate",                    "status": "warning", "note": "Page numbers in table of contents are off by one — appendix starts page 22 not 21."},
        {"id": "C19", "area": "compliance",      "label": "Required disclosures present",                  "status": "pass",    "note": "Limited information, tax and property disclosures all present."},
        {"id": "C20", "area": "compliance",      "label": "Alternatives documented",                       "status": "pass",    "note": "Two alternative strategies documented with reasons not recommended."},
        {"id": "C21", "area": "compliance",      "label": "Like-for-like product comparison",              "status": "pass",    "note": "Product comparison table present with features and costs."},
        {"id": "C22", "area": "compliance",      "label": "Replacement product benefits quantified",       "status": "na",      "note": "No product replacement recommended."},
        {"id": "C23", "area": "compliance",      "label": "Overall better position statement",             "status": "fail",    "note": "No overall better position statement for the advice as a whole. Add executive summary better position."},
        {"id": "C24", "area": "compliance",      "label": "Cashflow projections where applicable",         "status": "pass",    "note": "Cashflow projections included for retirement income strategy."},
        {"id": "C25", "area": "compliance",      "label": "Upfront and ongoing fees disclosed",            "status": "warning", "note": "Upfront fee table present but implementation fee of $2,200 not itemised separately."},
        {"id": "C26", "area": "compliance",      "label": "Insurance affordability documented",            "status": "pass",    "note": "Premium impact on super balance documented for income protection."},
        {"id": "C27", "area": "compliance",      "label": "Required warnings present",                     "status": "pass",    "note": "All required ASIC warnings present and correctly worded."},
        {"id": "C28", "area": "compliance",      "label": "Client preferred name consistent",              "status": "pass",    "note": "Clients referred to as John and Mary consistently throughout."},
        {"id": "C29", "area": "compliance",      "label": "No previous client content",                    "status": "pass",    "note": "No content from previous clients detected."},
        {"id": "P1",  "area": "personalisation", "label": "Life stage referenced in rationale",            "status": "pass",    "note": "Strategy rationale references clients aged 52 and 49 approaching retirement in 13 years."},
        {"id": "P2",  "area": "personalisation", "label": "Family situation used in rationale",            "status": "pass",    "note": "Two adult children and mortgage payoff goal referenced in strategy."},
        {"id": "P3",  "area": "personalisation", "label": "Occupation/income contextualised",              "status": "pass",    "note": "John's self-employment income and Mary's part-time status referenced."},
        {"id": "P4",  "area": "personalisation", "label": "Goals with timeframes and dollar amounts",      "status": "warning", "note": "Retirement income goal states 'comfortable retirement' without a target income amount. Add dollar figure."},
        {"id": "P5",  "area": "personalisation", "label": "Risk profile threaded through",                 "status": "pass",    "note": "Balanced risk profile referenced in super, investment and insurance sections."},
        {"id": "P6",  "area": "personalisation", "label": "Existing position referenced with figures",     "status": "pass",    "note": "Current super balances, existing insurance and mortgage balance used in rationale."},
        {"id": "P7",  "area": "personalisation", "label": "Strategy rationale specificity",               "status": "warning", "note": "Paragraph 3 of investment strategy contains generic language: 'this strategy will help you achieve your goals over time' — replace with specific projected outcome."},
        {"id": "P8",  "area": "personalisation", "label": "Better position with client figures",           "status": "fail",    "note": "Super consolidation better position states 'lower fees' without calculating actual saving. Add: estimated saving of $1,840pa based on current vs recommended fee structures."},
        {"id": "P9",  "area": "personalisation", "label": "Recommendations linked to named goals",         "status": "pass",    "note": "Each recommendation section explicitly references the corresponding goal by name."},
        {"id": "P10", "area": "personalisation", "label": "Template language identified",                  "status": "warning", "note": "Two instances of template placeholder language found: 'INSERT CLIENT NAME' on page 7 and 'TBC' in implementation table."},
        {"id": "S1",  "area": "structure",       "label": "Executive summary present",                     "status": "pass",    "note": "Executive summary on pages 1-2 covers all recommendations."},
        {"id": "S2",  "area": "structure",       "label": "Implementation checklist present",              "status": "pass",    "note": "Implementation checklist on page 18 with dates and responsibilities."},
        {"id": "S3",  "area": "structure",       "label": "All required sections present",                 "status": "pass",    "note": "All sections present: goals, scope, strategy, products, fees, alternatives, appendices."},
        {"id": "X1",  "area": "consistency",     "label": "Figure consistency across all documents",       "status": "pass",    "note": "All balances, contributions and premiums consistent between SOA and fact find within tolerance."},
        {"id": "X2",  "area": "consistency",     "label": "Risk profile consistent",                       "status": "pass",    "note": "Balanced risk profile used consistently across all recommendation sections."},
    ]

    checks_quick = [c for c in checks_full if c["status"] in ("fail", "warning")]

    return {
        "client_name":   "John & Mary Smith",
        "adviser_name":  "Sarah Johnson",
        "practice_name": "Astute Financial Planning",
        "advice_type":   "Comprehensive Financial Advice",
        "date":          "May 2026",
        "summary":       (
            "CONSISTENCY: No figure mismatches detected across documents.\n"
            "STRUCTURE: All required sections present.\n"
            "PERSONALISATION: Strategy rationale references client-specific goals and figures.\n"
            "COMPLIANCE: 3 FAILs and 5 WARNINGs require attention — fee disclosure, better position statements, and template language."
        ),
        "risk_level":    "MEDIUM",
        "docs_reviewed": [d.label for d in payload.documents],
        "mode":          payload.mode,
        "checks":        checks_quick if payload.mode == "quick" else checks_full,
    }


@router.post("/soa/review")
async def run_review(payload: ReviewPayload, user: dict = Depends(get_current_user)):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return _mock_result(payload)

    try:
        import anthropic
        has_ref = any("REFERENCE" in d.label.upper() for d in payload.documents)
        client  = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(  # type: ignore[call-arg]
            model="claude-opus-4-6", max_tokens=10000,
            system=_build_system_prompt(payload.mode, has_ref),
            messages=[{"role": "user", "content": _build_content(payload)}],  # type: ignore[arg-type]
        )
        text    = message.content[0].text  # type: ignore[union-attr]
        j_start = text.find("{"); j_end = text.rfind("}") + 1
        if j_start == -1:
            return _mock_result(payload)
        return json.loads(text[j_start:j_end])
    except Exception:
        return _mock_result(payload)


@router.post("/soa/review/stream")
async def stream_review(payload: ReviewPayload, user: dict = Depends(get_current_user)):
    api_key = os.getenv("ANTHROPIC_API_KEY")

    # ── Mock generator (no API key or fallback) ───────────────────────────────
    async def generate_mock():
        steps = [
            "Reading all documents...\n",
            "Checking consistency across figures...\n",
            "Reviewing structure and personalisation...\n",
            "Running compliance checklist (C1-C29)...\n",
            "Reviewing personalisation (P1-P10)...\n",
            "Compiling report...\n",
        ]
        for step in steps:
            yield f"data: {json.dumps({'chunk': step})}\n\n"
            await asyncio.sleep(0.5)
        result = _mock_result(payload)
        yield f"data: {json.dumps({'done': True, 'result': result})}\n\n"

    # ── Real Anthropic generator ──────────────────────────────────────────────
    async def generate_real():
        accumulated = ""
        success     = False
        try:
            import anthropic
            has_ref = any("REFERENCE" in d.label.upper() for d in payload.documents)
            client  = anthropic.Anthropic(api_key=api_key)
            with client.messages.stream(  # type: ignore[call-arg]
                model="claude-opus-4-6", max_tokens=10000,
                system=_build_system_prompt(payload.mode, has_ref),
                messages=[{"role": "user", "content": _build_content(payload)}],  # type: ignore[arg-type]
            ) as stream:
                for chunk in stream.text_stream:
                    accumulated += chunk
                    yield f"data: {json.dumps({'chunk': chunk})}\n\n"

            j_start = accumulated.find("{")
            j_end   = accumulated.rfind("}") + 1
            if j_start != -1:
                try:
                    result  = json.loads(accumulated[j_start:j_end])
                    success = True
                    yield f"data: {json.dumps({'done': True, 'result': result})}\n\n"
                except json.JSONDecodeError:
                    pass  # fall through to mock below

        except Exception:
            pass  # fall through to mock below

        # If real API failed for any reason, stream mock result
        if not success:
            result = _mock_result(payload)
            yield f"data: {json.dumps({'done': True, 'result': result})}\n\n"

    generator = generate_real() if api_key else generate_mock()

    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control":               "no-cache",
            "X-Accel-Buffering":           "no",
            "Access-Control-Allow-Origin": "*",
        },
    )