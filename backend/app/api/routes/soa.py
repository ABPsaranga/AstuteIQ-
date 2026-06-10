"""
SOA review router — blocking and streaming endpoints.
Model: claude-sonnet-4-6
"""

import os
import json
import asyncio
import random
from typing import Any, cast
from fastapi import APIRouter, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from anthropic.types import MessageParam

router = APIRouter()

_MODEL = "claude-sonnet-4-6"
_MAX_TOKENS = 8000
_MAX_DOC_CHARS = 25000

# -------------------------------------------------------------------
# Retry config
# -------------------------------------------------------------------

_MAX_RETRIES = 5
_BASE_DELAY = 3.0


# -------------------------------------------------------------------
# Schemas
# -------------------------------------------------------------------

class DocumentPart(BaseModel):
    type: str
    label: str
    content: str


class ReviewPayload(BaseModel):
    mode: str = "full"
    documents: list[DocumentPart]


# -------------------------------------------------------------------
# Retry helpers
# -------------------------------------------------------------------

def _is_overloaded(exc: Any) -> bool:
    """
    Detect Anthropic overloaded/rate-limit errors.
    """

    try:
        import anthropic as _anthropic

        if isinstance(exc, _anthropic.RateLimitError):
            return True

        if isinstance(exc, _anthropic.APIStatusError):

            if getattr(exc, "status_code", 0) == 529:
                return True

            body = getattr(exc, "body", None) or {}

            if isinstance(body, dict):
                err_type = (body.get("error") or {}).get("type", "")

                if "overloaded" in str(err_type).lower():
                    return True

    except Exception:
        pass

    err = str(exc).lower()

    return (
        "overloaded_error" in err
        or "overloaded" in err
        or "529" in err
        or "rate_limit" in err
    )


class _OverloadedError(Exception):
    pass


def _check_response(resp: Any) -> Any:
    """
    Older SDKs sometimes return error dicts instead of exceptions.
    """

    if not isinstance(resp, dict):
        return resp

    if resp.get("type") == "error":

        err = resp.get("error", {})
        err_type = str(err.get("type", ""))
        msg = str(err.get("message", str(resp)))

        if (
            "overloaded" in err_type.lower()
            or "rate_limit" in err_type.lower()
        ):
            raise _OverloadedError(msg)

        raise RuntimeError(f"Anthropic API error ({err_type}): {msg}")

    return resp


async def _with_retry(fn: Any, *args: Any, **kwargs: Any) -> Any:
    """
    Retry overloaded requests with exponential backoff.
    """

    for attempt in range(_MAX_RETRIES + 1):

        try:

            result = await asyncio.to_thread(
                lambda: fn(*args, **kwargs)
            )

            result = _check_response(result)

            return result

        except Exception as exc:

            if (
                (_is_overloaded(exc) or isinstance(exc, _OverloadedError))
                and attempt < _MAX_RETRIES
            ):

                delay = (
                    _BASE_DELAY * (2 ** attempt)
                    + random.uniform(0.5, 2.0)
                )

                print(
                    f"[soa] overloaded "
                    f"(attempt {attempt+1}/{_MAX_RETRIES}) "
                    f"retrying in {delay:.1f}s"
                )

                await asyncio.sleep(delay)

                continue

            raise


# -------------------------------------------------------------------
# Prompt builder
# -------------------------------------------------------------------

