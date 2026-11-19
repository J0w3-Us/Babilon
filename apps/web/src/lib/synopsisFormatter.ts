/**
 * ============================================================================
 * FORMATEADOR UNIFICADO Y REPARADOR DE SINOPSIS EDITORIAL
 * ============================================================================
 * - Repara caracteres corruptos (UTF-8 mojibake, entidades HTML y símbolos U+FFFD).
 * - Normaliza puntuación, comillas, espacios y saltos de línea.
 * - Aplica un formato único, equilibrado y legible (máx. ~560 caracteres,
 *   cortando siempre en finales de oración y dividiendo en 1 o 2 párrafos limpios).
 */

const DEFAULT_MAX_LENGTH = 560;
const SOFT_MAX_LENGTH = 640;

const HTML_ENTITY_MAP: Record<string, string> = {
  quot: '"',
  apos: "'",
  amp: '&',
  lt: '<',
  gt: '>',
  nbsp: ' ',
  laquo: '«',
  raquo: '»',
  ldquo: '"',
  rdquo: '"',
  lsquo: "'",
  rsquo: "'",
  mdash: '—',
  ndash: '–',
  hellip: '…',
  iexcl: '¡',
  iquest: '¿',
  aacute: 'á',
  eacute: 'é',
  iacute: 'í',
  oacute: 'ó',
  uacute: 'ú',
  ntilde: 'ñ',
  uuml: 'ü',
  Aacute: 'Á',
  Eacute: 'É',
  Iacute: 'Í',
  Oacute: 'Ó',
  Uacute: 'Ú',
  Ntilde: 'Ñ',
  Uuml: 'Ü',
};

const MOJIBAKE_MAP: Array<[RegExp, string]> = [
  [/Ã¡/g, 'á'],
  [/Ã©/g, 'é'],
  [/Ã­/g, 'í'],
  [/Ã³/g, 'ó'],
  [/Ãº/g, 'ú'],
  [/Ã±/g, 'ñ'],
  [/Ã¼/g, 'ü'],
  [/Ã\u0081/g, 'Á'],
  [/Ã‰/g, 'É'],
  [/Ã\u008D/g, 'Í'],
  [/Ã“/g, 'Ó'],
  [/Ãš/g, 'Ú'],
  [/Ã‘/g, 'Ñ'],
  [/Ãœ/g, 'Ü'],
  [/â€œ/g, '"'],
  [/â€\u009D/g, '"'],
  [/â€™/g, "'"],
  [/â€˜/g, "'"],
  [/â€”/g, '—'],
  [/â€“/g, '–'],
  [/â€¦/g, '…'],
  [/Â«/g, '«'],
  [/Â»/g, '»'],
  [/Â¿/g, '¿'],
  [/Â¡/g, '¡'],
  [/Â /g, ' '],
];

