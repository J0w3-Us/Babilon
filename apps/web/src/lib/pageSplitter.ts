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

function countWords(str: string): number {
  return str.trim() ? str.trim().split(/\s+/).length : 0;
}

function toParsedPage(numero: number, content: string): ParsedPage {
  const texto = cleanPageContent(content);
  return { numero, texto, conteo_palabras: countWords(texto) };
}

/**
 * Parses explicit page boundaries without subdividing a physical page by character count.
 * Returns null when the document contains no recognized page separators.
 */
export function parseSeparatedPages(fullText: string): ParsedPage[] | null {
  const trimmed = fullText.trim();
  if (!trimmed) return null;

  const numberedSeparator =
    /(?:^|\r?\n)[ \t]*(?:---[ \t]*P[aá]gina[ \t]*(\d+)[ \t]*---|#{1,3}[ \t]*P[aá]gina[ \t]*(\d+))[ \t]*(?=\r?\n|$)/gi;
  const numberedMatches = Array.from(trimmed.matchAll(numberedSeparator));

  if (numberedMatches.length > 0) {
    return numberedMatches.map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = numberedMatches[index + 1]?.index ?? trimmed.length;
      const pageNumber = Number(match[1] ?? match[2]);
      return toParsedPage(Number.isSafeInteger(pageNumber) && pageNumber > 0 ? pageNumber : index + 1,
        trimmed.slice(start, end));
    });
  }

  const horizontalSeparator = /(?:^|\r?\n)[ \t]*(?:---|[*]{3,})[ \t]*(?=\r?\n|$)/g;
  const horizontalMatches = Array.from(trimmed.matchAll(horizontalSeparator));
  if (horizontalMatches.length === 0) return null;

  return horizontalMatches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = horizontalMatches[index + 1]?.index ?? trimmed.length;
    return toParsedPage(index + 1, trimmed.slice(start, end));
  });
}

/**
 * Divide un texto continuo o con separadores en un array de páginas limpias y legibles.
 * Detecta:
 * - Separadores estándar: `--- Página X ---`
 * - Separadores Markdown: `---` o `***`
 * - Encabezados de página: `## Página X` o `# Página X`
 * - Solo divide texto sin separadores por párrafos cuando excede 2000 caracteres.
 */
export function splitTextIntoPages(fullText: string): ParsedPage[] {
  if (!fullText || !fullText.trim()) {
    return [];
  }

  const trimmed = fullText.trim();
  const separatedPages = parseSeparatedPages(trimmed);
  if (separatedPages) return separatedPages;

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

/**
 * Convierte un array de páginas al formato de documento legible estándar para Babilon:
 * Cada página separada por `\n\n--- Página N ---\n\n`
 */
export function formatPagesToDocument(pages: Array<{ numero: number; texto: string }>): string {
  return pages
    .map((p) => `${PAGE_SEPARATOR(p.numero)}\n\n${p.texto.trim()}`)
    .join('\n\n');
}
