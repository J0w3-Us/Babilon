export interface BuiltBookPage {
  numero: number;
  texto: string;
  conteo_palabras: number;
}

export interface PaginaValidationSummary {
  expectedPageCount: number;
  actualPageCount: number;
  missingPages: number[];
  duplicatePages: number[];
  totalWords: number;
  wordCountDeltaRatio: number;
  withinTolerance: boolean;
  warnings: string[];
}

interface MiddlePage {
  page_idx: number;
  blocks: unknown[];
}

const IGNORED_BLOCK_TYPES = new Set([
  'header',
  'footer',
  'page_number',
  'page_header',
  'page_footer',
]);

const TITLE_BLOCK_TYPES = new Set([
  'title',
  'doc_title',
  'paragraph_title',
  'heading',
]);

const TERMINAL_PUNCTUATION = /[.!?。！？—]["'”’»)\]}]*\s*$/u;
const STRUCTURAL_LINE = /^(?:[-*+]\s|•\s|\d+[.)]\s|—\s|>\s|#{1,6}\s)/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(extractText).join('');
  if (!isRecord(value)) return '';

  if (typeof value.content === 'string') return value.content;
  if (Array.isArray(value.content)) return value.content.map(extractText).join('');
  if (isRecord(value.content)) return extractText(value.content);
  if (typeof value.text === 'string') return value.text;
  return '';
}

function normalizeLines(value: string): string {
  const lines = value
    .replace(/\r\n?/gu, '\n')
    .replace(/\u00a0/gu, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/gu, ' ').trim());

  const paragraphs: string[] = [];
  let current = '';

  const flush = () => {
    if (current) paragraphs.push(current);
    current = '';
  };

  for (const line of lines) {
    if (!line) {
      flush();
      continue;
    }

    if (!current) {
      current = line;
      continue;
    }

    if (
      TERMINAL_PUNCTUATION.test(current) ||
      STRUCTURAL_LINE.test(line)
    ) {
      flush();
      current = line;
      continue;
    }

    if (/-$/u.test(current) && /^[a-záéíóúüñ]/iu.test(line)) {
      current = `${current.slice(0, -1)}${line}`;
    } else {
      current = `${current} ${line}`;
    }
  }

  flush();
  return paragraphs.join('\n\n').trim();
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/u).length : 0;
}

function imageReference(block: Record<string, unknown>): string {
  const content = isRecord(block.content) ? block.content : undefined;
  const imageSource = isRecord(block.image_source) ? block.image_source : undefined;
  const contentImageSource =
    content && isRecord(content.image_source) ? content.image_source : undefined;
  const candidates = [
    block.image_path,
    block.imagePath,
    block.img_path,
    block.path,
    block.url,
    imageSource?.path,
    contentImageSource?.path,
  ];
  const path = candidates.find((candidate): candidate is string =>
    typeof candidate === 'string' && candidate.trim().length > 0
  );
  const captions = [
    extractText(block.content),
    block.image_caption,
    block.image_footnote,
    block.caption,
    content?.image_caption,
    content?.image_footnote,
  ]
    .map(extractText)
    .map((text) => text.trim())
    .filter(Boolean)
    .filter((text, index, all) => all.indexOf(text) === index);

  const reference = path ? `[Imagen: ${path.trim()}]` : '[Imagen]';
  return captions.length > 0 ? `${reference}\n${captions.join(' ')}` : reference;
}

function parseMiddleJson(input: unknown): Record<string, unknown> {
  let parsed = input;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed) as unknown;
    } catch {
      throw new Error('El middle_json de MinerU no contiene JSON válido.');
    }
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.pages)) {
    throw new Error('El middle_json de MinerU no contiene el arreglo pages esperado.');
  }

  if (parsed.is_full_document === false) {
    throw new Error('MinerU devolvió un resultado parcial, no se puede guardar como libro completo.');
  }

  return parsed;
}

/**
 * Convierte el middle_json de MinerU (page_idx basado en cero) al formato de Mongo.
 * La cuenta física se valida antes de crear páginas para evitar registros fusionados o faltantes.
 */
export function validatePaginasCoverage(
  paginas: BuiltBookPage[],
  expectedPageCount: number,
  referenceWordCount?: number,
  toleranceRatio = 0.1
): PaginaValidationSummary {
  const actualPageCount = paginas.length;
  const missingPages = Array.from({ length: expectedPageCount }, (_, index) => index + 1).filter(
    (pageNumber) => !paginas.some((page) => page.numero === pageNumber)
  );
  const duplicatePages = Array.from(
    new Set(
      paginas
        .map((page) => page.numero)
        .filter((pageNumber, index, all) => all.indexOf(pageNumber) !== index)
    )
  );

  const totalWords = paginas.reduce((sum, page) => sum + Number(page.conteo_palabras ?? 0), 0);
  const wordCountDeltaRatio =
    typeof referenceWordCount === 'number' && referenceWordCount > 0
      ? Math.abs(totalWords - referenceWordCount) / referenceWordCount
      : 0;

  const warnings: string[] = [];
  if (missingPages.length > 0) {
    warnings.push(
      `Se detectaron páginas faltantes: ${missingPages.join(', ')}. Faltan ${missingPages.length} páginas físicas.`
    );
  }
  if (duplicatePages.length > 0) {
    warnings.push(`Se detectaron páginas duplicadas: ${duplicatePages.join(', ')}.`);
  }
  if (typeof referenceWordCount === 'number' && referenceWordCount > 0) {
    if (wordCountDeltaRatio > toleranceRatio) {
      warnings.push(
        `El conteo de palabras difiere del PDF original en ${(wordCountDeltaRatio * 100).toFixed(1)}% (${totalWords} vs ${referenceWordCount}).`
      );
    }
  }

  return {
    expectedPageCount,
    actualPageCount,
    missingPages,
    duplicatePages,
    totalWords,
    wordCountDeltaRatio,
    withinTolerance: typeof referenceWordCount === 'number' && referenceWordCount > 0
      ? wordCountDeltaRatio <= toleranceRatio
      : true,
    warnings,
  };
}

export function buildPaginasFromMiddleJson(
  input: unknown,
  expectedPageCount: number
): BuiltBookPage[] {
  if (!Number.isInteger(expectedPageCount) || expectedPageCount < 1) {
    throw new Error(`Cantidad de páginas físicas inválida: ${expectedPageCount}.`);
  }

  const middleJson = parseMiddleJson(input);
  const sourcePages = middleJson.pages as unknown[];
  const pagesByIndex = new Map<number, MiddlePage>();

  for (const rawPage of sourcePages) {
    if (!isRecord(rawPage)) {
      throw new Error('El middle_json contiene una página con formato inválido.');
    }

    const pageIndex = rawPage.page_idx;
    if (
      typeof pageIndex !== 'number' ||
      !Number.isInteger(pageIndex) ||
      pageIndex < 0 ||
      pageIndex >= expectedPageCount
    ) {
      throw new Error(`MinerU devolvió un page_idx inválido: ${String(pageIndex)}.`);
    }

    if (pagesByIndex.has(pageIndex)) {
      throw new Error(`MinerU duplicó el page_idx ${pageIndex}.`);
    }

    if (!Array.isArray(rawPage.blocks)) {
      throw new Error(`La página física ${pageIndex + 1} no contiene un arreglo blocks.`);
    }

    pagesByIndex.set(pageIndex, {
      page_idx: pageIndex,
      blocks: rawPage.blocks,
    });
  }

  const missingPages = Array.from(
    { length: expectedPageCount },
    (_, pageIndex) => pageIndex
  ).filter((pageIndex) => !pagesByIndex.has(pageIndex));

  if (missingPages.length > 0) {
    throw new Error(
      `MinerU omitió páginas físicas: ${missingPages.map((index) => index + 1).join(', ')}.`
    );
  }

  return Array.from({ length: expectedPageCount }, (_, pageIndex) => {
    const page = pagesByIndex.get(pageIndex);
    if (!page) {
      throw new Error(`No se pudo reconstruir la página física ${pageIndex + 1}.`);
    }

    const blocks = page.blocks
      .map((block, sourceOrder) => ({ block, sourceOrder }))
      .filter(({ block }) => isRecord(block))
      .sort((left, right) => {
        const leftIndex = isRecord(left.block) ? left.block.index : undefined;
        const rightIndex = isRecord(right.block) ? right.block.index : undefined;
        if (typeof leftIndex === 'number' && typeof rightIndex === 'number') {
          return leftIndex - rightIndex;
        }
        return left.sourceOrder - right.sourceOrder;
      });

    const textBlocks: string[] = [];
    let pendingText = '';
    const flushPendingText = () => {
      if (pendingText) textBlocks.push(pendingText);
      pendingText = '';
    };

    for (const { block } of blocks) {
      if (!isRecord(block)) continue;
      const type = typeof block.type === 'string' ? block.type.toLowerCase() : '';

      // Repeated page furniture is layout metadata, not part of the book's narrative.
      if (IGNORED_BLOCK_TYPES.has(type)) continue;

      if (type === 'text') {
        const paragraphs = normalizeLines(extractText(block.content))
          .split(/\n{2,}/u)
          .filter(Boolean);

        paragraphs.forEach((paragraph, paragraphIndex) => {
          if (paragraphIndex > 0) flushPendingText();
          if (pendingText && TERMINAL_PUNCTUATION.test(pendingText)) flushPendingText();

          if (!pendingText) {
            pendingText = paragraph;
          } else if (/-$/u.test(pendingText) && /^[a-záéíóúüñ]/iu.test(paragraph)) {
            pendingText = `${pendingText.slice(0, -1)}${paragraph}`;
          } else {
            // MinerU can split a sentence across adjacent layout blocks; join it until punctuation.
            pendingText = `${pendingText} ${paragraph}`;
          }

          if (TERMINAL_PUNCTUATION.test(pendingText)) flushPendingText();
        });
        continue;
      }

      flushPendingText();
      const text =
        type === 'image'
          ? imageReference(block)
          : normalizeLines(extractText(block.content)) || imageReference(block);
      if (!text) continue;

      textBlocks.push(
        TITLE_BLOCK_TYPES.has(type) && !/^#{1,6}\s/u.test(text)
          ? `## ${text}`
          : text
      );
    }

    flushPendingText();
    const texto = textBlocks.join('\n\n').trim();
    return {
      numero: pageIndex + 1,
      texto,
      conteo_palabras: countWords(texto),
    };
  });
}

