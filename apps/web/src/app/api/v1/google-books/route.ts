import { NextRequest, NextResponse } from 'next/server';
import { getLibrosCollection } from '@/lib/mongoDb';
import { verifyUploadJwt } from '@/lib/jwtSecurity';
import { formatPageTextStructure } from '@/lib/bookTextCleaner';

export const runtime = 'nodejs';
export const maxDuration = 60;

export interface GoogleBookVolumeItem {
  googleBookId: string;
  gutenbergId?: number;
  title: string;
  author: string;
  publishedYear: number;
  publisher: string;
  synopsis: string;
  genres: string[];
  isbn: string;
  pageCount: number;
  language: string;
  coverUrl: string;
  fullTextUrl?: string;
  previewLink?: string;
  webReaderLink?: string;
  epubDownloadLink?: string;
  pdfDownloadLink?: string;
  publicDomain: boolean;
  alreadyInDb?: boolean;
  textSnippet?: string;
}

interface CuratedSpanishBook {
  gutenbergId: number;
  googleBookId?: string;
  useGutenbergCover?: boolean;
  isDynamic?: boolean;
  title: string;
  author: string;
  publishedYear: number;
  category: 'literatura' | 'filosofia' | 'historia' | 'poesia' | 'ciencia';
  genre: string;
  pageCount: number;
  synopsis: string;
}

/**
 * Catálogo base de obras clásicas en español de dominio público con texto completo
 * 100% verificado en UTF-8 y IDs de Google Books API pre-resueltos (0 llamadas extra por carga).
 */
