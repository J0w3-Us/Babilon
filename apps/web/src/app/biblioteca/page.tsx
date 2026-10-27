import { Suspense } from 'react';
import { BibliotecaView } from '@/modules/biblioteca/BibliotecaView';

export default function BibliotecaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 dark:bg-surface-50 flex items-center justify-center">
          <div className="text-center font-serif text-stone-600 dark:text-stone-400 text-sm">
            Cargando Biblioteca Babilon...
          </div>
        </div>
      }
    >
      <BibliotecaView />
    </Suspense>
  );
}