function applyCaseLike(source: string, replacement: string): string {
  if (!source) return replacement;
  const letters = source.replace(/\uFFFD/g, '');
  if (letters.length > 1 && letters === letters.toUpperCase()) {
    return replacement.toUpperCase();
  }
  if (source[0] !== '\uFFFD' && source[0] === source[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

const SPANISH_FFFD_WORD_RULES: Array<[RegExp, string]> = [
  // Nombres literarios frecuentes
  [/\bp\uFFFDrez\b/gi, 'pérez'],
  [/\bgald\uFFFDs\b/gi, 'galdós'],
  [/\bmart\uFFFD\b/gi, 'martí'],
  [/\bbaz\uFFFDn\b/gi, 'bazán'],
  [/\brub\uFFFDn\b/gi, 'rubén'],
  [/\bdar\uFFFDo\b/gi, 'darío'],
  [/\bgarc\uFFFDa\b/gi, 'garcía'],
  [/\bb\uFFFDcquer\b/gi, 'bécquer'],
  [/\bcort\uFFFDzar\b/gi, 'cortázar'],
  [/\bg\uFFFDngora\b/gi, 'góngora'],
  [/\bcalder\uFFFDn\b/gi, 'calderón'],
  [/\bjim\uFFFDnez\b/gi, 'jiménez'],
  [/\bl\uFFFDpez\b/gi, 'lópez'],
  [/\bg\uFFFDmez\b/gi, 'gómez'],
  [/\bfern\uFFFDndez\b/gi, 'fernández'],
  [/\brodr\uFFFDguez\b/gi, 'rodríguez'],
  [/\bs\uFFFDnchez\b/gi, 'sánchez'],
  [/\bmart\uFFFDnez\b/gi, 'martínez'],
  [/\bgonz\uFFFDlez\b/gi, 'gonzález'],
  [/\bd\uFFFDaz\b/gi, 'díaz'],

  // Palabras funcionales y adverbios de altísima frecuencia
  [/\bm\uFFFDs\b/gi, 'más'],
  [/\bs\uFFFDlo\b/gi, 'sólo'],
  [/\b\uFFFDl\b/gi, 'él'],
  [/\bcom\uFFFDn\b/gi, 'común'],
  [/\btrav\uFFFDs\b/gi, 'través'],
  [/\btambi\uFFFDn\b/gi, 'también'],
  [/\bdespu\uFFFDs\b/gi, 'después'],
  [/\badem\uFFFDs\b/gi, 'además'],
  [/\bquiz\uFFFDs\b/gi, 'quizás'],
  [/\bquiz\uFFFD\b/gi, 'quizá'],
  [/\bas\uFFFD\b/gi, 'así'],
  [/\baqu\uFFFD\b/gi, 'aquí'],
  [/\ball\uFFFD\b/gi, 'allí'],
  [/\bah\uFFFD\b/gi, 'ahí'],
  [/\best\uFFFD\b/gi, 'está'],
  [/\best\uFFFDn\b/gi, 'están'],
  [/\bser\uFFFD\b/gi, 'será'],
  [/\bser\uFFFDn\b/gi, 'serán'],
  [/\bpodr\uFFFD\b/gi, 'podrá'],
  [/\bhabr\uFFFD\b/gi, 'habrá'],
  [/\btendr\uFFFD\b/gi, 'tendrá'],
  [/\ba\uFFFDn\b/gi, 'aún'],
  [/\bseg\uFFFDn\b/gi, 'según'],
  [/\bdetr\uFFFDs\b/gi, 'detrás'],
  [/\bjam\uFFFDs\b/gi, 'jamás'],
  [/\bd\uFFFDnde\b/gi, 'dónde'],
  [/\bcu\uFFFDndo\b/gi, 'cuándo'],
  [/\bc\uFFFDmo\b/gi, 'cómo'],
  [/\bqu\uFFFD\b/gi, 'qué'],
  [/\bqui\uFFFDn\b/gi, 'quién'],
  [/\bcu\uFFFDl\b/gi, 'cuál'],
  [/\bcu\uFFFDnto\b/gi, 'cuánto'],
  [/\bporqu\uFFFD\b/gi, 'porqué'],

  // Sustantivos y adjetivos frecuentes con tilde o ñ
  [/\bd\uFFFDa(s)?\b/gi, 'día$1'],
  [/\ba\uFFFDo(s)?\b/gi, 'año$1'],
  [/\bni\uFFFDo(s)?\b/gi, 'niño$1'],
  [/\bni\uFFFDa(s)?\b/gi, 'niña$1'],
  [/\bse\uFFFDor(a|es|as|ita)?\b/gi, 'señor$1'],
  [/\bsue\uFFFDo(s)?\b/gi, 'sueño$1'],
  [/\bpeque\uFFFD([oa]s?)\b/gi, 'pequeñ$1'],
  [/\bespa\uFFFDa\b/gi, 'españa'],
  [/\bespa\uFFFDol(a|es|as)?\b/gi, 'español$1'],
  [/\bextra\uFFFD([oa]s?)\b/gi, 'extrañ$1'],
  [/\benga\uFFFD([oa]s?|ar)\b/gi, 'engañ$1'],
  [/\bmonta\uFFFDa(s)?\b/gi, 'montaña$1'],
  [/\bma\uFFFDana(s)?\b/gi, 'mañana$1'],
  [/\bcoraz\uFFFDn\b/gi, 'corazón'],
  [/\braz\uFFFDn\b/gi, 'razón'],
  [/\bj\uFFFDvenes\b/gi, 'jóvenes'],
  [/\bim\uFFFDgenes\b/gi, 'imágenes'],
  [/\bp\uFFFDgina(s)?\b/gi, 'página$1'],
  [/\bcap\uFFFDtulo(s)?\b/gi, 'capítulo$1'],
  [/\bt\uFFFDtulo(s)?\b/gi, 'título$1'],
  [/\bpr\uFFFDlogo(s)?\b/gi, 'prólogo$1'],
  [/\bep\uFFFDlogo(s)?\b/gi, 'epílogo$1'],
  [/\bn\uFFFDmero(s)?\b/gi, 'número$1'],
  [/\bh\uFFFDroe(s)?\b/gi, 'héroe$1'],
  [/\b\uFFFDpoca(s)?\b/gi, 'época$1'],
  [/\b\uFFFDltim([oa]s?)\b/gi, 'últim$1'],
  [/\b\uFFFDnic([oa]s?)\b/gi, 'únic$1'],
  [/\bp\uFFFDblic([oa]s?)\b/gi, 'públic$1'],
  [/\bf\uFFFDsic([oa]s?)\b/gi, 'físic$1'],
  [/\bc\uFFFDmod([oa]s?)\b/gi, 'cómod$1'],
  [/\bc\uFFFDndid([oa]s?)\b/gi, 'cándid$1'],
  [/\bm\uFFFDsica\b/gi, 'música'],
  [/\bm\uFFFDgic([oa]s?)\b/gi, 'mágic$1'],
  [/\bcl\uFFFDsic([oa]s?)\b/gi, 'clásic$1'],
  [/\btr\uFFFDgic([oa]s?)\b/gi, 'trágic$1'],
  [/\bhist\uFFFDric([oa]s?)\b/gi, 'históric$1'],
  [/\brom\uFFFDntic([oa]s?)\b/gi, 'romántic$1'],
  [/\bpo\uFFFDtic([oa]s?)\b/gi, 'poétic$1'],
  [/\bfilos\uFFFDfic([oa]s?)\b/gi, 'filosófic$1'],
  [/\bpol\uFFFDtic([oa]s?)\b/gi, 'polític$1'],
  [/\becon\uFFFDmic([oa]s?)\b/gi, 'económic$1'],
  [/\bpsicol\uFFFDgic([oa]s?)\b/gi, 'psicológic$1'],
  [/\bcr\uFFFDtic([oa]s?)\b/gi, 'crític$1'],
  [/\best\uFFFDtic([oa]s?)\b/gi, 'estétic$1'],
  [/\b\uFFFDtic([oa]s?)\b/gi, 'étic$1'],
  [/\bdram\uFFFDtic([oa]s?)\b/gi, 'dramátic$1'],
  [/\bfant\uFFFDstic([oa]s?)\b/gi, 'fantástic$1'],
  [/\bl\uFFFDric([oa]s?)\b/gi, 'líric$1'],
  [/\b\uFFFDpic([oa]s?)\b/gi, 'épic$1'],
  [/\bs\uFFFDmbolo(s)?\b/gi, 'símbolo$1'],
  [/\besp\uFFFDritu(s)?\b/gi, 'espíritu$1'],
  [/\bc\uFFFDlebre(s)?\b/gi, 'célebre$1'],
  [/\bdif\uFFFDcil(es)?\b/gi, 'difícil$1'],
  [/\bf\uFFFDcil(es)?\b/gi, 'fácil$1'],
  [/\bcar\uFFFDcter\b/gi, 'carácter'],
  [/\bam\uFFFDrica\b/gi, 'américa'],
  [/\bpa\uFFFDs(es)?\b/gi, 'país$1'],
  [/\bra\uFFFDz\b/gi, 'raíz'],
  [/\bra\uFFFDces\b/gi, 'raíces'],
  [/\bpara\uFFFDso\b/gi, 'paraíso'],
  [/\bo\uFFFDdo(s)?\b/gi, 'oído$1'],
  [/\bca\uFFFDda(s)?\b/gi, 'caída$1'],
];

function decodeHtmlAndStripTags(input: string): string {
  return input
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|li|blockquote|h[1-6])\s*>/gi, '\n\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : '';
    })
    .replace(/&([a-zA-Z]+);/g, (full, entity: string) => HTML_ENTITY_MAP[entity] ?? full);
}

