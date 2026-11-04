export interface BookTextMetadata {
  title?: string;
  author?: string;
}

export interface BookExtraSection {
  title: string;
  content: string;
}

export interface StructuredBookDocument {
  cover: {
    title: string;
    author: string;
    text: string;
  };
  body: string;
  extras: BookExtraSection[];
}

export interface CleanBookDocumentResult {
  cleanedMarkdown: string;
  structure: StructuredBookDocument;
}

interface DocumentBlock {
  heading: string;
  content: string;
  isExtra: boolean;
  isChapter: boolean;
}

const PAGINATION_LINE =
  /^[ \t]*(?:(?:#{1,6}[ \t]*)?(?:p[aá]gina|p[aá]g\.?|page)[ \t]*\d+(?:[ \t]+(?:de|of)[ \t]*\d+)?|(?:\d+[ \t]*(?:de|\/)[ \t]*\d+))[ \t]*$/gim;
const PAGE_SEPARATOR_LINE = /^[ \t]*---[ \t]*p[aá]gina[ \t]*\d+[ \t]*---[ \t]*$/gim;
const BROKEN_INITIAL_LETTER =
  /^([ \t]*(?:#{1,6}[ \t]*)?)([A-ZÁÉÍÓÚÜÑ])[ \t]+([a-záéíóúüñ])(?=[ \t]|$)/gmu;
const EXTRA_HEADING =
  /^(?:gu[ií]a\s+(?:(?:del|para)\s+lector|de\s+lectura)(?:\s+.*)?|[íi]ndice(?:\s+.*)?|tabla\s+de\s+contenido(?:s)?|contenidos?|lista\s+de\s+personajes(?:\s+.*)?|personajes|material\s+(?:extra|adicional)(?:\s*[:：].*)?|anexos?(?:\s+(?:\d+|[ivxlcdm]+))?|ap[eé]ndices?(?:\s+(?:\d+|[ivxlcdm]+))?|bibliograf[ií]a(?:\s+.*)?|notas\s+(?:del\s+editor|editoriales)?|prefacio|introducci[oó]n|pr[oó]logo|table\s+of\s+contents)$/iu;
const CHAPTER_HEADING =
  /^(?:(?:cap[ií]tulo|chapter)\s+(?:n[úu]m(?:ero)?\.?\s*)?(?:\d+|[ivxlcdm]+|primero|primera|uno|one)\b|(?:parte|part)\s+(?:1|i|primera|uno)\b)/iu;
const MARKDOWN_HEADING = /^[ \t]{0,3}#{1,6}[ \t]+(.+?)[ \t]*#*[ \t]*$/u;
const NO_INFERRED_HEADERS = new Set<string>();

function comparableText(value: string): string {
  return value
    .replace(MARKDOWN_HEADING, '$1')
    .replace(/[*_`~#]/g, '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

function isRepeatedMetadataLine(
  line: string,
  metadata: BookTextMetadata,
  inferredHeaderLines: ReadonlySet<string> = NO_INFERRED_HEADERS
): boolean {
  const comparableLine = comparableText(line);
  if (!comparableLine) return false;
  if (inferredHeaderLines.has(comparableLine)) return true;

  const title = metadata.title ? comparableText(metadata.title) : '';
  const author = metadata.author ? comparableText(metadata.author) : '';
  if ((title && comparableLine === title) || (author && comparableLine === author)) {
    return true;
  }

  return Boolean(
    title &&
      author &&
      (comparableLine === `${title} ${author}` || comparableLine === `${author} ${title}`)
  );
}

function removeRepeatedPageHeader(
  lines: string[],
  metadata: BookTextMetadata,
  inferredHeaderLines: Set<string>
): string[] {
  const result = [...lines];
  let firstContentLine = 0;
  let inspectedLines = 0;

  while (firstContentLine < result.length && inspectedLines < 5) {
    const line = result[firstContentLine].trim();
    if (!line) {
      firstContentLine += 1;
      continue;
    }

    inspectedLines += 1;
    if (!isRepeatedMetadataLine(line, metadata, inferredHeaderLines)) break;
    result.splice(firstContentLine, 1);
  }

  return result;
}

function removeLeadingPageSeparators(lines: string[]): string[] {
  let inspectingHeader = true;
  let inspectedLines = 0;

  return lines.filter((line) => {
    if (!inspectingHeader || !line.trim()) return true;

    inspectedLines += 1;
    if (inspectedLines > 5 || !/^-{3,}$/u.test(line.trim())) {
      inspectingHeader = false;
      return true;
    }

    return false;
  });
}

function normalizePageLineBreaks(lines: string[]): string {
  const markdownHeadingsPreserved = lines
    .join('\n')
    .replace(/(^|\n)(#{1,6}[ \t]+[^\n]+)(?=\n|$)/g, '\n\n$2\n\n');

  return markdownHeadingsPreserved
    .split(/\n[ \t]*\n+/u)
    .map((paragraph) =>
      paragraph
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' ')
        .replace(/(?<=\p{L})-[ \t]*(?=\p{Ll})/gu, '')
        .replace(/[ \t]{2,}/g, ' ')
    )
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function repairBrokenInitialLetter(lines: string[]): string[] {
  return lines.map((line) => line.replace(BROKEN_INITIAL_LETTER, '$1$2$3'));
}

function getSectionHeading(line: string): string | null {
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;

  const markdownHeading = trimmedLine.match(MARKDOWN_HEADING);
  const heading = markdownHeading?.[1]?.trim() ?? trimmedLine;
  const comparableHeading = heading.replace(/[.:：]+$/u, '').trim();

  if (
    markdownHeading ||
    EXTRA_HEADING.test(comparableHeading) ||
    CHAPTER_HEADING.test(comparableHeading)
  ) {
    return comparableHeading;
  }

  return null;
}

function splitIntoBlocks(markdown: string): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  let currentHeading = '';
  let currentLines: string[] = [];

  const flush = () => {
    const content = currentLines.join('\n').trim();
    if (content) {
      blocks.push({
        heading: currentHeading,
        content,
        isExtra: EXTRA_HEADING.test(currentHeading),
        isChapter: CHAPTER_HEADING.test(currentHeading),
      });
    }
  };

  for (const line of markdown.split('\n')) {
    const heading = getSectionHeading(line);
    if (heading) {
      flush();
      currentHeading = heading;
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }
  flush();

  return blocks;
}

function removeMetadataLines(text: string, metadata: BookTextMetadata): string {
  return text
    .split('\n')
    .filter((line) => !isRepeatedMetadataLine(line.trim(), metadata))
    .join('\n')
    .trim();
}

function firstParagraphs(text: string, count: number): string {
  return text
    .split(/\n[ \t]*\n+/u)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, count)
    .join('\n\n');
}

/**
 * Removes known page furniture and repeated page headers, then repairs a split
 * initial letter only at the beginning of each extracted page.
 */
export function sanitizeBookMarkdown(
  markdown: string,
  metadata: BookTextMetadata = {}
): string {
  if (typeof markdown !== 'string' || markdown.trim() === '') return '';

  const normalized = markdown
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\f/g, '\n--- Página 0 ---\n');
  const pageChunks = normalized.split(PAGE_SEPARATOR_LINE).filter((page) => page.trim());
  const firstPageLines = (pageChunks[0] ?? '')
    .split('\n')
    .filter((line) => line.trim())
    .slice(0, 3);
  const inferredHeaderLines = new Set<string>();

  for (const candidate of firstPageLines) {
    const comparableCandidate = comparableText(candidate);
    if (!comparableCandidate || CHAPTER_HEADING.test(candidate.trim())) continue;

    const isRepeated = pageChunks.slice(1).some((page) =>
      page
        .split('\n')
        .filter((line) => line.trim())
        .slice(0, 5)
        .some((line) => comparableText(line) === comparableCandidate)
    );
    if (isRepeated) inferredHeaderLines.add(comparableCandidate);
  }

  return pageChunks
    .map((page, index) => {
      let lines = page
        .replace(PAGINATION_LINE, '')
        .split('\n');
      if (index > 0) {
        lines = removeRepeatedPageHeader(lines, metadata, inferredHeaderLines);
      }
      lines = repairBrokenInitialLetter(lines);
      return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    })
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Separates presentation/front matter, the main reading body, and recognized
 * reference material without deleting any non-empty source section.
 */
export function structureBookMarkdown(
  cleanedMarkdown: string,
  metadata: BookTextMetadata = {}
): StructuredBookDocument {
  const normalized = cleanedMarkdown.replace(PAGE_SEPARATOR_LINE, '').trim();
  const blocks = splitIntoBlocks(normalized);
  const firstChapterIndex = blocks.findIndex((block) => block.isChapter);
  const extraIndexes = new Set<number>();
  const extras: BookExtraSection[] = [];

  blocks.forEach((block, index) => {
    if (!block.isExtra) return;

    let end = index + 1;
    while (
      end < blocks.length &&
      !blocks[end].isChapter &&
      !blocks[end].isExtra &&
      (firstChapterIndex >= 0 || !blocks[end].heading)
    ) {
      end += 1;
    }

    for (let extraIndex = index; extraIndex < end; extraIndex += 1) {
      extraIndexes.add(extraIndex);
    }

    const [headingLine, ...headingContent] = block.content.split('\n');
    const content = [
      headingContent.join('\n'),
      ...blocks.slice(index + 1, end).map((nextBlock) => nextBlock.content),
    ]
      .filter(Boolean)
      .join('\n\n')
      .trim();
    extras.push({
      title: getSectionHeading(headingLine) || block.heading,
      content,
    });
  });

  const bodyBlocks =
    firstChapterIndex >= 0
      ? blocks
          .slice(firstChapterIndex)
          .filter((_, index) => !extraIndexes.has(index + firstChapterIndex))
      : blocks.filter((_, index) => !extraIndexes.has(index));

  if (firstChapterIndex < 0 && bodyBlocks.length > 0) {
    bodyBlocks[0] = {
      ...bodyBlocks[0],
      content: removeMetadataLines(bodyBlocks[0].content, metadata),
    };
  }

  const preChapterText =
    firstChapterIndex >= 0
      ? blocks
          .slice(0, firstChapterIndex)
          .filter((_, index) => !extraIndexes.has(index))
          .map((block) => block.content)
          .join('\n\n')
      : '';

  return {
    cover: {
      title: metadata.title?.trim() ?? '',
      author: metadata.author?.trim() ?? '',
      text: firstParagraphs(removeMetadataLines(preChapterText, metadata), 3),
    },
    body: bodyBlocks.map((block) => block.content).filter(Boolean).join('\n\n').trim(),
    extras,
  };
}

export function formatBookDocumentForUpload(
  document: StructuredBookDocument
): string {
  const body = document.body.trim();
  const extras = document.extras
    .map(({ title, content }) => `## Material extra: ${title}\n\n${content.trim()}`)
    .filter((section) => section.trim().length > 0)
    .join('\n\n');

  return [body, extras].filter(Boolean).join('\n\n').trim();
}

export function sanitizeBookPages<T extends { numero: number; texto: string }>(
  pages: readonly T[],
  metadata: BookTextMetadata = {}
): T[] {
  const preparedPages = pages.map((page) => {
    const normalizedText = page.texto
      .replace(/\r\n?/g, '\n')
      .replace(/\u0000/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\f/g, '\n');

    return {
      page,
      lines: normalizedText
        .replace(PAGINATION_LINE, '')
        .replace(PAGE_SEPARATOR_LINE, '')
        .split('\n'),
    };
  });
  const headerLineCounts = new Map<string, number>();

  preparedPages.forEach(({ lines }) => {
    const pageHeaders = new Set(
      lines
        .filter((line) => line.trim())
        .slice(0, 5)
        .map(comparableText)
        .filter((header) => header.length >= 8)
    );

    pageHeaders.forEach((header) => {
      headerLineCounts.set(header, (headerLineCounts.get(header) ?? 0) + 1);
    });
  });

  const inferredHeaderLines = new Set(
    [...headerLineCounts]
      .filter(([, count]) => count > 1)
      .map(([header]) => header)
  );

  return preparedPages.map(({ page, lines }) => {
    const cleanedLines = removeLeadingPageSeparators(
      repairBrokenInitialLetter(
        removeRepeatedPageHeader(lines, metadata, inferredHeaderLines)
      )
    );

    return {
      ...page,
      texto: normalizePageLineBreaks(cleanedLines),
    };
  });
}

export function cleanAndStructureBookDocument(
  markdown: string,
  metadata: BookTextMetadata = {}
): CleanBookDocumentResult {
  const cleanedMarkdown = sanitizeBookMarkdown(markdown, metadata);
  return {
    cleanedMarkdown,
    structure: structureBookMarkdown(cleanedMarkdown, metadata),
  };
}
