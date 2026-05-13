"""
SOA review router — blocking and streaming endpoints.

Model: claude-sonnet-4-6
Tools: web_search_20250305
"""

import os
import json
import asyncio
from typing import Any, cast

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from anthropic.types import MessageParam

router = APIRouter()

_MODEL = "claude-sonnet-4-6"
_MAX_TOKENS = 8000
_MAX_DOC_CHARS = 45000

# -------------------------------------------------------------------
# Payload schemas
# -------------------------------------------------------------------


class DocumentPart(BaseModel):
    type: str
    label: str
    content: str


class ReviewPayload(BaseModel):
    mode: str = "full"
    documents: list[DocumentPart]


# -------------------------------------------------------------------
# Regulatory prompt section
# -------------------------------------------------------------------

_REGULATORY_AREA = """
REVIEW AREA 5 - REGULATORY ACCURACY CHECK:

Identify every strategy in this SOA involving:
- superannuation contributions
- pension drawdowns
- tax calculations
- TTR strategies
- trusts
- companies
- SMSFs

STEP 1 - FETCH CURRENT ATO THRESHOLDS:

Before running regulatory checks, use the web_search tool to fetch:

- ATO key superannuation rates and thresholds current financial year
- ato.gov.au contribution caps current year

Retrieve:
- Concessional contributions cap
- Non-concessional contributions cap
- Transfer balance cap
- NCC bring-forward TSB tiers
- Super Guarantee rate
- Division 293 threshold
- Minimum pension drawdown rates by age
- Individual income tax brackets and rates
- Low Income Tax Offset threshold

IMPORTANT:
- Use ONLY retrieved figures
- Never use training-data thresholds
- Never invent ATO values

If web search fails:
- Flag all regulatory checks as WARNING
- Explain that manual verification is required

OUTPUT FORMAT:
{"id":"REG-01","area":"regulatory","label":"...","status":"pass|fail|warning","note":"..."}
"""

# -------------------------------------------------------------------
# System prompt builder
# -------------------------------------------------------------------