function repairMojibake(input: string): string {
  let result = input;
  for (const [pattern, replacement] of MOJIBAKE_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function repairCorruptedSpanishChars(input: string): string {
  if (!input.includes('\uFFFD')) return input;

  let result = input;

  for (const [pattern, replacement] of SPANISH_FFFD_WORD_RULES) {
    result = result.replace(pattern, (match, g1?: string) => {
      const resolved = replacement.replace('$1', g1 ?? '');
      return applyCaseLike(match, resolved);
    });
  }

  // Sufijos productivos del español (-ción, -sión, -xión)
  result = result.replace(
    /([a-záéíóúñ])([csx])i\uFFFDn\b/gi,
    (_, prev: string, cons: string) => `${prev}${cons}ión`
  );

  // Hiatos e imperfectos/condicionales en -ía, -ías, -ían, -íamos (diría, conocía, fantasías, hipocresía...)
  result = result.replace(
    /([a-záéíóúñ]{2,})\uFFFDa(s|n|mos)?\b/gi,
    (_, stem: string, suffix?: string) => `${stem}ía${suffix ?? ''}`
  );

  // Sufijos -lógico/a, -gráfico/a, -ístico/a
  result = result.replace(
    /([a-záéíóúñ]{2,})l\uFFFDgic([oa]s?)\b/gi,
    (_, stem: string, suffix: string) => `${stem}lógic${suffix}`
  );
  result = result.replace(
    /([a-záéíóúñ]{2,})gr\uFFFDfic([oa]s?)\b/gi,
    (_, stem: string, suffix: string) => `${stem}gráfic${suffix}`
  );
  result = result.replace(
    /([a-záéíóúñ]{2,})\uFFFDstic([oa]s?)\b/gi,
    (_, stem: string, suffix: string) => `${stem}ístic${suffix}`
  );

  // Nunca dejar el glifo roto U+FFFD visible en pantalla
  return result.replace(/\uFFFD+/g, '');
}

function normalizeTypography(input: string): string {
  return input
    .replace(/\r\n?/g, '\n')
    .replace(/[\u00A0\u200B\uFEFF]/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/''/g, '"')
    // Eliminar encabezados residuales de extractos automáticos de ebooks
    .replace(
      /^[Ee]xample in this ebook\b[\s:.-]*(?:[IVXLCDM]+\.?\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[a-záéíóúñ]+){0,3}\s+)?/,
      ''
    )
    // Espacio faltante tras puntuación de cierre (ej. "lado.Lo" -> "lado. Lo")
    .replace(/([a-záéíóúñ»")\]])([.!?])([A-ZÁÉÍÓÚÑ¡¿"«])/g, '$1$2 $3')
    // Eliminar espacio sobrante antes de signos de puntuación
    .replace(/[ \t]+([,.;:!?])/g, '$1')
    // Normalizar espacios múltiples preservando saltos de párrafo
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function splitIntoSentences(text: string): string[] {
  const flat = text.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  if (!flat) return [];

  const sentences: string[] = [];
  let start = 0;

  for (let i = 0; i < flat.length; i += 1) {
    const ch = flat[i];
    if (ch !== '.' && ch !== '!' && ch !== '?') continue;

    // Saltar puntos suspensivos "..."
    if (ch === '.' && (flat[i + 1] === '.' || flat[i - 1] === '.')) continue;

    // Avanzar si hay comillas o paréntesis de cierre pegados al punto
    let end = i + 1;
    while (end < flat.length && /["'»)\]]/.test(flat[end])) {
      end += 1;
    }

    const isEndOfText = end >= flat.length;
    const nextIsBoundary =
      isEndOfText ||
      (/\s/.test(flat[end]) &&
        end + 1 < flat.length &&
        /[A-ZÁÉÍÓÚÑ¡¿"«(0-9]/.test(flat[end + 1]));

    if (!nextIsBoundary) continue;

    const candidate = flat.slice(start, end).trim();
    // Evitar cortar tras abreviaturas cortas (Dr., Sr., E., R., etc.)
    if (
      !isEndOfText &&
      /(?:\b(?:Dr|Dra|Sr|Sra|Srta|Vol|Cap|Ed|Num|Núm|Pág|Art|St|No)\.|(?:\b[A-ZÁÉÍÓÚÑ]\.))$/u.test(
        candidate
      )
    ) {
      continue;
    }

    if (candidate) {
      sentences.push(candidate);
      start = end;
      while (start < flat.length && /\s/.test(flat[start])) start += 1;
      i = start - 1;
    }
  }

  const remainder = flat.slice(start).trim();
  if (remainder) {
    sentences.push(remainder);
  }

  return sentences;
}

function truncateCleanly(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength);
  const lastClause = Math.max(slice.lastIndexOf('; '), slice.lastIndexOf(', '));
  if (lastClause >= Math.floor(maxLength * 0.65)) {
    return `${slice.slice(0, lastClause).trim()}…`;
  }
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > Math.floor(maxLength * 0.5) ? slice.slice(0, lastSpace) : slice;
  return `${cut.replace(/[,;:\-—\s]+$/, '').trim()}…`;
}

/**
 * Detecta si un texto de entrada viene gravemente corrupto con glifos U+FFFD
 * (útil al decidir si descartar una descripción dañada de Google Books cuando existe respaldo limpio).
 */
export function hasCorruptedEncoding(text: string | undefined | null): boolean {
  if (!text) return false;
  return text.includes('\uFFFD');
}

/**
 * Formatea y sanea cualquier sinopsis para mantener un formato editorial único
 * en todo el catálogo (tarjetas, modal de detalle e importación desde API).
 */
export function formatBookSynopsis(
  raw: unknown,
  options?: { maxLength?: number; fallback?: string }
): string {
  const fallback = options?.fallback ?? 'Sin sinopsis disponible.';
  const maxLength = options?.maxLength ?? DEFAULT_MAX_LENGTH;
  const softMaxLength = Math.max(maxLength, SOFT_MAX_LENGTH);

  if (typeof raw !== 'string') return fallback;

  const cleaned = normalizeTypography(
    repairCorruptedSpanishChars(repairMojibake(decodeHtmlAndStripTags(raw)))
  );

  if (!cleaned) return fallback;

  const sentences = splitIntoSentences(cleaned);
  if (sentences.length === 0) return fallback;

  // Seleccionar oraciones completas hasta alcanzar una extensión editorial uniforme
  const selected: string[] = [];
  let totalLen = 0;

  for (const sentence of sentences) {
    const projected = totalLen === 0 ? sentence.length : totalLen + 1 + sentence.length;
    if (selected.length === 0) {
      if (sentence.length > softMaxLength) {
        selected.push(truncateCleanly(sentence, maxLength));
        break;
      }
      selected.push(sentence);
      totalLen = sentence.length;
      continue;
    }

    if (projected <= maxLength || (selected.length === 1 && projected <= softMaxLength)) {
      selected.push(sentence);
      totalLen = projected;
    } else {
      break;
    }
  }

  // Asegurar cierre con puntuación editorial
  const lastIdx = selected.length - 1;
  if (lastIdx >= 0 && !/[.!?…"»]$/.test(selected[lastIdx])) {
    selected[lastIdx] = `${selected[lastIdx]}.`;
  }

  // Estructurar de forma uniforme: 1 párrafo si es breve, 2 párrafos equilibrados si supera 320 caracteres
  if (selected.length >= 2 && totalLen > 320) {
    const targetHalf = totalLen / 2;
    let bestSplit = 1;
    let bestDiff = Number.POSITIVE_INFINITY;
    let acc = 0;

    for (let i = 0; i < selected.length - 1; i += 1) {
      acc += (i === 0 ? 0 : 1) + selected[i].length;
      const diff = Math.abs(acc - targetHalf);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestSplit = i + 1;
      }
    }

    const firstParagraph = selected.slice(0, bestSplit).join(' ');
    const secondParagraph = selected.slice(bestSplit).join(' ');
    return `${firstParagraph}\n\n${secondParagraph}`;
  }

  return selected.join(' ');
}