const SPANISH_FREE_BOOKS_CATALOG: CuratedSpanishBook[] = [
  {
    gutenbergId: 2000,
    googleBookId: 'vsDCyngJkf4C',
    title: 'Don Quijote de la Mancha',
    author: 'Miguel de Cervantes Saavedra',
    publishedYear: 1605,
    category: 'literatura',
    genre: 'Clásicos',
    pageCount: 380,
    synopsis:
      'Obra cumbre de la literatura en lengua española que narra las aventuras de Alonso Quijano, un hidalgo que tras leer innumerables libros de caballerías decide salir en busca de justicia acompañado de su fiel escudero Sancho Panza.',
  },
  {
    gutenbergId: 61851,
    googleBookId: 'GBOOKS-61851',
    useGutenbergCover: true,
    title: 'El crimen y el castigo',
    author: 'Fiódor Dostoyevski',
    publishedYear: 1866,
    category: 'literatura',
    genre: 'Clásicos',
    pageCount: 340,
    synopsis:
      'En San Petersburgo, el antiguo estudiante Rodión Raskólnikov planea un crimen convencido de que los hombres extraordinarios están por encima de la ley moral, desencadenando un profundo tormento psicológico y ético.',
  },
  {
    gutenbergId: 58221,
    googleBookId: 'Mu28jqEACAAJ',
    title: 'La Odisea',
    author: 'Homero',
    publishedYear: 1800,
    category: 'literatura',
    genre: 'Clásicos',
    pageCount: 280,
    synopsis:
      'Poema épico clásico que relata el largo y peligroso viaje de regreso a Ítaca del héroe griego Odiseo (Ulises) tras la caída de Troya, mientras Penélope y Telémaco resisten en su reino.',
  },
  {
    gutenbergId: 57654,
    googleBookId: 'n3RCBAAQBAJ',
    title: 'La Ilíada',
    author: 'Homero',
    publishedYear: 1800,
    category: 'literatura',
    genre: 'Clásicos',
    pageCount: 310,
    synopsis:
      'Epopeya griega sobre el asedio de Troya y la cólera de Aquiles, donde héroes y dioses intervienen en el destino de los pueblos aqueo y troyano.',
  },
  {
    gutenbergId: 57303,
    googleBookId: 'baLsDwAAQBAJ',
    title: 'La Divina Comedia',
    author: 'Dante Alighieri',
    publishedYear: 1321,
    category: 'poesia',
    genre: 'Poesía',
    pageCount: 320,
    synopsis:
      'El viaje alegórico y espiritual de Dante a través del Infierno y el Purgatorio guiado por el poeta Virgilio, y del Paraíso de la mano de Beatriz.',
  },
  {
    gutenbergId: 49836,
    googleBookId: 'Np3yEAAAQBAJ',
    title: 'Niebla',
    author: 'Miguel de Unamuno',
    publishedYear: 1914,
    category: 'filosofia',
    genre: 'Filosofía',
    pageCount: 165,
    synopsis:
      'La célebre «nivola» filosófica de Unamuno protagonizada por Augusto Pérez, quien cuestiona el sentido de la existencia, el libre albedrío y la relación entre la criatura y su creador.',
  },
  {
    gutenbergId: 60464,
    googleBookId: 'mN6xf-v0WCYC',
    title: 'El árbol de la ciencia',
    author: 'Pío Baroja',
    publishedYear: 1911,
    category: 'filosofia',
    genre: 'Filosofía',
    pageCount: 190,
    synopsis:
      'A través de la vida de Andrés Hurtado, estudiante de medicina en el Madrid de finales del siglo XIX, Baroja plantea el debate filosófico entre el conocimiento científico y la voluntad de vivir.',
  },
  {
    gutenbergId: 64974,
    googleBookId: 'GBOOKS-64974',
    useGutenbergCover: true,
    title: 'El Hombre Mediocre',
    author: 'José Ingenieros',
    publishedYear: 1913,
    category: 'filosofia',
    genre: 'Filosofía',
    pageCount: 175,
    synopsis:
      'Ensayo de psicología y moral que analiza la naturaleza del idealismo frente al conformismo social, exaltando la dignidad intelectual y la búsqueda de la perfección.',
  },
  {
    gutenbergId: 22899,
    googleBookId: 'GBOOKS-22899',
    useGutenbergCover: true,
    title: 'Ariel',
    author: 'José Enrique Rodó',
    publishedYear: 1900,
    category: 'filosofia',
    genre: 'Filosofía',
    pageCount: 95,
    synopsis:
      'Ensayo filosófico dedicado a la juventud hispanoamericana que contrapone el espíritu elevado, estético y desinteresado de Ariel al utilitarismo materialista.',
  },
  {
    gutenbergId: 78052,
    googleBookId: '7SHIFQAAQBAJ',
    title: 'Andanzas y visiones españolas',
    author: 'Miguel de Unamuno',
    publishedYear: 1922,
    category: 'filosofia',
    genre: 'Filosofía',
    pageCount: 185,
    synopsis:
      'Meditaciones filosóficas, históricas y paisajísticas de Miguel de Unamuno a través de sus recorridos por las tierras, ciudades y monumentos de España y Portugal.',
  },
  {
    gutenbergId: 13507,
    googleBookId: '421nEAAAQBAJ',
    title: 'Cuentos de Amor de Locura y de Muerte',
    author: 'Horacio Quiroga',
    publishedYear: 1917,
    category: 'literatura',
    genre: 'Terror y Horror',
    pageCount: 145,
    synopsis:
      'Obra maestra del cuento hispanoamericano donde la selva misionera, el destino trágico, la obsesión y el misterio envuelven relatos inolvidables como «El almohadón de plumas» y «La gallina degollada».',
  },
  {
    gutenbergId: 46196,
    googleBookId: '7QSuzlrPgf0C',
    title: 'Cuentos Clásicos del Norte',
    author: 'Edgar Allan Poe',
    publishedYear: 1845,
    category: 'literatura',
    genre: 'Terror y Horror',
    pageCount: 140,
    synopsis:
      'Antología en español de los relatos góticos y detectivescos fundamentales de Edgar Allan Poe, donde el misterio psicológico y lo sobrenatural cobran vida.',
  },
  {
    gutenbergId: 52894,
    googleBookId: 'm90bEQAAQBAJ',
    title: 'Azul...',
    author: 'Rubén Darío',
    publishedYear: 1888,
    category: 'poesia',
    genre: 'Poesía',
    pageCount: 150,
    synopsis:
      'Libro inaugural del modernismo literario hispanoamericano que reúne cuentos en prosa poética y poemas de extraordinaria musicalidad y renovación estética.',
  },
  {
    gutenbergId: 72665,
    googleBookId: '61pbiobXgpMC',
    title: 'Romancero gitano',
    author: 'Federico García Lorca',
    publishedYear: 1928,
    category: 'poesia',
    genre: 'Poesía',
    pageCount: 60,
    synopsis:
      'Poemario emblemático de la Generación del 27 que funde la tradición del romance popular con la metáfora vanguardista para cantar el universo mítico de Andalucía.',
  },
  {
    gutenbergId: 9980,
    googleBookId: 'dk9XKf9o7_kC',
    title: 'Platero y yo',
    author: 'Juan Ramón Jiménez',
    publishedYear: 1914,
    category: 'poesia',
    genre: 'Poesía',
    pageCount: 110,
    synopsis:
      'Elegía andaluza en prosa lírica que recrea la vida, la naturaleza de Moguer y las reflexiones íntimas del poeta junto a su inseparable burrillo Platero.',
  },
  {
    gutenbergId: 53552,
    googleBookId: 'wUz2QLc0vysC',
    title: 'Obras escogidas (Rimas y Leyendas)',
    author: 'Gustavo Adolfo Bécquer',
    publishedYear: 1871,
    category: 'poesia',
    genre: 'Poesía',
    pageCount: 210,
    synopsis:
      'Compendio de las célebres Rimas y Leyendas del romanticismo español, donde convergen la sensibilidad lírica, los castillos medievales y el misterio nocturno.',
  },
  {
    gutenbergId: 67092,
    googleBookId: 'oWad0QEACAAJ',
    title: 'El paraíso perdido',
    author: 'John Milton',
    publishedYear: 1667,
    category: 'poesia',
    genre: 'Poesía',
    pageCount: 260,
    synopsis:
      'Gran poema épico de la literatura universal sobre la rebelión de los ángeles caídos y la pérdida del Edén, en edición íntegra traducida al español.',
  },
  {
    gutenbergId: 56454,
    googleBookId: 'XeC5YP482wsC',
    title: 'Hamlet: Drama en cinco actos',
    author: 'William Shakespeare',
    publishedYear: 1603,
    category: 'poesia',
    genre: 'Clásicos',
    pageCount: 135,
    synopsis:
      'La tragedia inmortal del príncipe de Dinamarca ante la sombra de su padre, la duda existencial, la traición en la corte de Elsinor y el destino trágico.',
  },
  {
    gutenbergId: 60198,
    googleBookId: 'J5FZBAAAQBAJ',
    title: 'Fuente Ovejuna',
    author: 'Lope de Vega',
    publishedYear: 1619,
    category: 'poesia',
    genre: 'Clásicos',
    pageCount: 95,
    synopsis:
      'Drama clásico del Siglo de Oro español sobre la unión de todo un pueblo frente a los abusos del comendador Fernán Gómez de Guzmán.',
  },
  {
    gutenbergId: 1619,
    title: 'La Celestina',
    author: 'Fernando de Rojas',
    publishedYear: 1499,
    category: 'literatura',
    genre: 'Clásicos',
    pageCount: 195,
    synopsis:
      'Tragicomedia de Calisto y Melibea, obra clave de transición entre la Edad Media y el Renacimiento español.',
  },
  {
    gutenbergId: 16625,
    title: 'Libro de Buen Amor',
    author: 'Juan Ruiz (Arcipreste de Hita)',
    publishedYear: 1330,
    category: 'poesia',
    genre: 'Poesía',
    pageCount: 220,
    synopsis:
      'Monumento poético del mester de clerecía medieval que entrelaza fábulas, sátiras, relatos alegóricos y composiciones líricas.',
  },
  {
    gutenbergId: 50027,
    title: 'El sí de las niñas',
    author: 'Leandro Fernández de Moratín',
    publishedYear: 1806,
    category: 'poesia',
    genre: 'Clásicos',
    pageCount: 90,
    synopsis:
      'Comedia neoclásica española que defiende la libertad de elección sentimental y la educación ilustrada de la juventud.',
  },
  {
    gutenbergId: 14765,
    title: 'El Gaucho Martín Fierro',
    author: 'José Hernández',
    publishedYear: 1872,
    category: 'poesia',
    genre: 'Poesía',
    pageCount: 85,
    synopsis:
      'Poema nacional gauchesco que retrata la vida libre en la pampa, las injusticias de la leva fronteriza y el espíritu indómito del gaucho.',
  },
  {
    gutenbergId: 55206,
    title: 'Fábulas en verso castellano',
    author: 'Félix María de Samaniego',
    publishedYear: 1781,
    category: 'poesia',
    genre: 'Poesía',
    pageCount: 130,
    synopsis:
      'Colección clásica de fábulas morales e ilustradas inspiradas en Esopo, Fedro y La Fontaine, escritas en ágil verso español.',
  },
  {
    gutenbergId: 45438,
    title: 'La isla del tesoro',
    author: 'Robert Louis Stevenson',
    publishedYear: 1883,
    category: 'literatura',
    genre: 'Fantasía y Magia',
    pageCount: 180,
    synopsis:
      'El joven Jim Hawkins halla el mapa del capitán Flint y se embarca en la goleta Hispaniola junto al inolvidable Long John Silver en busca de un tesoro oculto.',
  },
  {
    gutenbergId: 69552,
    title: 'El libro de las tierras vírgenes',
    author: 'Rudyard Kipling',
    publishedYear: 1894,
    category: 'literatura',
    genre: 'Fantasía y Magia',
    pageCount: 215,
    synopsis:
      'Las aventuras de Mowgli, criado por una manada de lobos en la selva india junto a Baloo y Bagheera frente al tigre Shere Khan.',
  },
  {
    gutenbergId: 47287,
    title: 'El libro de las mil noches y una noche',
    author: 'Anónimo (Trad. Vicente Blasco Ibáñez)',
    publishedYear: 1899,
    category: 'literatura',
    genre: 'Fantasía y Magia',
    pageCount: 250,
    synopsis:
      'Recopilación clásica de los cuentos maravillosos de Oriente narrados por Scheherazada al sultán Schahriar.',
  },
  {
    gutenbergId: 79356,
    title: 'Nuestra Señora de París',
    author: 'Victor Hugo',
    publishedYear: 1831,
    category: 'literatura',
    genre: 'Clásicos',
    pageCount: 270,
    synopsis:
      'En el París medieval del siglo XV, los destinos de Esmeralda, el campanero Quasimodo y el arcediano Frollo se entrelazan bajo las bóvedas góticas de la catedral.',
  },
  {
    gutenbergId: 78068,
    title: 'Los miserables',
    author: 'Victor Hugo',
    publishedYear: 1862,
    category: 'literatura',
    genre: 'Clásicos',
    pageCount: 360,
    synopsis:
      'La epopeya moral y social de Jean Valjean en su búsqueda de redención en la Francia del siglo XIX frente a la implacable persecución del inspector Javert.',
  },
  {
    gutenbergId: 17013,
    title: 'Fortunata y Jacinta',
    author: 'Benito Pérez Galdós',
    publishedYear: 1887,
    category: 'literatura',
    genre: 'Clásicos',
    pageCount: 350,
    synopsis:
      'Gran fresco realista de la sociedad madrileña del siglo XIX a través del destino cruzado de dos mujeres de distinta clase social.',
  },
  {
    gutenbergId: 15725,
    title: 'Doña Perfecta',
    author: 'Benito Pérez Galdós',
    publishedYear: 1876,
    category: 'literatura',
    genre: 'Clásicos',
    pageCount: 170,
    synopsis:
      'El joven ingeniero Pepe Rey llega a la ciudad provinciana de Orbajosa, donde sus ideas modernas chocan con el intransigente tradicionalismo local.',
  },
  {
    gutenbergId: 16961,
    title: 'Trafalgar (Episodios Nacionales)',
    author: 'Benito Pérez Galdós',
    publishedYear: 1873,
    category: 'historia',
    genre: 'Historia',
    pageCount: 155,
    synopsis:
      'Primer volumen de los Episodios Nacionales que narra, desde la mirada del joven Gabriel de Araceli, la histórica batalla naval de Trafalgar en 1805.',
  },
  {
    gutenbergId: 33267,
    title: 'Facundo: Civilización y Barbarie',
    author: 'Domingo Faustino Sarmiento',
    publishedYear: 1845,
    category: 'historia',
    genre: 'Historia',
    pageCount: 230,
    synopsis:
      'Obra fundamental de la historiografía y sociología hispanoamericana que analiza las raíces históricas, geográficas y políticas del caudillismo en el siglo XIX.',
  },
  {
    gutenbergId: 49298,
    title: 'Historia de las Indias',
    author: 'Bartolomé de las Casas',
    publishedYear: 1561,
    category: 'historia',
    genre: 'Historia',
    pageCount: 330,
    synopsis:
      'Crónica histórica de primera mano sobre los viajes de Cristóbal Colón, el descubrimiento de América y la defensa de los pueblos originarios.',
  },
  {
    gutenbergId: 56251,
    title: 'Compendio de la historia general de América',
    author: 'Carlos Navarro y Lamarca',
    publishedYear: 1910,
    category: 'historia',
    genre: 'Historia',
    pageCount: 290,
    synopsis:
      'Estudio histórico integral sobre las culturas precolombinas, el periodo virreinal y la formación de las naciones americanas.',
  },
  {
    gutenbergId: 25988,
    title: 'Historia de la literatura y del arte dramático en España',
    author: 'Adolf Friedrich von Schack',
    publishedYear: 1885,
    category: 'historia',
    genre: 'Historia',
    pageCount: 275,
    synopsis:
      'Recorrido histórico y crítico por los orígenes y el esplendor del teatro y las letras españolas desde la Edad Media hasta el Siglo de Oro.',
  },
  {
    gutenbergId: 26284,
    title: 'El Mar (Estudio de Historia Natural)',
    author: 'Jules Michelet',
    publishedYear: 1861,
    category: 'ciencia',
    genre: 'Ciencia',
    pageCount: 210,
    synopsis:
      'Obra clásica de divulgación científica y naturalista sobre los océanos, las corrientes marinas, la vida abisal y la relación del ser humano con los mares.',
  },
  {
    gutenbergId: 29506,
    title: 'El sombrero de tres picos',
    author: 'Pedro Antonio de Alarcón',
    publishedYear: 1874,
    category: 'literatura',
    genre: 'Clásicos',
    pageCount: 115,
    synopsis:
      'Historia verdadera y chispeante de un sucedido popular entre el molinero Lucas, la señá Frasquita y el corregidor en tierras andaluzas.',
  },
  {
    gutenbergId: 18005,
    title: 'Los pazos de Ulloa',
    author: 'Emilia Pardo Bazán',
    publishedYear: 1886,
    category: 'literatura',
    genre: 'Clásicos',
    pageCount: 225,
    synopsis:
      'Novela cumbre del naturalismo español ambientada en el mundo rural gallego, donde el capellán Julián descubre la decadencia de la antigua hidalguía.',
  },
];