_FULL_CHECKS = """
Produce one check per item below. Use the id shown exactly.

CONSISTENCY (id: CON-01 to CON-05+):
Cross-check every monetary figure across all documents.
Variance >5% = fail. Variance <=5% = pass with note.

STRUCTURE (id: STR-01 to STR-03+):
Check all critical sections present:
executive summary,
personal circumstances,
goals,
scope,
strategy rationale,
product recommendations,
fees,
alternatives,
implementation,
appendices.

PERSONALISATION (id: P1-P10, one each):
P1 Age/life stage in rationale
P2 Family situation
P3 Occupation/income
P4 Goals with timeframes+amounts
P5 Risk profile in every section
P6 Existing position with figures
P7 Strategy rationale specificity
P8 Better position with dollar amounts
P9 Recommendations linked to goals
P10 Template language — quote any boilerplate found

COMPLIANCE (id: C1-C29, one each):
C1 Numbers match
C2 Balances consistent
C3 Better position figures
C4 Goals mapped
C5 No repeated padding
C6 Basis of advice
C7 Reasons/advantages/disadvantages/alternatives
C8 Strategy numbers=product
C9 Platform cost justified
C10 PDS dates accurate
C11 AA variances explained
C12 CGT addressed
C13 No other client names
C14 Fee changes with dollar amounts
C15 Cashflow assumptions
C16 Fee breakdowns correct
C17 FSG version present
C18 TOC accurate
C19 Required disclosures
C20 Alternatives documented
C21 Like-for-like comparison
C22 Replacement benefits quantified
C23 Overall better position
C24 Cashflow projections
C25 Upfront+ongoing fees
C26 Insurance affordability
C27 Required warnings
C28 Client name consistent
C29 No prior client content

REGULATORY (id: REG-01 to REG-05+):
2024-25 thresholds:
CC cap $30k
NCC cap $120k
TBC $1.9m
SG 11.5%
Div293 $250k
"""


_QUICK_CHECKS = """
Check only:
CONSISTENCY:
Cross-check all monetary figures across documents.

COMPLIANCE:
C1 C2 C3 C6 C9 C10 C11 C12 C14 C16 C19 C25

PERSONALISATION:
P7 P8 only
"""


def _build_system_prompt(mode: str, has_ref: bool) -> str:

    ref_note = ""

    if has_ref:
        ref_note = (
            "A reference SOA is provided. "
            "Compare structure against it.\n\n"
        )

    common_rules = """
RULES:
- Return STRICT RAW JSON ONLY
- Do NOT use markdown
- Do NOT use ```json
- Response MUST begin with {
- Response MUST end with }
- No text outside JSON
- Never invent client names
- Use only information explicitly found in documents
"""

    if mode == "quick":

        return (
            "You are a senior Australian financial planning "
            "compliance reviewer.\n\n"
            + ref_note
            + "Run a QUICK CHECK SOA review.\n\n"
            + _QUICK_CHECKS
            + "\n"
            + common_rules
            + """
- checks array MUST contain at least 5 entries
- Include ONLY fail/warning/na items
- Omit pass items

Required schema:
{
  "client_name": "",
  "adviser_name": "",
  "practice_name": "",
  "advice_type": "",
  "date": "",
  "summary": "",
  "risk_level": "LOW",
  "docs_reviewed": [],
  "mode": "quick",
  "checks": [
    {
      "id": "C1",
      "area": "compliance",
      "label": "Numbers match",
      "status": "fail",
      "note": "detail"
    }
  ]
}
"""
        )

    return (
        "You are a senior Australian financial planning "
        "compliance reviewer.\n\n"
        + ref_note
        + "Run a FULL SOA compliance review.\n\n"
        + _FULL_CHECKS
        + "\n"
        + common_rules
        + """
- checks array MUST contain at least 40 entries
- Include:
  - all C1-C29
  - all P1-P10
  - CON checks
  - STR checks
  - REG checks

Required schema:
{
  "client_name": "",
  "adviser_name": "",
  "practice_name": "",
  "advice_type": "",
  "date": "",
  "summary": "",
  "risk_level": "LOW",
  "docs_reviewed": [],
  "mode": "full",
  "checks": [
    {
      "id": "CON-01",
      "area": "consistency",
      "label": "Super balance match",
      "status": "pass",
      "note": "detail"
    }
  ]
}
"""
    )


# -------------------------------------------------------------------
# Content builder
# -------------------------------------------------------------------

def _build_content(payload: ReviewPayload) -> list[dict[str, Any]]:

    parts: list[dict[str, Any]] = [
        {
            "type": "text",
            "text": (
                "Review these SOA documents carefully. "
                "Only use data explicitly found in documents."
            ),
        }
    ]

    for doc in payload.documents:

        if doc.type == "pdf_b64":

            parts.append({
                "type": "text",
                "text": f"--- {doc.label} ---",
            })

            parts.append({
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": "application/pdf",
                    "data": doc.content,
                },
            })

        else:

            parts.append({
                "type": "text",
                "text": (
                    f"--- {doc.label} ---\n"
                    f"{doc.content[:_MAX_DOC_CHARS]}"
                ),
            })

    return parts


# -------------------------------------------------------------------
# JSON parser
# -------------------------------------------------------------------

