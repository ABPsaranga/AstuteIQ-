import os
from dotenv import load_dotenv
from anthropic import Anthropic

load_dotenv()

key = os.getenv("ANTHROPIC_API_KEY")

print("KEY:", key[:20] if key else "MISSING")

client = Anthropic(api_key=key)

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=50,
    messages=[
        {
            "role": "user",
            "content": "hello"
        }
    ]
)

print(response.content)