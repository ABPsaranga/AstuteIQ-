chunks = split_text(text, max_tokens=3000)

for chunk in chunks:
    analyze_soa(chunk)