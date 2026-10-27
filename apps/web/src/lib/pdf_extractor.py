import sys
import os
import json
import shutil
import subprocess

def extract_with_mineru_cli(pdf_path, output_dir):
    """
    Intenta ejecutar el comando oficial de MinerU (magic-pdf / mineru)
    y lee el archivo .md generado.
    """
    # MinerU se invoca comúnmente con magic-pdf o mineru
    cli_command = None
    if shutil.which("magic-pdf"):
        cli_command = "magic-pdf"
    elif shutil.which("mineru"):
        cli_command = "mineru"

    if not cli_command:
        return None

    os.makedirs(output_dir, exist_ok=True)
    # Ejecuta: magic-pdf -p <pdf_path> -o <output_dir> -m auto
    cmd = [cli_command, "-p", pdf_path, "-o", output_dir, "-m", "auto"]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    if proc.returncode != 0:
        return None

    # Buscar el archivo .md generado en el directorio de salida
    for root, _, files in os.walk(output_dir):
        for f in files:
            if f.endswith(".md"):
                md_path = os.path.join(root, f)
                with open(md_path, "r", encoding="utf-8", errors="ignore") as md_file:
                    return {
                        "markdown": md_file.read(),
                        "engine": "mineru-official-cli",
                    }
    return None

def extract_with_pymupdf(pdf_path):
    """
    Fallback robusto y ultra-rápido usando PyMuPDF.
    """
    import fitz # PyMuPDF
    doc = fitz.open(pdf_path)
    title = doc.metadata.get('title') or ''
    author = doc.metadata.get('author') or ''
    
    pages_md = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text('text')
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        page_md = f"## Página {page_num + 1}\n\n" + "\n\n".join(lines)
        pages_md.append(page_md)
        
    full_markdown = "\n\n---\n\n".join(pages_md)
    return {
        "title": title,
        "author": author,
        "pageCount": len(doc),
        "markdown": full_markdown,
        "engine": "pymupdf-parser"
    }

def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("--help", "-h"):
        print("Uso: python apps/web/src/lib/pdf_extractor.py <ruta_del_pdf> [--save-md <salida.md>]", file=sys.stderr)
        print("Ejemplo: python apps/web/src/lib/pdf_extractor.py mi_libro.pdf --save-md resultado.md", file=sys.stderr)
        sys.exit(0)

        
    pdf_path = sys.argv[1]
    if not os.path.isfile(pdf_path):
        print(json.dumps({"error": f"El archivo no existe: {pdf_path}"}))
        sys.exit(1)

    # Determinar ruta del archivo .md a generar
    save_md_path = None
    if "--save-md" in sys.argv:
        idx = sys.argv.index("--save-md")
        if idx + 1 < len(sys.argv):
            save_md_path = sys.argv[idx + 1]
    
    # Por defecto, SIEMPRE generar el .md junto al archivo PDF o en el directorio actual
    if not save_md_path:
        base_name = os.path.splitext(pdf_path)[0]
        save_md_path = f"{base_name}.md"

    temp_output_dir = os.path.join(os.path.dirname(pdf_path), "_mineru_out")
    
    # 1. Intentar con CLI oficial de MinerU si está instalado en el sistema
    result = extract_with_mineru_cli(pdf_path, temp_output_dir)
    
    # 2. Si no está el CLI de MinerU o falló, usar el extractor integrado
    if not result:
        result = extract_with_pymupdf(pdf_path)

    # Guardar automáticamente el archivo .md en disco
    try:
        with open(save_md_path, "w", encoding="utf-8") as f:
            f.write(result.get("markdown", ""))
        result["savedMarkdownPath"] = os.path.abspath(save_md_path)
        print(f"\n>>> [OK] Archivo Markdown generado con éxito: {os.path.abspath(save_md_path)}\n", file=sys.stderr)
    except Exception as e:
        print(f"[!] Error al escribir archivo .md: {e}", file=sys.stderr)

    # Salida en JSON estándar para consumo por scripts o Next.js
    print(json.dumps(result, ensure_ascii=False))

if __name__ == '__main__':
    main()
