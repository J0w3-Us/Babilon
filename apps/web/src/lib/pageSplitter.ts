/**
 * Utilitario unificado para dividir, estructurar y formatear texto en páginas reales.
 * Compatible con extracciones PDF (MinerU/unpdf), archivos Markdown y texto plano (.txt).
 */

export interface ParsedPage {
  numero: number;
  texto: string;
  conteo_palabras: number;
}

export const PAGE_SEPARATOR = (pageNum: number) => `--- Página ${pageNum} ---`;
const MAX_PAGE_CHARACTERS = 3500;

/**
 * Divide un texto continuo o con separadores en un array de páginas limpias y legibles.
 * Detecta:
 * - Separadores estándar: `--- Página X ---`
 * - Separadores Markdown: `---` o `***`
 * - Encabezados de página: `## Página X` o `# Página X`
 * - Si no contiene separadores y excede 2000 caracteres, divide inteligentemente por párrafos.
 */
export function splitTextIntoPages(fullText: string): ParsedPage[] {
  if (!fullText || !fullText.trim()) {
    return [];
  }

  const trimmed = fullText.trim();

  // 1. Detectar patrón explícito "--- Página N ---"
  const formalPattern = /(?:^|\n)\s*---\s*P[aá]gina\s*(\d+)\s*---\s*(?:\n|$)/gi;
  if (formalPattern.test(trimmed)) {
    const rawParts = trimmed.split(/(?:^|\n)\s*---\s*P[aá]gina\s*\d+\s*---\s*(?:\n|$)/gi);
    const pages = rawParts
      .map((p) => cleanPageContent(p))
      .filter((p) => p.length > 0)
      .flatMap(splitLongPage)
      .map((texto, idx) => ({ numero: idx + 1, texto, conteo_palabras: countWords(texto) }));

    if (pages.length > 0) return pages;
  }

  // 2. Detectar encabezados "## Página N" o "# Página N"
  const headerPattern = /(?:^|\n)\s*#{1,3}\s*P[aá]gina\s*\d+\s*(?:\n|$)/gi;
  if (headerPattern.test(trimmed)) {
    const rawParts = trimmed.split(/(?:^|\n)\s*#{1,3}\s*P[aá]gina\s*\d+\s*(?:\n|$)/gi);
    const pages = rawParts
      .map((p) => cleanPageContent(p))
      .filter((p) => p.length > 0)
      .flatMap(splitLongPage)
      .map((texto, idx) => ({ numero: idx + 1, texto, conteo_palabras: countWords(texto) }));

    if (pages.length > 0) return pages;
  }

  // 3. Detectar divisores horizontales de Markdown: `\n---\n` o `\n***\n`
  const mdHrPattern = /(?:^|\n)\s*(?:---|[*]{3,})\s*(?:\n|$)/g;
  if (mdHrPattern.test(trimmed)) {
    const rawParts = trimmed.split(/(?:^|\n)\s*(?:---|[*]{3,})\s*(?:\n|$)/g);
    const pages = rawParts
      .map((p) => cleanPageContent(p))
      .filter((p) => p.length > 0)
      .flatMap(splitLongPage)
      .map((texto, idx) => ({ numero: idx + 1, texto, conteo_palabras: countWords(texto) }));

    if (pages.length > 0) return pages;
  }

  // 4. Si es un texto largo continuo sin marcas (> 1800 caracteres), dividir naturalmente por párrafos
  if (trimmed.length > 2000) {
    const paragraphs = trimmed.split(/\n\s*\n/);
    const generatedPages: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      const p = paragraph.trim();
      if (!p) continue;

      if (p.length > MAX_PAGE_CHARACTERS) {
        if (currentChunk) generatedPages.push(currentChunk.trim());
        generatedPages.push(...splitLongPage(p));
        currentChunk = '';
        continue;
      }

      const combined = currentChunk ? `${currentChunk}\n\n${p}` : p;
      if (combined.length > 1800 && currentChunk.length > 0) {
        generatedPages.push(currentChunk.trim());
        currentChunk = p;
      } else {
        currentChunk = combined;
      }
    }

    if (currentChunk.trim()) generatedPages.push(currentChunk.trim());

    if (generatedPages.length > 0) {
      return generatedPages.map((texto, idx) => ({
        numero: idx + 1,
        texto,
        conteo_palabras: countWords(texto),
      }));
    }
  }

  function splitLongPage(text: string): string[] {
    const characters = Array.from(text);
    const chunks: string[] = [];
    let start = 0;

    while (characters.length - start > MAX_PAGE_CHARACTERS) {
      let end = start + MAX_PAGE_CHARACTERS;
      const preferredMinimum = start + Math.floor(MAX_PAGE_CHARACTERS * 0.75);
      for (let index = end - 1; index >= preferredMinimum; index -= 1) {
        if (/\s/.test(characters[index])) {
          end = index + 1;
          break;
        }
      }
      chunks.push(characters.slice(start, end).join('').trim());
      start = end;
    }

    const remainder = characters.slice(start).join('').trim();
    if (remainder) chunks.push(remainder);
    return chunks;
  }

  // 5. Fallback: una sola página
  return [
    {
      numero: 1,
      texto: cleanPageContent(trimmed),
      conteo_palabras: countWords(trimmed),
    },
  ];
}

/**
 * Limpia el contenido de una página retirando encabezados de página residuales
 * y espacios vacíos innecesarios.
 */
function cleanPageContent(content: string): string {
  return content
    .replace(/^\s*#{1,3}\s*P[aá]gina\s*\d+\s*\n*/i, '')
    .replace(/^\s*---\s*P[aá]gina\s*\d+\s*---\s*\n*/i, '')
    .trim();
}

function countWords(str: string): number {
  return str.trim() ? str.trim().split(/\s+/).length : 0;
}

/**
 * Convierte un array de páginas al formato de documento legible estándar para Babilon:
 * Cada página separada por `\n\n--- Página N ---\n\n`
 */
export function formatPagesToDocument(pages: Array<{ numero: number; texto: string }>): string {
  return pages
    .map((p) => `${PAGE_SEPARATOR(p.numero)}\n\n${p.texto.trim()}`)
    .join('\n\n');
}