def _parse_json(text: str) -> dict[str, Any] | None:

    if not text:
        return None

    cleaned = text.strip()

    cleaned = cleaned.replace("```json", "")
    cleaned = cleaned.replace("```", "")
    cleaned = cleaned.strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}") + 1

    if start == -1 or end <= 0:
        print("[soa] no JSON object found")
        return None

    fragment = cleaned[start:end]

    parsed = None

    try:
        parsed = json.loads(fragment)

    except Exception as exc:

        print(f"[soa] direct parse failed: {exc}")

        try:

            repaired = fragment

            repaired = repaired.replace(",}", "}")
            repaired = repaired.replace(",]", "]")

            open_curly = repaired.count("{")
            close_curly = repaired.count("}")

            open_square = repaired.count("[")
            close_square = repaired.count("]")

            if close_square < open_square:
                repaired += "]" * (open_square - close_square)

            if close_curly < open_curly:
                repaired += "}" * (open_curly - close_curly)

            parsed = json.loads(repaired)

            print("[soa] repaired JSON successfully")

        except Exception as repair_error:

            print(f"[soa] repair failed: {repair_error}")
            return None

    if not isinstance(parsed, dict):
        return None

    checks = (
        parsed.get("checks")
        or parsed.get("findings")
        or parsed.get("results")
        or parsed.get("items")
        or []
    )

    if isinstance(checks, dict):
        checks = [checks]

    if not isinstance(checks, list):
        checks = []

    normalized_checks = []

    for i, item in enumerate(checks):

        if not isinstance(item, dict):
            continue

        status = str(
            item.get("status", "warning")
        ).lower().strip()

        if status == "warn":
            status = "warning"

        if status not in [
            "pass",
            "fail",
            "warning",
            "na",
        ]:
            status = "warning"

        normalized_checks.append({
            "id": str(
                item.get("id")
                or item.get("check_id")
                or f"CHECK-{i+1}"
            ),

            "area": str(
                item.get("area")
                or item.get("category")
                or "general"
            ),

            "label": str(
                item.get("label")
                or item.get("title")
                or f"Review Check {i+1}"
            ),

            "status": status,

            "note": str(
                item.get("note")
                or item.get("message")
                or item.get("details")
                or "No details provided"
            ),
        })

    if not normalized_checks:

        summary = str(parsed.get("summary", "")).strip()

        if summary:

            normalized_checks.append({
                "id": "SUMMARY-1",
                "area": "general",
                "label": "SOA Review Summary",
                "status": "warning",
                "note": summary[:500],
            })

    parsed["checks"] = normalized_checks

    print(f"[soa] normalized checks={len(normalized_checks)}")

    return parsed


# -------------------------------------------------------------------
# Blocking endpoint
# -------------------------------------------------------------------

@router.post("/soa/review")
async def run_review(payload: ReviewPayload):

    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        return {"error": "ANTHROPIC_API_KEY missing"}

    try:

        import anthropic

        client = anthropic.Anthropic(
            api_key=api_key,
            timeout=300.0,
        )

        has_ref = any(
            "REFERENCE" in d.label.upper()
            for d in payload.documents
        )

        print(
            f"[soa/review] "
            f"mode={payload.mode} "
            f"docs={len(payload.documents)}"
        )

        response = await _with_retry(
            client.messages.create,
            model=_MODEL,
            max_tokens=_MAX_TOKENS,
            system=_build_system_prompt(
                payload.mode,
                has_ref,
            ),
            messages=cast(
                list[MessageParam],
                [{
                    "role": "user",
                    "content": _build_content(payload),
                }],
            ),
        )

        text_parts = []

        for block in getattr(response, "content", []) or []:

            if getattr(block, "type", None) == "text":

                txt = getattr(block, "text", "")

                if txt:
                    text_parts.append(txt)

        text = "\n".join(text_parts).strip()

        print(f"[soa/review] text_len={len(text)}")

        if not text:
            return {"error": "Claude returned empty response"}

        result = _parse_json(text)

        if not result:
            return {
                "error": (
                    "Failed to parse Claude response. "
                    f"First 300 chars: {text[:300]}"
                )
            }

        checks = result.get("checks", [])

        if not checks:

            print("[soa] attempting emergency recovery")

            lines = text.splitlines()

            recovered = []

            for idx, line in enumerate(lines):

                line = line.strip()

                if not line:
                    continue

                lower = line.lower()

                if any(
                    keyword in lower
                    for keyword in [
                        "fail",
                        "warning",
                        "warn",
                        "pass",
                        "na",
                        "issue",
                        "risk",
                        "concern",
                        "missing",
                        "inconsistent",
                    ]
                ):

                    status = "warning"

                    if "fail" in lower:
                        status = "fail"
                    elif "pass" in lower:
                        status = "pass"
                    elif "na" in lower:
                        status = "na"

                    recovered.append({
                        "id": f"RECOVERED-{idx+1}",
                        "area": "general",
                        "label": line[:80],
                        "status": status,
                        "note": line[:500],
                    })

            if recovered:

                result["checks"] = recovered

                print(f"[soa] recovered checks={len(recovered)}")

            else:

                result["checks"] = [{
                    "id": "FALLBACK-1",
                    "area": "general",
                    "label": "SOA Review Generated",
                    "status": "warning",
                    "note": (
                        result.get("summary")
                        or text[:1000]
                        or "Review completed but Claude returned unexpected structure."
                    ),
                }]

                print("[soa] using synthetic fallback check")

        return result

    except asyncio.TimeoutError:

        return {
            "error": "Request timed out after 5 minutes"
        }

    except Exception as exc:

        print(f"[soa/review] error: {exc}")

        if _is_overloaded(exc):

            return {
                "error": (
                    "Anthropic servers are overloaded. "
                    "Please retry in 30 seconds."
                )
            }

        return {"error": str(exc)}


# -------------------------------------------------------------------
# Streaming endpoint
# -------------------------------------------------------------------