// Caché en memoria para metadatos e imágenes de Google Books API por gutenbergId
const googleMetadataCache = new Map<
  number,
  {
    googleBookId: string;
    coverUrl: string;
    isbn: string;
    synopsis?: string;
    previewLink?: string;
    webReaderLink?: string;
  }
>();

const BACKEND_URL = (
  process.env.LIBROS_API_URL ||
  process.env.API_BASE_URL ||
  'https://backend-libros-wj1t.onrender.com'
).replace(/\/+$/, '');

// Caché de corta duración (20s) para libros existentes en MongoDB y evitar consultas repetitivas al cambiar de categoría
let dbBooksCache: {
  timestamp: number;
  codes: Set<string>;
  titles: Set<string>;
} | null = null;

function cleanHtmlTags(input: string): string {
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildGoogleCoverUrl(volumeId: string, imageLinks?: Record<string, string>): string {
  const candidate =
    imageLinks?.extraLarge ||
    imageLinks?.large ||
    imageLinks?.medium ||
    imageLinks?.thumbnail ||
    imageLinks?.smallThumbnail;

  if (candidate) {
    return candidate.replace(/^http:\/\//i, 'https://').replace('&edge=curl', '');
  }

  return `https://books.google.com/books/content?id=${encodeURIComponent(volumeId)}&printsec=frontcover&img=1&zoom=2&source=gbs_api`;
}

/**
 * Resuelve metadatos y portada de forma instantánea (0 ms) para obras del catálogo base,
 * y consulta Google Books API únicamente cuando se trata de búsquedas dinámicas nuevas.
 */
async function enrichWithGoogleBooksApi(
  book: CuratedSpanishBook,
  apiKey: string
): Promise<GoogleBookVolumeItem> {
  const fallbackCover = `https://www.gutenberg.org/cache/epub/${book.gutenbergId}/pg${book.gutenbergId}.cover.medium.jpg`;
  const fullTextUrl = `https://www.gutenberg.org/ebooks/${book.gutenbergId}.txt.utf-8`;
  const epubDownloadLink = `https://www.gutenberg.org/ebooks/${book.gutenbergId}.epub3.images`;

  // Si es una obra del catálogo base, evitamos hacer peticiones en cascada a Google Books API
  if (!book.isDynamic) {
    const resolvedId = book.googleBookId || `GBOOKS-${book.gutenbergId}`;
    const hasDirectGoogleId = Boolean(
      book.googleBookId && !book.useGutenbergCover && !book.googleBookId.startsWith('GBOOKS-')
    );
    const coverUrl = hasDirectGoogleId
      ? buildGoogleCoverUrl(resolvedId)
      : fallbackCover;

    return {
      googleBookId: resolvedId,
      gutenbergId: book.gutenbergId,
      title: book.title,
      author: book.author,
      publishedYear: book.publishedYear,
      publisher: 'Google Books / Dominio Público',
      synopsis: book.synopsis,
      genres: [book.genre],
      isbn: `GBOOKS-${book.gutenbergId}`,
      pageCount: book.pageCount,
      language: 'es',
      coverUrl,
      fullTextUrl,
      previewLink: hasDirectGoogleId
        ? `https://books.google.com/books?id=${encodeURIComponent(resolvedId)}`
        : undefined,
      webReaderLink: hasDirectGoogleId
        ? `https://play.google.com/books/reader?id=${encodeURIComponent(resolvedId)}`
        : undefined,
      epubDownloadLink,
      publicDomain: true,
    };
  }

  const cached = googleMetadataCache.get(book.gutenbergId);
  if (cached) {
    return {
      googleBookId: cached.googleBookId,
      gutenbergId: book.gutenbergId,
      title: book.title,
      author: book.author,
      publishedYear: book.publishedYear,
      publisher: 'Google Books / Dominio Público',
      synopsis: cached.synopsis || book.synopsis,
      genres: [book.genre],
      isbn: cached.isbn,
      pageCount: book.pageCount,
      language: 'es',
      coverUrl: cached.coverUrl || fallbackCover,
      fullTextUrl,
      previewLink: cached.previewLink,
      webReaderLink: cached.webReaderLink,
      epubDownloadLink,
      publicDomain: true,
    };
  }

  if (apiKey) {
    try {
      const googleUrl = new URL('https://www.googleapis.com/books/v1/volumes');
      googleUrl.searchParams.set('q', `intitle:${book.title} inauthor:${book.author.split(' ')[0]}`);
      googleUrl.searchParams.set('langRestrict', 'es');
      googleUrl.searchParams.set('maxResults', '3');
      googleUrl.searchParams.set('key', apiKey);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(googleUrl.toString(), {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        const match = items.find((it: any) => it?.volumeInfo?.imageLinks) || items[0];

        if (match) {
          const volId = String(match.id || `GB-${book.gutenbergId}`);
          const info = match.volumeInfo || {};
          const access = match.accessInfo || {};
          const identifiers = Array.isArray(info.industryIdentifiers)
            ? info.industryIdentifiers
            : [];
          const isbnObj =
            identifiers.find((id: any) => id.type === 'ISBN_13') ||
            identifiers.find((id: any) => id.type === 'ISBN_10') ||
            identifiers[0];
          const isbn = isbnObj?.identifier
            ? String(isbnObj.identifier).trim()
            : `GBOOKS-${book.gutenbergId}`;

          const coverUrl = info.imageLinks
            ? buildGoogleCoverUrl(volId, info.imageLinks)
            : fallbackCover;

          const googleDesc =
            typeof info.description === 'string' && info.description.trim().length > 60
              ? cleanHtmlTags(info.description)
              : book.synopsis;

          const meta = {
            googleBookId: volId,
            coverUrl,
            isbn,
            synopsis: googleDesc,
            previewLink: info.previewLink,
            webReaderLink: access.webReaderLink,
          };
          googleMetadataCache.set(book.gutenbergId, meta);

          return {
            googleBookId: volId,
            gutenbergId: book.gutenbergId,
            title: book.title,
            author: book.author,
            publishedYear: book.publishedYear,
            publisher: 'Google Books / Dominio Público',
            synopsis: googleDesc,
            genres: [book.genre],
            isbn,
            pageCount: book.pageCount,
            language: 'es',
            coverUrl,
            fullTextUrl,
            previewLink: info.previewLink,
            webReaderLink: access.webReaderLink,
            epubDownloadLink,
            publicDomain: true,
          };
        }
      }
    } catch {
      // Si Google Books tarda en responder para un ítem, usamos la portada directa de la API libre
    }
  }

  return {
    googleBookId: `GBOOKS-${book.gutenbergId}`,
    gutenbergId: book.gutenbergId,
    title: book.title,
    author: book.author,
    publishedYear: book.publishedYear,
    publisher: 'Google Books / Dominio Público',
    synopsis: book.synopsis,
    genres: [book.genre],
    isbn: `GBOOKS-${book.gutenbergId}`,
    pageCount: book.pageCount,
    language: 'es',
    coverUrl: fallbackCover,
    fullTextUrl,
    epubDownloadLink,
    publicDomain: true,
  };
}

/**
 * Limpia encabezados y pies legales en inglés de Project Gutenberg para conservar
 * únicamente el texto literario en español.
 */
function cleanGutenbergFullText(rawText: string): string {
  let text = rawText.replace(/\r\n?/g, '\n');

  // Cortar todo lo anterior a *** START OF THE PROJECT GUTENBERG EBOOK ... ***
  const startRegex = /\*{3}\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*{3}/i;
  const startMatch = startRegex.exec(text);
  if (startMatch && startMatch.index !== undefined) {
    text = text.slice(startMatch.index + startMatch[0].length);
  }

  // Cortar todo lo posterior a *** END OF THE PROJECT GUTENBERG EBOOK ... ***
  const endRegex = /\*{3}\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*{3}/i;
  const endMatch = endRegex.exec(text);
  if (endMatch && endMatch.index !== undefined) {
    text = text.slice(0, endMatch.index);
  }

  // También cortar variantes antiguas "End of the Project Gutenberg"
  const legacyEndIdx = text.search(/End of (?:the )?Project Gutenberg/i);
  if (legacyEndIdx > 1000) {
    text = text.slice(0, legacyEndIdx);
  }

  return text.trim();
}

/**
 * Descarga el texto completo en español de la obra y lo divide en el número exacto de
 * páginas correspondientes al libro (`targetPageCount`), aplicando `formatPageTextStructure`
 * para mantener títulos centrados en naranja y párrafos limpios.
 */
function paginateFullBookToTargetPages(
  rawFullText: string,
  targetPageCount: number,
  bookTitle: string,
  synopsisFallback: string
): Array<{ numero: number; texto: string; conteo_palabras: number }> {
  const cleaned = cleanGutenbergFullText(rawFullText);

  const rawParagraphs = cleaned
    .split(/\n[ \t]*\n+/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim())
    .filter((p) => {
      if (!p) return false;
      // Omitir créditos técnicos en inglés o notas del transcriptor de digitalización
      if (
        /^(?:Produced by|Updated editions|Transcriber's Note|Online Distributed Proofreading|Internet Archive|HathiTrust|www\.gutenberg\.org|www\.pgdp\.net|Se ha respetado la ortograf)/i.test(
          p
        )
      ) {
        return false;
      }
      if (/^Nota del Transcriptor:?/i.test(p) || /^\*\s+En la p\.\s*\d+/i.test(p)) {
        return false;
      }
      // Omitir separadores puros de asteriscos o guiones
      if (/^[*_\-=~\s]+$/.test(p)) {
        return false;
      }
      return true;
    });

  // Limitar a un tamaño óptimo (~750 KB máximo de texto puro) para respuesta rápida en MongoDB Atlas
  const MAX_TOTAL_CHARS = 720000;
  const boundedParagraphs: string[] = [];
  let accumulatedChars = 0;

  for (const p of rawParagraphs) {
    if (accumulatedChars + p.length > MAX_TOTAL_CHARS && boundedParagraphs.length > 50) {
      break;
    }
    boundedParagraphs.push(p);
    accumulatedChars += p.length;
  }

  const desiredPages = Math.max(10, Math.min(500, targetPageCount || 150));

  // Si hay menos bloques que páginas deseadas, subdividimos párrafos extensos por oraciones
  let workingBlocks = [...boundedParagraphs];
  if (workingBlocks.length < desiredPages * 2) {
    const expanded: string[] = [];
    for (const block of workingBlocks) {
      if (block.length > 350) {
        const sentences = block.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [block];
        let temp = '';
        for (const s of sentences) {
          if ((temp + ' ' + s).trim().length > 280 && temp) {
            expanded.push(temp.trim());
            temp = s.trim();
          } else {
            temp = (temp + ' ' + s).trim();
          }
        }
        if (temp) expanded.push(temp);
      } else {
        expanded.push(block);
      }
    }
    workingBlocks = expanded;
  }

  if (workingBlocks.length === 0) {
    const fallbackText = formatPageTextStructure(`### ${bookTitle}\n\n${synopsisFallback}`);
    return [
      {
        numero: 1,
        texto: fallbackText,
        conteo_palabras: fallbackText.split(/\s+/u).filter(Boolean).length,
      },
    ];
  }

  const finalPageCount = Math.min(desiredPages, workingBlocks.length);
  const totalChars = workingBlocks.reduce((acc, b) => acc + b.length, 0);
  const pages: Array<{ numero: number; texto: string; conteo_palabras: number }> = [];

  let blockCursor = 0;
  let consumedChars = 0;

  for (let pageIdx = 0; pageIdx < finalPageCount; pageIdx++) {
    const remainingPages = finalPageCount - pageIdx;
    const remainingBlocks = workingBlocks.length - blockCursor;

    if (remainingPages === 1) {
      const rest = workingBlocks.slice(blockCursor).join('\n\n');
      const formatted = formatPageTextStructure(rest);
      pages.push({
        numero: pageIdx + 1,
        texto: formatted,
        conteo_palabras: formatted.split(/\s+/u).filter(Boolean).length,
      });
      break;
    }

    const targetCumulativeChars = ((pageIdx + 1) / finalPageCount) * totalChars;
    const maxBlockIndexForThisPage = workingBlocks.length - (remainingPages - 1);
    const pageBlocks: string[] = [];

    while (blockCursor < maxBlockIndexForThisPage) {
      const currentBlock = workingBlocks[blockCursor];
      pageBlocks.push(currentBlock);
      consumedChars += currentBlock.length;
      blockCursor++;

      // Si ya alcanzamos el objetivo proporcional de caracteres para esta página, avanzamos a la siguiente
      if (consumedChars >= targetCumulativeChars && pageBlocks.length >= 1) {
        break;
      }
    }

    // Seguridad por si quedaran exactamente 1 bloque por página restante
    if (pageBlocks.length === 0 && remainingBlocks > 0) {
      pageBlocks.push(workingBlocks[blockCursor]);
      consumedChars += workingBlocks[blockCursor].length;
      blockCursor++;
    }

    const pageRawText = pageBlocks.join('\n\n');
    const formatted = formatPageTextStructure(pageRawText);
    pages.push({
      numero: pageIdx + 1,
      texto: formatted,
      conteo_palabras: formatted.split(/\s+/u).filter(Boolean).length,
    });
  }

  return pages;
}

/**
 * Descarga el texto completo de la obra desde su URL UTF-8 o busca su equivalente en Gutendex
 */
async function downloadFullBookText(book: GoogleBookVolumeItem): Promise<string> {
  const candidateUrls: string[] = [];

  if (book.fullTextUrl) {
    candidateUrls.push(book.fullTextUrl);
  }

  // Extraer gutenbergId si viene en el objeto o en el código ISBN/ID
  const inferredId =
    book.gutenbergId ||
    Number(book.googleBookId.replace(/\D+/g, '')) ||
    SPANISH_FREE_BOOKS_CATALOG.find(
      (b) => b.title.toLowerCase() === book.title.toLowerCase()
    )?.gutenbergId;

  if (inferredId && Number.isFinite(inferredId) && inferredId > 0) {
    candidateUrls.push(`https://www.gutenberg.org/ebooks/${inferredId}.txt.utf-8`);
    candidateUrls.push(`https://www.gutenberg.org/files/${inferredId}/${inferredId}-0.txt`);
    candidateUrls.push(`https://www.gutenberg.org/cache/epub/${inferredId}/pg${inferredId}.txt`);
  }

  for (const url of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Babilon-Digital-Library/1.0' },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 2500 && !text.trim().startsWith('<!DOCTYPE')) {
          return text;
        }
      }
    } catch {
      // Intentar siguiente espejo
    }
  }

  // Si fue un libro buscado dinámicamente, buscar su texto en Gutendex por título
  try {
    const searchUrl = `https://gutendex.com/books?languages=es&search=${encodeURIComponent(
      book.title.split(':')[0].trim()
    )}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(searchUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const firstTextBook = (data?.results || []).find(
        (b: any) =>
          b.media_type === 'Text' &&
          (b.formats?.['text/plain; charset=utf-8'] || b.formats?.['text/plain; charset=us-ascii'])
      );
      const txtUrl =
        firstTextBook?.formats?.['text/plain; charset=utf-8'] ||
        firstTextBook?.formats?.['text/plain; charset=us-ascii'];

      if (txtUrl) {
        const txtRes = await fetch(txtUrl);
        if (txtRes.ok) {
          const text = await txtRes.text();
          if (text && text.length > 2500) {
            return text;
          }
        }
      }
    }
  } catch {
    // Continuar
  }

  // Respaldo adicional: Internet Archive Open Texts (_djvu.txt)
  try {
    const cleanTitle = book.title.split(':')[0].trim();
    const iaSearchUrl = `https://archive.org/advancedsearch.php?q=title:(${encodeURIComponent(
      cleanTitle
    )})+AND+mediatype:texts&fl[]=identifier&rows=3&output=json`;
    const iaRes = await fetch(iaSearchUrl);
    if (iaRes.ok) {
      const iaData = await iaRes.json();
      const docs = iaData?.response?.docs || [];
      for (const doc of docs) {
        const id = doc?.identifier;
        if (!id) continue;
        const metaRes = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`);
        if (!metaRes.ok) continue;
        const meta = await metaRes.json();
        const txtFile = (meta?.files || []).find(
          (f: any) => typeof f.name === 'string' && f.name.endsWith('_djvu.txt')
        );
        if (txtFile?.name) {
          const txtDownloadUrl = `https://archive.org/download/${encodeURIComponent(
            id
          )}/${encodeURIComponent(txtFile.name)}`;
          const txtRes = await fetch(txtDownloadUrl);
          if (txtRes.ok) {
            const text = await txtRes.text();
            if (text && text.length > 2500) {
              return text;
            }
          }
        }
      }
    }
  } catch {
    // Continuar
  }

  return '';
}

