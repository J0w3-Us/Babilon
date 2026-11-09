import json
import os
import shutil
import subprocess
import sys


def is_middle_json(value):
    if not isinstance(value, dict) or not isinstance(value.get("pages"), list):
        return False

    return all(
        isinstance(page, dict)
        and isinstance(page.get("page_idx"), int)
        and isinstance(page.get("blocks"), list)
        for page in value["pages"]
    )


def extract_with_mineru_cli(pdf_path, output_dir):
    """Run MinerU's structured-output CLI for the complete physical PDF."""
    cli_command = shutil.which("mineru-kit")
    if not cli_command:
        return None

    os.makedirs(output_dir, exist_ok=True)
    command = [
        cli_command,
        "parse",
        pdf_path,
        "--output",
        output_dir,
        "--format",
        "middle_json",
        "--pages",
        "all",
        "--ocr-mode",
        "auto",
    ]

    try:
        process = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )
    except OSError as error:
        print(f"No se pudo iniciar MinerU: {error}", file=sys.stderr)
        return None

    if process.returncode != 0:
        print(
            f"MinerU terminó con código {process.returncode}: {process.stderr.strip()}",
            file=sys.stderr,
        )
        return None

    for root, _, filenames in os.walk(output_dir):
        for filename in filenames:
            if not filename.lower().endswith(".json"):
                continue

            json_path = os.path.join(root, filename)
            try:
                with open(json_path, "r", encoding="utf-8") as source:
                    middle_json = json.load(source)
            except (OSError, json.JSONDecodeError):
                continue

            if is_middle_json(middle_json):
                return {
                    "middleJson": middle_json,
                    "engine": "mineru-kit-middle-json",
                }

    print("MinerU no generó un middle_json válido.", file=sys.stderr)
    return None


def extract_with_pymupdf(pdf_path):
    """Fallback sin OCR que conserva exactamente un elemento por página física."""
    import fitz

    with fitz.open(pdf_path) as document:
        pages = [
            {
                "pageNumber": page_number + 1,
                "markdown": document[page_number].get_text("text"),
            }
            for page_number in range(document.page_count)
        ]

        return {
            "title": document.metadata.get("title") or "",
            "author": document.metadata.get("author") or "",
            "subject": document.metadata.get("subject") or "",
            "pageCount": document.page_count,
            "pages": pages,
            "engine": "pymupdf-page-text",
        }


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("--help", "-h"):
        print(
            "Uso: python pdf_extractor.py <ruta_del_pdf> [directorio_salida]",
            file=sys.stderr,
        )
        sys.exit(0)

    pdf_path = sys.argv[1]
    if not os.path.isfile(pdf_path):
        print(json.dumps({"error": f"El archivo no existe: {pdf_path}"}))
        sys.exit(1)

    output_dir = (
        sys.argv[2]
        if len(sys.argv) > 2
        else os.path.join(os.path.dirname(pdf_path), "_mineru_out")
    )

    result = extract_with_mineru_cli(pdf_path, output_dir)
    if result is None:
        try:
            result = extract_with_pymupdf(pdf_path)
        except Exception as error:
            print(json.dumps({"error": f"No se pudo extraer el PDF: {error}"}))
            sys.exit(1)

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
