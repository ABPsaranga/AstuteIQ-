from app.services.anthropic_service import run_claude
from app.db.supabase_client import supabase
from datetime import datetime
import json


async def process_review(user_id, practice_id, client_name, file_bytes):
    try:
        file_text = file_bytes.decode(errors="ignore")[:20000]

        result = await run_claude(file_text)
        parsed = json.loads(result)

        risk_level = parsed.get("risk_level")
        findings = parsed.get("findings")

        supabase.table("reviews").insert({
            "user_id": user_id,
            "client_name": client_name,
            "mode": "full",
            "risk_level": risk_level,
            "findings": findings,
            "created_at": datetime.utcnow().isoformat()
        }).execute()

        return parsed

    except Exception as e:
        print("ERROR:", e)
        raise