def _build_system_prompt(mode: str, has_ref: bool) -> str:

    if mode == "quick":
        return """
You are a senior Australian financial planning compliance expert.

Run a QUICK CHECK review.

Return ONLY valid JSON.
"""

    ref_section = (
        """
REVIEW AREA 2 - STRUCTURE:
Compare every section against the reference SOA.
"""
        if has_ref
        else
        """
REVIEW AREA 2 - STRUCTURE:
Check all critical sections are present.
"""
    )

    return (
        """
You are a senior Australian financial planning compliance expert.

REVIEW AREA 1 - CONSISTENCY:
Cross-check every monetary figure across all documents.

"""
        + ref_section
        + """
REVIEW AREA 3 - PERSONALISATION:
Check personalisation quality.

REVIEW AREA 4 - COMPLIANCE:
Run full compliance review.

"""
        + _REGULATORY_AREA
        + """

Return ONLY valid JSON matching this schema.

IMPORTANT:
- NEVER use names like:
  John & Mary Smith
  Sarah Johnson
  Astute Financial Planning
  or any generic/sample/demo identities
- Do NOT invent or hallucinate client names
- Do NOT use placeholder/example names
- Use ONLY information explicitly found in the uploaded documents
- If a value cannot be determined, use an empty string
- Do NOT fabricate missing data
- Return valid JSON ONLY
- No markdown
- No explanations
- No commentary
- No extra text outside JSON

{
  "client_name": "",
  "adviser_name": "",
  "practice_name": "",
  "advice_type": "",
  "date": "",
  "summary": "",
  "risk_level": "LOW|MEDIUM|HIGH",
  "docs_reviewed": [],
  "mode": "full",
  "assessment": {
    "consistency": "",
    "structure": "",
    "personalisation": "",
    "compliance": ""
  },
  "checks": [
    {
      "id": "",
      "area": "",
      "label": "",
      "status": "pass|fail|warning|na",
      "note": ""
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
            "text": """
IMPORTANT EXTRACTION RULES:

You must ONLY extract data explicitly present in the uploaded documents.

NEVER invent:
- client names
- adviser names
- practice names
- dates
- risk profiles
- advice types

If a value is not explicitly visible in the documents:
- return an empty string
- do NOT guess
- do NOT use example values
- do NOT fabricate realistic placeholders

The uploaded files are the ONLY source of truth.
Conduct a comprehensive SOA compliance review.
""",
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

            content = (
                doc.content[:_MAX_DOC_CHARS]
                if len(doc.content) > _MAX_DOC_CHARS
                else doc.content
            )

            parts.append({
                "type": "text",
                "text": f"--- {doc.label} ---\n{content}",
            })

    return parts


# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------


def _extract_text_from_response(content_blocks: list) -> str:

    text_blocks = [
        block.text
        for block in content_blocks
        if getattr(block, "type", None) == "text"
    ]

    return text_blocks[-1] if text_blocks else ""


def _parse_json_from_text(text: str) -> dict[str, Any] | None:

    start = text.find("{")
    end = text.rfind("}") + 1

    if start == -1 or end == 0:
        return None

    try:
        return json.loads(text[start:end])

    except json.JSONDecodeError as exc:
        print(f"[soa/review] JSON parse error: {exc}")
        print(f"[soa/review] Raw text:\n{text}")
        return None


# -------------------------------------------------------------------
# Blocking tool loop
# -------------------------------------------------------------------



async def _run_with_tools(
    client: Any,
    system: str,
    messages: list[MessageParam],
) -> dict[str, Any] | None:

    response = await asyncio.to_thread(
        lambda: client.messages.create(
            model=_MODEL,
            max_tokens=_MAX_TOKENS,
            system=system,
            messages=messages,
        )
    )

    text = _extract_text_from_response(response.content)

    print(f"[soa/review] Claude text:\n{text}")

    return _parse_json_from_text(text)

# -------------------------------------------------------------------
# Blocking endpoint
# -------------------------------------------------------------------


@router.post("/soa/review")
async def run_review(payload: ReviewPayload):

    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        return {
            "error": "ANTHROPIC_API_KEY not configured",
        }

    try:

        import anthropic

        has_ref = any(
            "REFERENCE" in d.label.upper()
            for d in payload.documents
        )

        client = anthropic.Anthropic(
            api_key=api_key,
            timeout=600.0,
        )

        messages = cast(
            list[MessageParam],
            [
                {
                    "role": "user",
                    "content": _build_content(payload),
                }
            ],
        )

        print(f"[soa/review] mode = {payload.mode}")
        print(f"[soa/review] documents = {len(payload.documents)}")

        result = await asyncio.wait_for(
            _run_with_tools(
                client=client,
                system=_build_system_prompt(payload.mode, has_ref),
                messages=messages,
            ),
            timeout=600,
        )

        print(f"[soa/review] parsed result = {result}")

        if result is None:
            return {
                "error": "Claude returned no valid JSON response",
            }

        return result

    except asyncio.TimeoutError:

        return {
            "error": "Review timed out after 10 minutes",
        }

    except Exception as exc:

        print(f"[soa/review] API error: {exc}")

        return {
            "error": str(exc),
        }


# -------------------------------------------------------------------
# Streaming endpoint
# -------------------------------------------------------------------


@router.post("/soa/review/stream")
async def stream_review(payload: ReviewPayload):

    api_key = os.getenv("ANTHROPIC_API_KEY")

    async def missing_key():

        event = {
            "done": True,
            "error": "ANTHROPIC_API_KEY not configured",
        }

        yield f"data: {json.dumps(event)}\n\n"

    async def generate_real():

        import anthropic

        success = False

        has_ref = any(
            "REFERENCE" in d.label.upper()
            for d in payload.documents
        )

        system = _build_system_prompt(payload.mode, has_ref)

        client = anthropic.Anthropic(
            api_key=api_key,
            timeout=600.0,
        )

        messages = cast(
            list[MessageParam],
            [
                {
                    "role": "user",
                    "content": _build_content(payload),
                }
            ],
        )

        try:

            for _ in range(6):

                accumulated = ""
                response_content = []
                stop_reason = None

                with client.messages.stream(
                    model=_MODEL,
                    max_tokens=_MAX_TOKENS,
                    system=system,
                    messages=messages,
                ) as stream:

                    for chunk in stream.text_stream:

                        accumulated += chunk

                        yield f"data: {json.dumps({'chunk': chunk})}\n\n"

                    final = stream.get_final_message()

                    stop_reason = final.stop_reason
                    response_content = final.content

                print(
                    f"[soa/review/stream] stop_reason = {stop_reason}"
                )

                if stop_reason == "end_turn":

                    result = _parse_json_from_text(accumulated)

                    if result:

                        success = True

                        done_event = {
                            "done": True,
                            "result": result,
                        }

                        yield (
                            f"data: {json.dumps(done_event)}\n\n"
                        )

                    break

                if stop_reason == "tool_use":

                    chunk_text = "Fetching live ATO thresholds...\n"

                    yield (
                        f"data: {json.dumps({'chunk': chunk_text})}\n\n"
                    )

                    assistant_turn = cast(
                        MessageParam,
                        {
                            "role": "assistant",
                            "content": response_content,
                        },
                    )

                    messages = messages + [assistant_turn]

                    continue

                break

        except Exception as exc:

            print(f"[soa/review/stream] API error: {exc}")

            error_event = {
                "done": True,
                "error": str(exc),
            }

            yield f"data: {json.dumps(error_event)}\n\n"

            return

        if not success:

            yield (
                f"data: {json.dumps({'done': True, 'error': 'No valid response after tool loop'})}\n\n"
            )

    generator = (
        missing_key()
        if not api_key
        else generate_real()
    )

    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )