import fitz  # PyMuPDF

def extract_text_from_pdf(file_bytes: bytes):  # ✅ renamed
    doc = fitz.open(stream=file_bytes, filetype="pdf")

    pages_data = []

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)

        blocks = page.get_text("blocks")
        page_items = []

        for b in blocks:
            if len(b) < 5:
                continue

            x1, y1, x2, y2, text = b[:5]

            if isinstance(text, str) and text.strip():
                page_items.append({
                    "text": text.strip(),
                    "bbox": [x1, y1, x2, y2],
                    "page": page_num + 1
                })

        pages_data.append(page_items)

    return pages_data