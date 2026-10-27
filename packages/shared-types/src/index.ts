export type BookFormat = 'HARDCOVER' | 'PAPERBACK' | 'EBOOK' | 'AUDIOBOOK';

export type BookGenre =
  | 'Ficción'
  | 'No Ficción'
  | 'Ciencia Ficción'
  | 'Fantasía'
  | 'Filosofía'
  | 'Historia'
  | 'Misterio'
  | 'Terror'
  | 'Poesía'
  | 'Clásicos'
  | 'Desarrollo Personal';

export type ReadingStatus = 'WANT_TO_READ' | 'READING' | 'COMPLETED' | 'ABANDONED';

export interface Author {
  id: string;
  name: string;
  biography: string;
  birthDate?: string;
  country?: string;
  avatarUrl?: string;
}

export interface BookPage {
  numero: number;
  texto: string;
  nombre_archivo?: string;
  conteo_palabras?: number;
}

export interface BookChapter {
  numero: number;
  titulo: string;
  pagina_inicio?: number;
  pagina_fin?: number;
  contenido?: string;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  originalTitle?: string;
  isbn: string;
  author: Author;
  genres: BookGenre[];
  synopsis: string;
  publishedYear: number;
  publisher: string;
  pageCount: number;
  language: string;
  catalogType?: string;
  coverUrl: string;
  ratingAverage: number;
  ratingCount: number;
  availableFormats: BookFormat[];
  sampleChapterText?: string;
  chapters?: BookChapter[];
  pages?: BookPage[];
  stock?: number;
  featured?: boolean;
}

export interface UserShelfItem {
  id: string;
  bookId: string;
  userId: string;
  status: ReadingStatus;
  progressPercent: number;
  addedAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

export interface OcrBBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrWord {
  text: string;
  confidence: number;
  bbox?: OcrBBox;
}

export interface OcrLine {
  text: string;
  confidence: number;
  words?: OcrWord[];
}

export interface OcrTextBlock {
  text: string;
  confidence: number;
  bbox?: OcrBBox;
}

export type BookScanMode = 'cover' | 'copyright' | 'page' | 'auto';

export interface ExtractedBookMetadata {
  title?: string;
  subtitle?: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  publishedYear?: number;
  genres?: BookGenre[];
  language?: string;
  synopsis?: string;
  chapters?: string[];
  pageCountEstimate?: number;
  confidenceScore: number;
}

export interface BookExtractionResult {
  sourceType: 'image' | 'pdf' | 'text';
  rawText: string;
  confidence: number;
  linesCount: number;
  wordsCount: number;
  processingTimeMs: number;
  metadata: ExtractedBookMetadata;
  suggestedBookDraft?: Partial<Book>;
}

export interface MinerUPageOutput {
  pageNumber: number;
  markdown: string;
  images?: string[];
  tables?: string[];
}

export interface MinerUScanResult {
  engine: 'mineru';
  success: boolean;
  rawMarkdown: string;
  pages?: MinerUPageOutput[];
  metadata?: ExtractedBookMetadata;
  suggestedTitle?: string;
  suggestedAuthor?: string;
  suggestedSynopsis?: string;
  suggestedIsbn?: string;
  processingTimeMs?: number;
  warnings?: string[];
}

export interface MinerUScanOptions {
  enableOcr?: boolean;
  extractImages?: boolean;
  language?: string;
}