/** Normaliza fallback de texto por página conservando la correspondencia física. */
export function buildPaginasFromPageTexts(
  pages: Array<{ pageNumber: number; text: string }>,
  expectedPageCount: number
): BuiltBookPage[] {
  if (!Number.isInteger(expectedPageCount) || expectedPageCount < 1) {
    throw new Error(`Cantidad de páginas físicas inválida: ${expectedPageCount}.`);
  }

  if (pages.length !== expectedPageCount) {
    throw new Error(
      `El extractor devolvió ${pages.length} páginas, pero el PDF tiene ${expectedPageCount}.`
    );
  }

  const repeatedEdgeLines = new Map<string, number>();
  const edgeLinesByPage = pages.map(({ text }) => {
    const nonEmptyLines = text
      .replace(/\r\n?/gu, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const edgeLines = new Set([
      ...nonEmptyLines.slice(0, 3),
      ...nonEmptyLines.slice(-3),
    ]);

    for (const line of edgeLines) {
      repeatedEdgeLines.set(line, (repeatedEdgeLines.get(line) ?? 0) + 1);
    }

    return edgeLines;
  });

  return pages.map((page, index) => {
    if (page.pageNumber !== index + 1) {
      throw new Error(
        `El extractor devolvió la página ${page.pageNumber} donde se esperaba ${index + 1}.`
      );
    }

    const edgeLines = edgeLinesByPage[index];
    if (!edgeLines) {
      throw new Error(`No se pudo inspeccionar el texto de la página ${page.pageNumber}.`);
    }

    // El fallback de texto plano no incluye tipos semánticos; solo elimina folios
    // y líneas repetidas en los bordes, donde suelen imprimirse encabezados y pies.
    const textWithoutPageFurniture = page.text
      .replace(/\r\n?/gu, '\n')
      .split('\n')
      .filter((line) => {
        const normalizedLine = line.trim();
        if (/^p[aá]gina\s+\d+(?:\s+de\s+\d+)?$/iu.test(normalizedLine)) return false;
        return !(
          edgeLines.has(normalizedLine) &&
          (repeatedEdgeLines.get(normalizedLine) ?? 0) >= 3
        );
      })
      .join('\n');
    const texto = normalizeLines(textWithoutPageFurniture);
    return {
      numero: page.pageNumber,
      texto,
      conteo_palabras: countWords(texto),
    };
  });
}