@router.post("/soa/review/stream")
async def stream_review(payload: ReviewPayload):

    api_key = os.getenv("ANTHROPIC_API_KEY")

    VALID_AREAS = [
        "consistency",
        "structure",
        "personalisation",
        "compliance",
        "regulatory",
    ]

    async def generate():

        if not api_key:
            yield f"data: {json.dumps({'done': True, 'error': 'ANTHROPIC_API_KEY missing'})}\n\n"
            return

        try:

            import anthropic

            client = anthropic.Anthropic(
                api_key=api_key,
                timeout=300.0,
            )

            has_ref = any(
                "REFERENCE" in d.label.upper()
                for d in payload.documents
            )

            system = _build_system_prompt(
                payload.mode,
                has_ref,
            )

            msgs = cast(
                list[MessageParam],
                [{
                    "role": "user",
                    "content": _build_content(payload),
                }],
            )

            print(
                f"[soa/stream] "
                f"mode={payload.mode} "
                f"docs={len(payload.documents)}"
            )

            yield f"data: {json.dumps({'chunk': 'Analysing SOA documents...'})}\n\n"

            call_task = asyncio.create_task(
                _with_retry(
                    client.messages.create,
                    model=_MODEL,
                    max_tokens=_MAX_TOKENS,
                    system=system,
                    messages=msgs,
                )
            )

            while not call_task.done():

                try:

                    await asyncio.wait_for(
                        asyncio.shield(call_task),
                        timeout=5,
                    )

                except asyncio.TimeoutError:

                    yield f"data: {json.dumps({'chunk': '.'})}\n\n"

                    continue

            response = await call_task

            text_parts = []

            for block in getattr(response, "content", []) or []:

                if getattr(block, "type", None) == "text":

                    txt = getattr(block, "text", "")

                    if txt:
                        text_parts.append(txt)

            text = "\n".join(text_parts).strip()

            print(f"[soa/stream] text_len={len(text)}")

            if not text:

                yield f"data: {json.dumps({'done': True, 'error': 'Claude returned empty response'})}\n\n"

                return

            chunk_size = 180

            for i in range(0, len(text), chunk_size):

                chunk = text[i:i + chunk_size]

                yield f"data: {json.dumps({'chunk': chunk})}\n\n"

                await asyncio.sleep(0)

            result = _parse_json(text)

            if not result:

                print("[soa/stream] parse failed")

                result = {}

            checks = (
                result.get("checks")
                or result.get("findings")
                or result.get("results")
                or result.get("items")
                or []
            )

            if isinstance(checks, dict):
                checks = [checks]

            if not isinstance(checks, list):
                checks = []

            normalized_checks = []

            for idx, item in enumerate(checks):

                if not isinstance(item, dict):
                    continue

                status = str(
                    item.get("status", "warning")
                ).lower().strip()

                if status == "warn":
                    status = "warning"

                if status not in [
                    "pass",
                    "fail",
                    "warning",
                    "na",
                ]:
                    status = "warning"

                area = str(
                    item.get("area")
                    or item.get("category")
                    or "compliance"
                ).lower().strip()

                if area not in VALID_AREAS:
                    area = "compliance"

                normalized_checks.append({
                    "id": str(
                        item.get("id")
                        or item.get("check_id")
                        or f"CHECK-{idx+1}"
                    ),

                    "area": area,

                    "label": str(
                        item.get("label")
                        or item.get("title")
                        or f"Review Check {idx+1}"
                    ),

                    "status": status,

                    "note": str(
                        item.get("note")
                        or item.get("message")
                        or item.get("details")
                        or "No details provided"
                    ),
                })

            # ---------------------------------------------------------
            # Emergency recovery
            # ---------------------------------------------------------

            if len(normalized_checks) == 0:

                print("[soa/stream] generating synthetic findings")

                synthetic_checks = []

                paragraphs = [
                    p.strip()
                    for p in text.split("\n")
                    if len(p.strip()) > 40
                ]

                for idx, para in enumerate(paragraphs[:15]):

                    lower = para.lower()

                    status = "warning"

                    if any(x in lower for x in [
                        "fail",
                        "breach",
                        "missing",
                        "inconsistent",
                        "mismatch",
                        "not provided",
                        "incorrect",
                        "variance",
                    ]):
                        status = "fail"

                    label = para[:90]

                    synthetic_checks.append({
                        "id": f"SYN-{idx+1}",
                        "area": "compliance",
                        "label": label,
                        "status": status,
                        "note": para[:700],
                    })

                if synthetic_checks:
                    normalized_checks = synthetic_checks

                else:
                    normalized_checks = [{
                        "id": "FALLBACK-1",
                        "area": "compliance",
                        "label": "Manual Review Required",
                        "status": "warning",
                        "note": text[:1200] or "SOA review completed.",
                    }]

            # ---------------------------------------------------------
            # Final guaranteed fallback
            # ---------------------------------------------------------

            if len(normalized_checks) == 0:

                normalized_checks = [{
                    "id": "FALLBACK-1",
                    "area": "compliance",
                    "label": "SOA Review Completed",
                    "status": "warning",
                    "note": (
                        result.get("summary")
                        or text[:1000]
                        or "Review completed successfully."
                    ),
                }]

            # ---------------------------------------------------------
            # Final result object
            # ---------------------------------------------------------

            final_result = {
                "client_name": result.get("client_name", ""),
                "adviser_name": result.get("adviser_name", ""),
                "practice_name": result.get("practice_name", ""),
                "advice_type": result.get("advice_type", ""),
                "date": result.get("date", ""),
                "summary": result.get(
                    "summary",
                    "SOA review completed successfully.",
                ),
                "risk_level": result.get(
                    "risk_level",
                    "MEDIUM",
                ),
                "docs_reviewed": result.get(
                    "docs_reviewed",
                    [],
                ),
                "mode": payload.mode,
                "checks": normalized_checks,
            }

            print(
                f"[soa/stream] final checks="
                f"{len(normalized_checks)}"
            )

            yield (
                f"data: "
                f"{json.dumps({'done': True, 'result': final_result})}"
                f"\n\n"
            )

        except asyncio.TimeoutError:

            yield f"data: {json.dumps({'done': True, 'error': 'Request timed out after 5 minutes'})}\n\n"

        except (_OverloadedError, Exception) as exc:

            err = str(exc)

            print(f"[soa/stream] fatal error: {err}")

            if _is_overloaded(exc):

                err = (
                    "Anthropic servers are overloaded. "
                    "Please retry in 30 seconds."
                )

            if len(err) > 500:
                err = err[:500]

            yield (
                f"data: "
                f"{json.dumps({'done': True, 'error': err})}"
                f"\n\n"
            )

    # soa.py — bottom of stream_review()
    return StreamingResponse(
    generate(),
    media_type="text/event-stream",
    headers={
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
        #  "Access-Control-Allow-Origin": "*",   ← remove this
    },
)