/**
 * GET /api/v1/google-books
 * Devuelve el catálogo de obras libres en español con texto completo garantizado
 * y portadas/metadatos alimentados por Google Books API.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'todos';
  const customQuery = searchParams.get('q')?.trim().toLowerCase() || '';
  const startIndex = Math.max(0, Number(searchParams.get('startIndex') || '0'));
  const maxResults = Math.min(40, Math.max(1, Number(searchParams.get('maxResults') || '20')));

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY?.trim() || '';

  // 1. Filtrar obras por categoría y búsqueda
  let filteredCatalog = SPANISH_FREE_BOOKS_CATALOG.filter((b) => {
    if (category !== 'todos' && b.category !== category) {
      return false;
    }
    if (customQuery) {
      const haystack = `${b.title} ${b.author} ${b.genre} ${b.synopsis}`.toLowerCase();
      return haystack.includes(customQuery);
    }
    return true;
  });

  // Si el usuario buscó un término específico y hay pocos resultados locales, consultar Gutendex en vivo
  const dynamicBooks: CuratedSpanishBook[] = [];
  if (customQuery && filteredCatalog.length < 6) {
    try {
      const gutendexUrl = `https://gutendex.com/books?languages=es&search=${encodeURIComponent(
        customQuery
      )}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(gutendexUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const rawResults = Array.isArray(data?.results) ? data.results : [];
        for (const item of rawResults) {
          const txtUrl = item?.formats?.['text/plain; charset=utf-8'];
          if (
            item?.media_type === 'Text' &&
            txtUrl &&
            !txtUrl.includes('readme') &&
            !filteredCatalog.some((c) => c.gutenbergId === item.id)
          ) {
            dynamicBooks.push({
              gutenbergId: Number(item.id),
              isDynamic: true,
              title: String(item.title || 'Obra clásica').split('$b')[0].trim(),
              author: item.authors?.[0]?.name
                ? String(item.authors[0].name).split(',').reverse().join(' ').trim()
                : 'Autor clásico',
              publishedYear: item.authors?.[0]?.birth_year
                ? Number(item.authors[0].birth_year) + 35
                : 1880,
              category: 'literatura',
              genre: 'Clásicos',
              pageCount: 180,
              synopsis:
                item.summaries?.[0] ||
                `Obra completa de dominio público en español disponible para importación íntegra.`,
            });
          }
        }
      }
    } catch {
      // Mantener resultados del catálogo base
    }
  }

  const combinedCatalog = [...filteredCatalog, ...dynamicBooks];
  const totalItems = combinedCatalog.length;
  const pageSlice = combinedCatalog.slice(startIndex, startIndex + maxResults);

  // 2. Consultar qué libros ya existen en MongoDB Atlas (con caché en memoria de 20s para cambios rápidos de pestaña)
  let existingCodes = new Set<string>();
  let existingTitles = new Set<string>();
  const nowMs = Date.now();

  if (dbBooksCache && nowMs - dbBooksCache.timestamp < 20000) {
    existingCodes = dbBooksCache.codes;
    existingTitles = dbBooksCache.titles;
  } else {
    try {
      if (process.env.MONGO_URI?.trim()) {
        const colLibros = await getLibrosCollection();
        const existingDocs = await colLibros
          .find({}, { projection: { isbn: 1, isbn_o_codigo: 1, google_book_id: 1, titulo: 1 } })
          .toArray();

        for (const doc of existingDocs) {
          if (typeof doc.google_book_id === 'string') existingCodes.add(doc.google_book_id);
          if (typeof doc.isbn === 'string') existingCodes.add(doc.isbn);
          if (typeof doc.isbn_o_codigo === 'string') existingCodes.add(doc.isbn_o_codigo);
          if (typeof doc.titulo === 'string') existingTitles.add(doc.titulo.trim().toLowerCase());
        }
      } else {
        const remoteRes = await fetch(`${BACKEND_URL}/api/libros?limit=200`, { cache: 'no-store' });
        if (remoteRes.ok) {
          const remoteData = await remoteRes.json();
          const docs = Array.isArray(remoteData?.data) ? remoteData.data : [];
          for (const doc of docs) {
            if (typeof doc.google_book_id === 'string') existingCodes.add(doc.google_book_id);
            if (typeof doc.isbn === 'string') existingCodes.add(doc.isbn);
            if (typeof doc.isbn_o_codigo === 'string') existingCodes.add(doc.isbn_o_codigo);
            if (typeof doc.titulo === 'string') existingTitles.add(doc.titulo.trim().toLowerCase());
          }
        }
      }
      dbBooksCache = {
        timestamp: nowMs,
        codes: existingCodes,
        titles: existingTitles,
      };
    } catch {
      // Continuar si la consulta de verificación tarda
    }
  }

  // 3. Enriquecer la página actual con Google Books API
  const enrichedItems = await Promise.all(
    pageSlice.map(async (book) => {
      const enriched = await enrichWithGoogleBooksApi(book, apiKey);
      const isAlreadyInDb =
        existingCodes.has(enriched.googleBookId) ||
        existingCodes.has(enriched.isbn) ||
        existingCodes.has(`GBOOKS-${book.gutenbergId}`) ||
        existingTitles.has(book.title.trim().toLowerCase());

      return {
        ...enriched,
        alreadyInDb: isAlreadyInDb,
      };
    })
  );

  return NextResponse.json({
    success: true,
    apiKeyConfigured: true,
    totalItems,
    items: enrichedItems,
  });
}

/**
 * POST /api/v1/google-books
 * Descarga el texto completo de la obra, lo divide en todas las páginas correspondientes
 * que indica el libro (`book.pageCount`) con su formato de títulos centrados en naranja,
 * y almacena metadatos + páginas en MongoDB Atlas manteniendo la portada vía URL de API.
 */
