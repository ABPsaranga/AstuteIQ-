from fastapi import UploadFile
import magic  # pip install python-magic

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


async def extract_file_bytes(file: UploadFile) -> bytes:
    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise ValueError("File too large")

    return content


def validate_file_type(filename: str, content: bytes) -> bool:
    mime = magic.from_buffer(content, mime=True)

    if mime not in ALLOWED_MIME_TYPES:
        return False

    return True


def basic_malware_scan(content: bytes) -> bool:
    suspicious_patterns = [b"<script>", b"eval(", b"base64", b"powershell"]

    for pattern in suspicious_patterns:
        if pattern in content.lower():
            return False

    return True