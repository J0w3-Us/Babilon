import { GoogleBooksExplorerView } from '@/modules/google-books/GoogleBooksExplorerView';

export const metadata = {
  title: 'Obras Libres (Google Books API) | Babilon',
  description: 'Explorador e importador de obras de uso libre desde Google Books API hacia MongoDB Atlas.',
};

export default function ExplorarLibresPage() {
  return <GoogleBooksExplorerView />;
}