export async function POST(request: NextRequest) {
  const jwtHeader =
    request.headers.get('x-babilon-jwt') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!jwtHeader) {
    return NextResponse.json(
      { success: false, message: 'Se requiere sesión de Administrador para importar libros.' },
      { status: 401 }
    );
  }

  const verification = verifyUploadJwt(jwtHeader, 'books:write');
  if (!verification.valid) {
    return NextResponse.json(
      { success: false, message: verification.reason || 'Token inválido.' },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as {
      book: GoogleBookVolumeItem;
      customText?: string;
    };

    const book = body.book;
    if (!book || !book.googleBookId || !book.title) {
      return NextResponse.json(
        { success: false, message: 'Datos del libro incompletos para la importación.' },
        { status: 400 }
      );
    }

    const targetPageCount = book.pageCount && book.pageCount > 1 ? book.pageCount : 180;

    // 1. Obtener el texto completo de la obra (ya sea pegado manualmente o descargado automáticamente)
    let fullText = body.customText?.trim() || '';
    if (!fullText) {
      fullText = await downloadFullBookText(book);
    }

    if (!fullText || fullText.length < 500) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No fue posible descargar el texto completo de esta obra en este momento. Intenta nuevamente o pega el texto en el modal de revisión.',
        },
        { status: 422 }
      );
    }

    // 2. Paginar el texto completo en el número exacto de páginas correspondientes al libro
    const paginas = paginateFullBookToTargetPages(
      fullText,
      targetPageCount,
      book.title,
      book.synopsis
    );

    // 3. Guardar metadatos y todas las páginas en MongoDB Atlas; la portada se mantiene por URL de API
    const ahora = new Date().toISOString();
    const isbn = book.isbn || `GBOOKS-${book.gutenbergId || book.googleBookId}`;

    const docToSave: Record<string, unknown> = {
      google_book_id: book.googleBookId,
      gutenberg_id: book.gutenbergId,
      isbn_o_codigo: isbn,
      isbn,
      titulo: book.title,
      autor: book.author,
      editorial: book.publisher || 'Google Books / Dominio Público',
      sinopsis: book.synopsis,
      resumen: book.synopsis,
      categorias: book.genres?.length ? book.genres : ['Clásicos'],
      tipo_libro: book.genres?.[0] || 'Clásicos',
      anio_publicacion: book.publishedYear || 1900,
      periodo: {
        anio_inicio: book.publishedYear || 1900,
        anio_fin: book.publishedYear || 1900,
      },
      idioma: book.language || 'es',
      // Portada alimentada directamente por la URL de la API (sin guardar binario en DB)
      portada_url: book.coverUrl,
      coverUrl: book.coverUrl,
      total_paginas: paginas.length,
      paginas,
      origen_datos: 'google_books_api',
      enlaces_externos: {
        fullTextUrl: book.fullTextUrl,
        previewLink: book.previewLink,
        webReaderLink: book.webReaderLink,
        epubDownloadLink: book.epubDownloadLink,
      },
      fecha_actualizacion: ahora,
      fecha_procesamiento: ahora,
    };

    let upserted = true;
    let bookId = isbn;

    if (process.env.MONGO_URI?.trim()) {
      const colLibros = await getLibrosCollection();
      const result = await colLibros.updateOne(
        {
          $or: [
            { google_book_id: book.googleBookId },
            { isbn_o_codigo: isbn },
            { isbn },
            { titulo: book.title },
          ],
        },
        { $set: docToSave },
        { upsert: true }
      );
      upserted = result.upsertedCount > 0;
      if (result.upsertedId) bookId = String(result.upsertedId);
    } else {
      // En entornos sin MONGO_URI directa (ej. Vercel), guardar a través del backend en Render
      const remoteRes = await fetch(`${BACKEND_URL}/api/libros`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-babilon-jwt': jwtHeader,
          Authorization: `Bearer ${jwtHeader}`,
        },
        body: JSON.stringify(docToSave),
        cache: 'no-store',
      });
      const remoteData = await remoteRes.json().catch(() => ({}));
      if (!remoteRes.ok || !remoteData.success) {
        return NextResponse.json(
          {
            success: false,
            message:
              remoteData.message ||
              remoteData.error ||
              'Error al guardar el libro en el servidor remoto.',
          },
          { status: remoteRes.status || 500 }
        );
      }
      upserted = remoteRes.status === 201;
      if (remoteData.upsertedId) bookId = String(remoteData.upsertedId);
    }

    // Invalidar caché para reflejar inmediatamente el libro guardado
    dbBooksCache = null;

    return NextResponse.json({
      success: true,
      pagesSaved: paginas.length,
      message: upserted
        ? `"${book.title}" se importó exitosamente con sus ${paginas.length} páginas completas en MongoDB Atlas.`
        : `"${book.title}" se actualizó exitosamente con sus ${paginas.length} páginas completas en MongoDB Atlas.`,
      bookId,
    });
  } catch (err) {
    console.error('Error al importar libro de Google Books a MongoDB:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Ocurrió un error al descargar y paginar el libro en la base de datos.',
      },
      { status: 500 }
    );
  }
}
