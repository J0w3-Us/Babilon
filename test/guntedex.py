import requests
import time
import re
from datetime import datetime, timezone
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError

MONGO_URI = "mongodb+srv://luisyaelzapata06_db_user:k8wFlXC51n7uRv3L@proyectos-libros.948mpyk.mongodb.net/"
DB_NAME = "biblioteca_digital"
COLLECCION_NAME = "libros"
TOTAL = 500

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
col = db[COLLECCION_NAME]

# Índice único y disperso (sparse=True para ignorar libros existentes sin gutenberg_id)
try:
    col.create_index("gutenberg_id", unique=True, sparse=True)
except Exception as e:
    print(f"Aviso índice: {e}")

# Headers para evitar bloqueos por parte del servidor de Project Gutenberg
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) BabilonBookCollector/1.0"
}

def clean(texto):
    """Limpia avisos legales iniciales y finales de Project Gutenberg."""
    init = re.search(r"\*\*\* ?START OF (?:THE|THIS)? PROJECT GUTENBERG.*?\*\*\*", texto, re.IGNORECASE)
    fin = re.search(r"\*\*\* ?END OF (?:THE|THIS)? PROJECT GUTENBERG.*?\*\*\*", texto, re.IGNORECASE)

    if init and fin:
        return texto[init.end():fin.start()].strip()
    return texto.strip()

def split_into_pages(texto, chars_per_page=1800):
    """Divide el texto largo en páginas para que Babilon pueda leerlo hoja por hoja."""
    paragraphs = texto.split("\n\n")
    pages = []
    chunk = ""
    page_num = 1

    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        if len(chunk) + len(p) > chars_per_page and len(chunk) > 400:
            pages.append({
                "numero": page_num,
                "texto": chunk.strip(),
                "conteo_palabras": len(chunk.split())
            })
            page_num += 1
            chunk = p
        else:
            chunk += ("\n\n" + p if chunk else p)

    if chunk.strip():
        pages.append({
            "numero": page_num,
            "texto": chunk.strip(),
            "conteo_palabras": len(chunk.split())
        })
    return pages

url = "https://gutendex.com/books/?languages=es"
guardado = 0

print(f"Iniciando descarga e indexación de hasta {TOTAL} libros desde Gutendex...")

while url and guardado < TOTAL:
    try:
        res = requests.get(url, headers=HEADERS, timeout=30)
        res.raise_for_status()
        data = res.json()
    except Exception as e:
        print(f"Error consultando página de Gutendex: {e}")
        time.sleep(3)
        continue

    results = data.get("results", [])
    for b in results:
        if guardado >= TOTAL:
            break

        # Evitar duplicados consultando por ID de Gutenberg
        if col.find_one({"gutenberg_id": b["id"]}):
            continue

        formats = b.get("formats", {})
        # Buscar URL del texto plano (preferir utf-8 si está disponible)
        text_url = None
        for mime, f_url in formats.items():
            if mime.startswith("text/plain"):
                text_url = f_url
                if "utf-8" in mime.lower():
                    break

        if not text_url:
            continue

        try:
            r = requests.get(text_url, headers=HEADERS, timeout=20)
            r.encoding = "utf-8"
            contenido = clean(r.text)
        except Exception as e:
            print(f"Error descargando libro ID {b['id']} ({b.get('title', '')[:30]}): {e}")
            continue

        if len(contenido) < 100:
            continue

        # Estructuración de páginas compatible con Babilon
        paginas = split_into_pages(contenido)
        nombre_autor = b["authors"][0]["name"] if b.get("authors") else "Autor Desconocido"
        portada_url = formats.get("image/jpeg")
        anio = 1900

        if b.get("authors") and b["authors"][0].get("death_year"):
            anio = b["authors"][0]["death_year"]

        # Idioma del libro
        idiomas = b.get("languages", ["es"])
        idioma = idiomas[0] if idiomas else "es"

        # Extracción inteligente de categorías reales a partir de bookshelves y subjects
        categorias_set = set()
        for cat in b.get("bookshelves", []):
            limpio = cat.replace("Browsing:", "").strip()
            if limpio:
                categorias_set.add(limpio)

        subjects_texto = " ".join(b.get("subjects", [])).lower()
        if "fiction" in subjects_texto or "ficción" in subjects_texto or "novela" in subjects_texto:
            categorias_set.add("Ficción")
        if "poetry" in subjects_texto or "poesía" in subjects_texto or "poemas" in subjects_texto:
            categorias_set.add("Poesía")
        if "history" in subjects_texto or "historia" in subjects_texto or "histórica" in subjects_texto:
            categorias_set.add("Historia")
        if "philosophy" in subjects_texto or "filosofía" in subjects_texto:
            categorias_set.add("Filosofía")
        if "drama" in subjects_texto or "teatro" in subjects_texto:
            categorias_set.add("Teatro")
        if "biography" in subjects_texto or "biografía" in subjects_texto:
            categorias_set.add("Biografía")
        if "religion" in subjects_texto or "religión" in subjects_texto or "teología" in subjects_texto:
            categorias_set.add("Religión")

        if not categorias_set:
            categorias_set.add("Clásicos")

        cats = sorted(list(categorias_set))

        # Formato de fecha para MongoDB
        ahora = datetime.now(timezone.utc)

        # ISBN con formato válido
        isbn_val = f"GUTENBERG-{b['id']}"

        # Documento que satisface estrictamente el $jsonSchema de la base de datos:
        # Requeridos: ['titulo', 'autor', 'isbn', 'editorial', 'categorias', 'idioma', 'fecha_actualizacion']
        doc = {
            "gutenberg_id": b["id"],
            "titulo": b["title"],
            "autor": nombre_autor,
            "author": {
                "name": nombre_autor,
                "biography": "",
                "country": ""
            },
            "autores": [a["name"] for a in b.get("authors", [])],
            "isbn": isbn_val,
            "isbn_o_codigo": isbn_val,
            "editorial": "Project Gutenberg",
            "publisher": "Project Gutenberg",
            "categorias": cats,
            "genres": cats,
            "temas": b.get("subjects", []),
            "idioma": idioma,
            "sinopsis": f"Obra clásica de {nombre_autor} disponible en el catálogo de Project Gutenberg.",
            "portada_url": portada_url,
            "coverUrl": portada_url,
            "formato": "txt",
            "fullText": contenido,
            "paginas": paginas,
            "anio_publicacion": anio,
            "publishedYear": anio,
            "fecha_creacion": ahora,
            "fecha_actualizacion": ahora
        }

        try:
            col.insert_one(doc)
            guardado += 1
            print(f"[{guardado}/{TOTAL}] Guardado con éxito: {b['title'][:45]} ({len(paginas)} pág.)")
        except DuplicateKeyError:
            continue
        except Exception as e:
            print("Error al insertar documento:", e)

        time.sleep(0.3)

    url = data.get("next")

print(f"\n¡Listo! Se guardaron exitosamente {guardado} libros en MongoDB.")
