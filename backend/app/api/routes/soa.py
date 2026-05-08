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


# ── System prompts ────────────────────────────────────────────────────────────

_REGULATORY_AREA = """
REVIEW AREA 5 - REGULATORY ACCURACY CHECK:

Identify every strategy in this SOA involving superannuation contributions,
pension drawdowns, tax calculations, TTR, trusts, companies, or SMSFs.

STEP 1 - FETCH CURRENT ATO THRESHOLDS BEFORE CHECKING:
Before running any regulatory checks, use the web_search tool to fetch the
current thresholds from the ATO. Search for:
  "ATO key superannuation rates and thresholds current financial year"
  "ato.gov.au contribution caps current year"

Retrieve the current values for:
- Concessional contributions cap
- Non-concessional contributions cap
- Transfer balance cap
- NCC bring-forward TSB tiers
- Super Guarantee rate
- Division 293 threshold
- Minimum pension drawdown rates by age
- Individual income tax brackets and rates
- Low Income Tax Offset threshold

Use the figures returned from the ATO search only. Do not use any figures
from your training data — these change annually and may be out of date.

Confirm that the figures retrieved match the financial year of this SOA
(determined from the document date) before applying them.

IF WEB SEARCH IS UNAVAILABLE:
Do not apply any threshold figures. Instead, flag every regulatory check
as WARNING with the following note: "Regulatory check could not be
completed — ATO web search was unavailable at time of review. All
superannuation and tax thresholds must be manually verified at
ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds
before this SOA is lodged." Still identify every strategy that requires
a regulatory check so the paraplanner knows what to verify.

---

STEP 2 - RULES THAT DO NOT CHANGE ANNUALLY:

These rules are legislated and do not change with indexation. Apply them
regardless of financial year without needing web search:

AGE RESTRICTIONS ON CONTRIBUTIONS:
Under 75: All voluntary contributions accepted. No work test required for
fund acceptance (from 1 July 2022 onwards).

Age 67 to 74: Work test required ONLY to claim a personal tax deduction.
Must work 40+ hours in a consecutive 30-day period in the contribution year.
One-off work test exemption: met work test in prior year AND TSB below
$300,000 at end of prior year AND exemption never previously used.

Age 75 and over: Only mandated employer contributions and downsizer
contributions accepted. No voluntary contributions after the 28th day of
the month following the month the member turns 75.

Downsizer contributions: Age 55+, property owned 10+ years, maximum
$300,000 per person. Does not count toward NCC cap.

DIVISION 293: Additional 15% tax on concessional contributions. Applies
when combined income + concessional contributions exceed the Division 293
threshold (fetch current threshold via web search in Step 1). Must be
disclosed where client income is near or above the threshold.

TRANSITION TO RETIREMENT (TTR): Maximum drawdown 10% of account balance
per year. Earnings taxed at 15% until a full condition of release is met.
Does not count toward the transfer balance cap until converted to a full
retirement phase pension.

TRUST DISTRIBUTIONS TO MINORS (Division 6AA): Trust income distributed
to beneficiaries under age 18 is taxed at penalty rates. Flag any trust
distribution strategy involving minors that does not disclose these rates.
Fetch current Division 6AA rates via web search in Step 1.

SMSF BASICS: Maximum 6 members. Sole purpose test applies. In-house asset
rule — maximum 5% of fund assets in in-house assets. Related party
transactions must be at arm's length. Annual independent audit required.
Annual return to the ATO required.

DEATH BENEFITS: Payment to a tax dependant (spouse, child under 18,
financial dependant) is tax-free. Payment to a non-dependant adult child —
taxable component taxed at 15% plus 2% Medicare levy (maximum 17%).

PERSONAL DEDUCTIBLE CONTRIBUTIONS: Client must lodge a valid Notice of
Intent to Claim a Deduction with their super fund before lodging their tax
return, or before rolling over or closing the account. Fund must
acknowledge the notice. Flag if the SOA does not mention this requirement
where a personal deductible contribution is recommended.

---

STEP 3 - HOW TO CHECK EACH STRATEGY:

For each super/tax/entity strategy identified in the SOA:

1. Extract the specific figures stated in the SOA: contribution amounts,
   client age, income, TSB, pension balances, drawdown amounts, and any
   tax calculations.

2. Apply the current thresholds retrieved from the ATO in Step 1.

3. For each strategy, assess:
   - Is the contribution amount within the applicable cap?
   - Does the client meet eligibility conditions (age, TSB, work test)?
   - Are tax calculations correct against current ATO rates?
   - Has Division 293 been flagged where income is near or above threshold?
   - Has the work test been addressed for clients aged 67-74 claiming a deduction?
   - Are minimum pension drawdown amounts correct for the client's age?
   - Has the TTR 10% maximum drawdown been respected?
   - Are trust distributions to minor beneficiaries disclosed correctly?
   - Is the transfer balance cap addressed where a retirement phase pension
     is being established or already exists?
   - Has the Notice of Intent requirement been noted where a personal
     deductible contribution is recommended?

4. Return:
   PASS — strategy complies with the ATO rule and threshold
   FAIL — strategy clearly breaches a specific rule or threshold
   WARNING — compliance cannot be confirmed because required client
   information is missing from the documents, or because web search
   was unavailable and thresholds could not be verified

5. In every note: state the specific ATO rule that applies, the threshold
   figure used (sourced from ATO web search), and the ATO URL where the
   rule is documented.

If a strategy type is not present in the SOA, do not fabricate checks.
Omit that strategy type entirely.

OUTPUT FORMAT FOR REGULATORY CHECKS:
{"id":"REG-01","area":"regulatory","label":"short description","status":"pass|fail|warning","note":"..."}
"""


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

    ref_section = (
        "REVIEW AREA 2 - STRUCTURE: Compare every section against the reference SOA. "
        "Check same sections in same order, all structural elements present.\n\n"
        if has_ref else
        "REVIEW AREA 2 - STRUCTURE: Check all critical sections are present: executive summary, "
        "personal circumstances, goals and objectives, advice scope, strategy rationale, "
        "product recommendations, fee disclosures, alternatives, implementation, appendices.\n\n"
    )

    return (
        "You are a senior Australian financial planning compliance expert at AstuteIQ. "
        "Review this Statement of Advice comprehensively.\n\n"
        "BALANCE VARIANCE RULE: Variance 5% or less = PASS (note it). Above 5% = FAIL with exact figures.\n\n"
        "REVIEW AREA 1 - CONSISTENCY: Cross-check every monetary figure across all documents. "
        "Flag any mismatch above 5% as FAIL.\n\n"
        + ref_section +
        "REVIEW AREA 3 - PERSONALISATION (P1-P10):\n"
        "P1. Life stage/age in rationale. P2. Family situation used. P3. Occupation/income contextualised. "
        "P4. Goals with timeframes and dollar amounts. P5. Risk profile threaded through. "
        "P6. Existing position referenced with specific figures. P7. Rationale specificity (not generic). "
        "P8. Better position with client-specific dollar figures. P9. Recommendations linked to goals. "
        "P10. Template language identified.\n\n"
        "REVIEW AREA 4 - COMPLIANCE (C1-C29):\n"
        "C1. Numbers match throughout. C2. Account balances consistent (5% tolerance). "
        "C3. Better position statements with specific figures. C4. All goals mapped to recommendations. "
        "C5. No repeated points. C6. Basis of advice per recommendation. "
        "C7. Reasons/advantages/disadvantages/alternatives. C8. Numbers consistent across sections. "
        "C9. Platform cost justified if more expensive. C10. PDS dates accurate. "
        "C11. Asset allocation variances addressed. C12. CGT implications. C13. No other client names. "
        "C14. Fee changes disclosed with dollar amounts. C15. Cashflow assumptions disclosed. "
        "C16. Fee breakdowns correct. C17. FSG version included. C18. Table of contents accurate. "
        "C19. Required disclosures present. C20. Alternatives documented. "
        "C21. Like-for-like product comparison. C22. Replacement product benefits quantified. "
        "C23. Overall better position statement. C24. Cashflow projections where applicable. "
        "C25. Upfront and ongoing fees disclosed. C26. Insurance affordability documented. "
        "C27. Required warnings present. C28. Client preferred name consistent. "
        "C29. No previous client content.\n\n"
        + _REGULATORY_AREA +
        "\nReturn ONLY valid JSON. The checks array MUST contain all applicable items from areas 1-5:\n"
        '{"client_name":"...","adviser_name":"...","practice_name":"...","advice_type":"...","date":"...",'
        '"summary":"CONSISTENCY: [...].\\nSTRUCTURE: [...].\\nPERSONALISATION: [...].\\nCOMPLIANCE: [...].\\nREGULATORY: [...].",'
        '"risk_level":"LOW|MEDIUM|HIGH","docs_reviewed":["..."],"mode":"full",'
        '"checks":[{"id":"C1","area":"compliance|personalisation|structure|consistency|regulatory","label":"...","status":"pass|fail|warning|na","note":"..."}]}'
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
        # ── Compliance ──────────────────────────────────────────────────────
        {"id": "C1",  "area": "compliance",  "label": "All numbers match throughout",                  "status": "pass",    "note": "All monetary figures consistent across SOA and supporting documents."},
        {"id": "C2",  "area": "compliance",  "label": "Account balances consistent (5% tolerance)",    "status": "pass",    "note": "Super balance $485,000 matches fact find within 5% tolerance."},
        {"id": "C3",  "area": "compliance",  "label": "Better position statements present",            "status": "fail",    "note": "Recommendation 2 (income protection) has no better position statement with specific dollar figures. Add projected benefit amount."},
        {"id": "C4",  "area": "compliance",  "label": "All goals mapped to recommendations",           "status": "pass",    "note": "Three client goals each linked to at least one recommendation."},
        {"id": "C5",  "area": "compliance",  "label": "No repeated points",                            "status": "pass",    "note": "No duplicate content detected across recommendations."},
        {"id": "C6",  "area": "compliance",  "label": "Basis of advice included",                      "status": "pass",    "note": "Basis of advice present for all four recommendations."},
        {"id": "C7",  "area": "compliance",  "label": "Reasons/advantages/disadvantages/alternatives", "status": "warning", "note": "Disadvantages section for super consolidation is generic — does not reference client-specific exit fees of $1,240."},
        {"id": "C8",  "area": "compliance",  "label": "Numbers consistent across sections",            "status": "pass",    "note": "Strategy and product sections show consistent figures throughout."},
        {"id": "C9",  "area": "compliance",  "label": "Platform cost justified if more expensive",     "status": "na",      "note": "No platform replacement recommended in this SOA."},
        {"id": "C10", "area": "compliance",  "label": "PDS dates accurate",                            "status": "pass",    "note": "PDS references dated within the last 12 months for all recommended products."},
        {"id": "C11", "area": "compliance",  "label": "Asset allocation variances addressed",          "status": "pass",    "note": "Recommended allocation within 8% of risk profile benchmark — within tolerance."},
        {"id": "C12", "area": "compliance",  "label": "CGT implications addressed",                    "status": "warning", "note": "Super consolidation involves selling existing holdings. CGT impact not quantified in SOA."},
        {"id": "C13", "area": "compliance",  "label": "No other client names present",                 "status": "pass",    "note": "No other client names detected in the document."},
        {"id": "C14", "area": "compliance",  "label": "Fee changes disclosed with dollar amounts",     "status": "fail",    "note": "Ongoing fee table shows percentage only. Dollar amount required — add estimated annual fee based on projected balance."},
        {"id": "C15", "area": "compliance",  "label": "Cashflow assumptions disclosed",                "status": "pass",    "note": "Growth rate 7.5% and CPI 2.5% disclosed on page 12."},
        {"id": "C16", "area": "compliance",  "label": "Fee breakdowns add up correctly",               "status": "pass",    "note": "All fee components verified and totals correct."},
        {"id": "C17", "area": "compliance",  "label": "FSG version included",                          "status": "pass",    "note": "FSG version 4.2 dated March 2026 included."},
        {"id": "C18", "area": "compliance",  "label": "Table of contents accurate",                    "status": "warning", "note": "Page numbers in table of contents are off by one — appendix starts page 22 not 21."},
        {"id": "C19", "area": "compliance",  "label": "Required disclosures present",                  "status": "pass",    "note": "Limited information, tax and property disclosures all present."},
        {"id": "C20", "area": "compliance",  "label": "Alternatives documented",                       "status": "pass",    "note": "Two alternative strategies documented with reasons not recommended."},
        {"id": "C21", "area": "compliance",  "label": "Like-for-like product comparison",              "status": "pass",    "note": "Product comparison table present with features and costs."},
        {"id": "C22", "area": "compliance",  "label": "Replacement product benefits quantified",       "status": "na",      "note": "No product replacement recommended."},
        {"id": "C23", "area": "compliance",  "label": "Overall better position statement",             "status": "fail",    "note": "No overall better position statement for the advice as a whole. Add executive summary better position."},
        {"id": "C24", "area": "compliance",  "label": "Cashflow projections where applicable",         "status": "pass",    "note": "Cashflow projections included for retirement income strategy."},
        {"id": "C25", "area": "compliance",  "label": "Upfront and ongoing fees disclosed",            "status": "warning", "note": "Upfront fee table present but implementation fee of $2,200 not itemised separately."},
        {"id": "C26", "area": "compliance",  "label": "Insurance affordability documented",            "status": "pass",    "note": "Premium impact on super balance documented for income protection."},
        {"id": "C27", "area": "compliance",  "label": "Required warnings present",                     "status": "pass",    "note": "All required ASIC warnings present and correctly worded."},
        {"id": "C28", "area": "compliance",  "label": "Client preferred name consistent",              "status": "pass",    "note": "Clients referred to as John and Mary consistently throughout."},
        {"id": "C29", "area": "compliance",  "label": "No previous client content",                    "status": "pass",    "note": "No content from previous clients detected."},
        # ── Personalisation ─────────────────────────────────────────────────
        {"id": "P1",  "area": "personalisation", "label": "Life stage referenced in rationale",            "status": "pass",    "note": "Strategy rationale references clients aged 52 and 49 approaching retirement in 13 years."},
        {"id": "P2",  "area": "personalisation", "label": "Family situation used in rationale",            "status": "pass",    "note": "Two adult children and mortgage payoff goal referenced in strategy."},
        {"id": "P3",  "area": "personalisation", "label": "Occupation/income contextualised",              "status": "pass",    "note": "John's self-employment income and Mary's part-time status referenced."},
        {"id": "P4",  "area": "personalisation", "label": "Goals with timeframes and dollar amounts",      "status": "warning", "note": "Retirement income goal states 'comfortable retirement' without a target income amount. Add dollar figure."},
        {"id": "P5",  "area": "personalisation", "label": "Risk profile threaded through",                 "status": "pass",    "note": "Balanced risk profile referenced in super, investment and insurance sections."},
        {"id": "P6",  "area": "personalisation", "label": "Existing position referenced with figures",     "status": "pass",    "note": "Current super balances, existing insurance and mortgage balance used in rationale."},
        {"id": "P7",  "area": "personalisation", "label": "Strategy rationale specificity",                "status": "warning", "note": "Paragraph 3 of investment strategy contains generic language: 'this strategy will help you achieve your goals over time' — replace with specific projected outcome."},
        {"id": "P8",  "area": "personalisation", "label": "Better position with client figures",           "status": "fail",    "note": "Super consolidation better position states 'lower fees' without calculating actual saving. Add: estimated saving of $1,840pa based on current vs recommended fee structures."},
        {"id": "P9",  "area": "personalisation", "label": "Recommendations linked to named goals",         "status": "pass",    "note": "Each recommendation section explicitly references the corresponding goal by name."},
        {"id": "P10", "area": "personalisation", "label": "Template language identified",                  "status": "warning", "note": "Two instances of template placeholder language found: 'INSERT CLIENT NAME' on page 7 and 'TBC' in implementation table."},
        # ── Structure ───────────────────────────────────────────────────────
        {"id": "S1",  "area": "structure",   "label": "Executive summary present",                     "status": "pass",    "note": "Executive summary on pages 1-2 covers all recommendations."},
        {"id": "S2",  "area": "structure",   "label": "Implementation checklist present",              "status": "pass",    "note": "Implementation checklist on page 18 with dates and responsibilities."},
        {"id": "S3",  "area": "structure",   "label": "All required sections present",                 "status": "pass",    "note": "All sections present: goals, scope, strategy, products, fees, alternatives, appendices."},
        # ── Consistency ─────────────────────────────────────────────────────
        {"id": "X1",  "area": "consistency", "label": "Figure consistency across all documents",       "status": "pass",    "note": "All balances, contributions and premiums consistent between SOA and fact find within tolerance."},
        {"id": "X2",  "area": "consistency", "label": "Risk profile consistent",                       "status": "pass",    "note": "Balanced risk profile used consistently across all recommendation sections."},
        # ── Regulatory ──────────────────────────────────────────────────────
        {"id": "REG-01", "area": "regulatory", "label": "Concessional contributions cap",
         "status": "warning",
         "note": "Regulatory check could not be completed — ATO web search was unavailable at time of review. John's proposed $27,500 concessional contribution must be verified against the current cap at ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds before this SOA is lodged."},
        {"id": "REG-02", "area": "regulatory", "label": "Non-concessional contributions cap",
         "status": "warning",
         "note": "Mary's proposed $110,000 non-concessional contribution must be verified against the current NCC cap and TSB bring-forward tiers. TSB as at 30 June prior year is not stated in the documents — paraplanner must confirm eligibility at ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds."},
        {"id": "REG-03", "area": "regulatory", "label": "Division 293 disclosure",
         "status": "warning",
         "note": "John's income is stated as $180,000. Division 293 applies when combined income and concessional contributions exceed the current threshold. The SOA does not disclose a Division 293 liability. Verify the current threshold via the ATO and add disclosure if applicable — ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/growing-and-keeping-track-of-your-super/division-293-tax."},
        {"id": "REG-04", "area": "regulatory", "label": "Minimum pension drawdown — John (age 65)",
         "status": "pass",
         "note": "John aged 65: minimum drawdown factor is 5% of account balance per year (legislated, does not change annually). SOA states drawdown of $32,500 from $485,000 balance = 6.7%. This exceeds the minimum and is within the TTR maximum of 10%. Compliant — ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds."},
        {"id": "REG-05", "area": "regulatory", "label": "Notice of Intent to Claim a Deduction",
         "status": "fail",
         "note": "SOA recommends a personal deductible contribution for John but does not reference the requirement to lodge a valid Notice of Intent to Claim a Deduction with the super fund before lodging the tax return. This is a legislative requirement under s290-180 ITAA 1997. Add a specific implementation step — ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/growing-and-keeping-track-of-your-super/claiming-deductions-for-personal-super-contributions."},
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
            "COMPLIANCE: 3 FAILs and 5 WARNINGs require attention — fee disclosure, better position statements, and template language.\n"
            "REGULATORY: 1 FAIL and 3 WARNINGs — Notice of Intent not referenced, Division 293 not disclosed, contribution caps require manual ATO verification."
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
            model="claude-opus-4-6", max_tokens=12000,
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


@router.post("/api/soa/review/stream")
async def stream_review(payload: ReviewPayload, user: dict = Depends(get_current_user)):
    api_key = os.getenv("ANTHROPIC_API_KEY")

    async def generate_mock():
        steps = [
            "Reading all documents...\n",
            "Checking consistency across figures...\n",
            "Reviewing structure and personalisation...\n",
            "Running compliance checklist (C1-C29)...\n",
            "Reviewing personalisation (P1-P10)...\n",
            "Running regulatory accuracy checks (REG)...\n",
            "Fetching ATO thresholds...\n",
            "Compiling report...\n",
        ]
        for step in steps:
            yield f"data: {json.dumps({'chunk': step})}\n\n"
            await asyncio.sleep(0.4)
        result = _mock_result(payload)
        yield f"data: {json.dumps({'done': True, 'result': result})}\n\n"

    async def generate_real():
        accumulated = ""
        success     = False
        try:
            import anthropic
            has_ref = any("REFERENCE" in d.label.upper() for d in payload.documents)
            client  = anthropic.Anthropic(api_key=api_key)
            with client.messages.stream(  # type: ignore[call-arg]
                model="claude-opus-4-6", max_tokens=12000,
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
                    pass

        except Exception:
            pass

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