from fastapi import UploadFile


async def read_uploaded_file(upload_file: UploadFile) -> bytes:
    return await upload_file.read()


def validate_file_type(upload_file: UploadFile) -> bool:
    allowed_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
    }
    return upload_file.content_type in allowed_types
