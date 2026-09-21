#!/usr/bin/env python3
"""
Docling PDF Layout & Table Extractor for LeadSphere.
Parses PDF documents into structured tables, layout text, and lead contact fields.
Outputs JSON payload to STDOUT.
"""
import sys
import json
import re
import os

def clean_cell_text(text):
    if not text:
        return ""
    # Join multiline text within a cell cleanly
    cleaned = str(text).replace('\r\n', ' ').replace('\n', ' ').strip()
    # Fix broken email spaces e.g. "hchandra904 @gmail.com" -> "hchandra904@gmail.com"
    cleaned = re.sub(r'([a-zA-Z0-9._-]+)\s*@\s*([a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)', r'\1@\2', cleaned)
    # Fix broken phone numbers e.g. "+9193070487 00" -> "+919307048700"
    cleaned = re.sub(r'(\+?\d{2,4})\s+(\d{8,10})', r'\1\2', cleaned)
    return cleaned

def parse_with_docling(pdf_path):
    try:
        from docling.document_converter import DocumentConverter
        converter = DocumentConverter()
        result = converter.convert(pdf_path)
        doc = result.document

        tables = []
        for table_idx, table in enumerate(getattr(doc, 'tables', [])):
            df = table.export_to_dataframe()
            headers = [clean_cell_text(c) for c in df.columns]
            rows = []
            for _, row in df.iterrows():
                clean_row = [clean_cell_text(val) for val in row.values]
                if any(clean_row):
                    rows.append(clean_row)
            
            tables.append({
                "table_index": table_idx + 1,
                "headers": headers,
                "rows": rows,
                "row_count": len(rows)
            })

        markdown_text = doc.export_to_markdown() if hasattr(doc, 'export_to_markdown') else ""
        
        return {
            "success": True,
            "engine": "docling",
            "page_count": len(getattr(doc, 'pages', [1])),
            "markdown": markdown_text,
            "tables": tables,
        }
    except Exception:
        return None

def fallback_pdf_extractor(pdf_path):
    raw_text = ""
    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            t = page.extract_text()
            if t:
                raw_text += t + "\n"
    except Exception:
        try:
            with open(pdf_path, 'rb') as f:
                content = f.read().decode('utf-8', errors='ignore')
                strings = re.findall(r'\(([^()]{2,200})\)', content)
                raw_text = "\n".join(strings)
        except Exception as ex:
            raw_text = f"Error reading PDF content: {str(ex)}"

    # Clean raw text broken lines (e.g. email split across 2 lines)
    raw_text = re.sub(r'([a-zA-Z0-9._-]+)\s*\n\s*@\s*\n?\s*([a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)', r'\1@\2', raw_text)
    raw_text = re.sub(r'(\+?\d{8,12})\s*\n\s*(\d{2,4})', r'\1\2', raw_text)

    email_regex = re.compile(r'([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)')
    phone_regex = re.compile(r'(\+?\d{10,13}|\+?\d{2,4}[-.\s]?\d{3,5}[-.\s]?\d{4,5})')

    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]

    # Extract leads record by record using email anchors
    extracted_records = []
    
    # Split text blocks by lead boundaries (index numbers or emails)
    email_matches = list(email_regex.finditer(raw_text))

    if email_matches:
        for idx, match in enumerate(email_matches):
            email = match.group(1)
            start_pos = match.start()
            end_pos = email_matches[idx + 1].start() if idx + 1 < len(email_matches) else len(raw_text)
            block = raw_text[start_pos:end_pos]
            
            # Find phone in block or surrounding text
            phone_m = phone_regex.search(block)
            phone = phone_m.group(1) if phone_m else ""

            # Extract words excluding email and phone
            block_clean = block.replace(email, '').replace(phone, '')
            tokens = [t.strip() for t in block_clean.splitlines() if t.strip()]

            # Distinguish company, name, location
            company = ""
            name = ""
            designation = ""

            for token in tokens:
                token_clean = re.sub(r'^\d+\s*', '', token).strip()
                if not token_clean or len(token_clean) < 2:
                    continue
                if any(kw in token_clean.upper() for kw in ['LIMITED', 'LTD', 'PVT', 'PRIVATE', 'INDUSTRIES', 'ENTERPRISES', 'CO.', 'MACHINERY', 'PRODUCTS', 'SOLVENT', 'FOOD', 'CORP']):
                    company = token_clean
                elif not name and re.match(r'^[A-Za-z\s.]{3,40}$', token_clean):
                    name = token_clean
                elif not designation:
                    designation = token_clean

            if not name and email:
                uname = email.split('@')[0].replace('.', ' ').replace('_', ' ').title()
                name = uname

            extracted_records.append([
                name or "Lead Record",
                email,
                phone,
                company or "Enterprise",
                designation or "Contact"
            ])

    headers = ["Full Name", "Email", "Phone", "Company Name", "Designation"]
    
    if not extracted_records:
        # Fallback to line splitting
        for line in lines:
            parts = [p.strip() for p in re.split(r'[\t,|]', line) if p.strip()]
            if parts:
                extracted_records.append(parts)

    tables = [{
        "table_index": 1,
        "headers": headers,
        "rows": extracted_records,
        "row_count": len(extracted_records)
    }]

    return {
        "success": True,
        "engine": "docling_fallback",
        "page_count": 1,
        "markdown": raw_text,
        "tables": tables
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No PDF file path provided"}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print(json.dumps({"success": False, "error": f"File not found: {pdf_path}"}))
        sys.exit(1)

    result = parse_with_docling(pdf_path)
    if not result:
        result = fallback_pdf_extractor(pdf_path)

    print(json.dumps(result))

if __name__ == "__main__":
    main()
