import { Book } from '@babilon/shared-types';

export interface BitacoraPdfStats {
  totalBooks: number;
  updatedBooks: number;
  originalBooks: number;
  totalPages: number;
  latestActivity: string;
  filterLabel: string;
  sortLabel: string;
}

/**
 * Convierte una cadena UTF-8 a bytes Windows-1252 (WinAnsiEncoding) escapados para literales PDF.
 * Soporta todos los caracteres en español (á, é, í, ó, ú, ñ, Ñ, ü, ¿, ¡, «, », —, •, ·).
 */
function toPdfWinAnsiString(input: string): string {
  const win1252Map: Record<number, number> = {
    0x20ac: 0x80,
    0x201a: 0x82,
    0x0192: 0x83,
    0x201e: 0x84,
    0x2026: 0x85,
    0x2020: 0x86,
    0x2021: 0x87,
    0x02c6: 0x88,
    0x2030: 0x89,
    0x0160: 0x8a,
    0x2039: 0x8b,
    0x0152: 0x8c,
    0x017d: 0x8e,
    0x2018: 0x91,
    0x2019: 0x92,
    0x201c: 0x93,
    0x201d: 0x94,
    0x2022: 0x95,
    0x2013: 0x96,
    0x2014: 0x97,
    0x02dc: 0x98,
    0x2122: 0x99,
    0x0161: 0x9a,
    0x203a: 0x9b,
    0x0153: 0x9c,
    0x017e: 0x9e,
    0x0178: 0x9f,
  };

  let out = '(';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    let byte = 0x20;

    if (code >= 0x20 && code <= 0x7e) {
      byte = code;
    } else if (code >= 0xa0 && code <= 0xff) {
      byte = code;
    } else if (win1252Map[code] !== undefined) {
      byte = win1252Map[code];
    } else {
      byte = 0x20;
    }

    if (byte === 0x28) {
      out += '\\(';
    } else if (byte === 0x29) {
      out += '\\)';
    } else if (byte === 0x5c) {
      out += '\\\\';
    } else if (byte < 0x20 || byte > 0x7e) {
      out += '\\' + byte.toString(8).padStart(3, '0');
    } else {
      out += String.fromCharCode(byte);
    }
  }
  out += ')';
  return out;
}

function truncateText(text: string, maxChars: number): string {
  const clean = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= maxChars) return clean;
  return clean.slice(0, Math.max(1, maxChars - 1)).trimEnd() + '…';
}

function formatShortDate(isoDate?: string | null): string {
  if (!isoDate) return 'Registro base';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return 'Registro base';
  const datePart = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
  const timePart = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  return `${datePart} · ${timePart}`;
}

/**
 * Genera y descarga directamente un archivo PDF editorial en formato A4 Horizontal
 * con la Bitácora y Registro Bibliográfico de Babilon.
 */
export function downloadBitacoraPdf(books: Book[], stats: BitacoraPdfStats): void {
  const pageWidth = 841.89; // A4 Landscape width in pt
  const pageHeight = 595.28; // A4 Landscape height in pt
  const marginX = 36;
  const contentWidth = pageWidth - marginX * 2;

  const firstPageRowsCapacity = 10;
  const nextPageRowsCapacity = 13;

  const pagesBooks: Book[][] = [];
  if (books.length <= firstPageRowsCapacity) {
    pagesBooks.push(books);
  } else {
    pagesBooks.push(books.slice(0, firstPageRowsCapacity));
    let offset = firstPageRowsCapacity;
    while (offset < books.length) {
      pagesBooks.push(books.slice(offset, offset + nextPageRowsCapacity));
      offset += nextPageRowsCapacity;
    }
  }

  const totalPdfPages = Math.max(1, pagesBooks.length);
  const generatedAtLabel = formatShortDate(new Date().toISOString());

  // Definición de columnas de la tabla (suma = 769.89 pt ≈ contentWidth)
  const cols = [
    { label: '#', x: marginX + 6, width: 24 },
    { label: 'OBRA Y AUTOR', x: marginX + 32, width: 195 },
    { label: 'ISBN / CÓDIGO', x: marginX + 232, width: 92 },
    { label: 'EDITORIAL Y AÑO', x: marginX + 328, width: 118 },
    { label: 'CATEGORÍA / PÁGS.', x: marginX + 450, width: 95 },
    { label: 'ORIGEN', x: marginX + 548, width: 78 },
    { label: 'FECHA DE SUBIDA', x: marginX + 630, width: 70 },
    { label: 'ACTUALIZACIÓN', x: marginX + 704, width: 65 },
  ];

  const pageStreams: string[] = [];
  let globalRowIndex = 0;

  for (let pageIdx = 0; pageIdx < totalPdfPages; pageIdx++) {
    const chunk = pagesBooks[pageIdx] || [];
    const cmds: string[] = [];

    // Fondo crema suave de la página (#FAF8F5)
    cmds.push('0.980 0.973 0.961 rg');
    cmds.push(`0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)} re f`);

    // Banda superior oscura (#1C1917)
    const headerHeight = pageIdx === 0 ? 68 : 46;
    const headerBottomY = pageHeight - headerHeight;
    cmds.push('0.110 0.098 0.090 rg');
    cmds.push(`0 ${headerBottomY.toFixed(2)} ${pageWidth.toFixed(2)} ${headerHeight.toFixed(2)} re f`);

    // Línea de acento Terracota (#C2593F)
    cmds.push('0.761 0.349 0.247 rg');
    cmds.push(`0 ${(headerBottomY - 2.5).toFixed(2)} ${pageWidth.toFixed(2)} 2.5 re f`);

    if (pageIdx === 0) {
      // Título principal en cabecera
      cmds.push('0.761 0.349 0.247 rg');
      cmds.push('BT /F2 8 Tf');
      cmds.push(`${marginX} ${(pageHeight - 20).toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString('BABILON · ARCHIVO BIBLIOGRÁFICO & AUDITORÍA DE CATÁLOGO')} Tj ET`);

      cmds.push('0.980 0.973 0.961 rg');
      cmds.push('BT /F4 18 Tf');
      cmds.push(`${marginX} ${(pageHeight - 40).toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString('Bitácora y Registro de Subida de Libros')} Tj ET`);

      cmds.push('0.720 0.698 0.675 rg');
      cmds.push('BT /F1 8.5 Tf');
      cmds.push(`${marginX} ${(pageHeight - 55).toFixed(2)} Td`);
      cmds.push(
        `${toPdfWinAnsiString(
          `Reporte de fechas de subida, metadatos técnicos y control de actualizaciones · Filtro: ${stats.filterLabel} · ${stats.sortLabel}`
        )} Tj ET`
      );

      // Fecha de emisión a la derecha
      cmds.push('0.920 0.900 0.880 rg');
      cmds.push('BT /F2 8.5 Tf');
      cmds.push(`${(pageWidth - marginX - 165).toFixed(2)} ${(pageHeight - 32).toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString(`Emitido: ${generatedAtLabel}`)} Tj ET`);

      cmds.push('0.720 0.698 0.675 rg');
      cmds.push('BT /F1 8 Tf');
      cmds.push(`${(pageWidth - marginX - 165).toFixed(2)} ${(pageHeight - 46).toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString(`Registros en reporte: ${books.length} obras`)} Tj ET`);
    } else {
      cmds.push('0.980 0.973 0.961 rg');
      cmds.push('BT /F4 13 Tf');
      cmds.push(`${marginX} ${(pageHeight - 28).toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString('Bitácora y Registro Bibliográfico Babilon (Continuación)')} Tj ET`);

      cmds.push('0.720 0.698 0.675 rg');
      cmds.push('BT /F1 8.5 Tf');
      cmds.push(`${(pageWidth - marginX - 140).toFixed(2)} ${(pageHeight - 28).toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString(`Página ${pageIdx + 1} de ${totalPdfPages}`)} Tj ET`);
    }

    let tableTopY = headerBottomY - 16;

    // En la primera página, dibujar las 4 tarjetas KPI de resumen
    if (pageIdx === 0) {
      const kpiY = headerBottomY - 56;
      const kpiHeight = 42;
      const gap = 12;
      const cardWidth = (contentWidth - gap * 3) / 4;

      const kpis = [
        {
          title: 'OBRAS REGISTRADAS',
          value: String(stats.totalBooks),
          sub: 'Total en catálogo',
        },
        {
          title: 'OBRAS ACTUALIZADAS',
          value: String(stats.updatedBooks),
          sub: `${stats.originalBooks} sin modificaciones`,
        },
        {
          title: 'PÁGINAS EN ARCHIVO',
          value: stats.totalPages.toLocaleString('es-MX'),
          sub: 'Folios digitalizados',
        },
        {
          title: 'ÚLTIMO MOVIMIENTO',
          value: truncateText(stats.latestActivity, 24),
          sub: 'Actividad reciente',
        },
      ];

      kpis.forEach((kpi, idx) => {
        const cardX = marginX + idx * (cardWidth + gap);
        // Fondo blanco y borde piedra suave
        cmds.push('1 1 1 rg');
        cmds.push('0.878 0.863 0.843 RG 0.7 w');
        cmds.push(`${cardX.toFixed(2)} ${kpiY.toFixed(2)} ${cardWidth.toFixed(2)} ${kpiHeight} re B`);

        // Acento lateral
        cmds.push('0.761 0.349 0.247 rg');
        cmds.push(`${cardX.toFixed(2)} ${kpiY.toFixed(2)} 3 ${kpiHeight} re f`);

        cmds.push('0.471 0.443 0.424 rg');
        cmds.push('BT /F2 6.8 Tf');
        cmds.push(`${(cardX + 10).toFixed(2)} ${(kpiY + 30).toFixed(2)} Td`);
        cmds.push(`${toPdfWinAnsiString(kpi.title)} Tj ET`);

        cmds.push('0.110 0.098 0.090 rg');
        cmds.push('BT /F2 11.5 Tf');
        cmds.push(`${(cardX + 10).toFixed(2)} ${(kpiY + 16).toFixed(2)} Td`);
        cmds.push(`${toPdfWinAnsiString(kpi.value)} Tj ET`);

        cmds.push('0.550 0.520 0.490 rg');
        cmds.push('BT /F1 6.8 Tf');
        cmds.push(`${(cardX + 10).toFixed(2)} ${(kpiY + 6).toFixed(2)} Td`);
        cmds.push(`${toPdfWinAnsiString(kpi.sub)} Tj ET`);
      });

      tableTopY = kpiY - 12;
    }

    // Cabecera de la Tabla
    const thHeight = 22;
    const thBottomY = tableTopY - thHeight;
    cmds.push('0.161 0.145 0.141 rg');
    cmds.push(`${marginX} ${thBottomY.toFixed(2)} ${contentWidth.toFixed(2)} ${thHeight} re f`);

    cmds.push('0.961 0.961 0.957 rg');
    cols.forEach((col) => {
      cmds.push('BT /F2 7 Tf');
      cmds.push(`${col.x.toFixed(2)} ${(thBottomY + 7.5).toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString(col.label)} Tj ET`);
    });

    // Filas de Libros
    const rowHeight = 35;
    let currentRowTopY = thBottomY;

    if (chunk.length === 0) {
      const emptyBottomY = currentRowTopY - 40;
      cmds.push('1 1 1 rg');
      cmds.push('0.878 0.863 0.843 RG 0.5 w');
      cmds.push(`${marginX} ${emptyBottomY.toFixed(2)} ${contentWidth.toFixed(2)} 40 re B`);
      cmds.push('0.471 0.443 0.424 rg');
      cmds.push('BT /F1 9 Tf');
      cmds.push(`${(marginX + 20).toFixed(2)} ${(emptyBottomY + 16).toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString('No hay registros para mostrar con los filtros seleccionados.')} Tj ET`);
    }

    chunk.forEach((book, localIdx) => {
      globalRowIndex += 1;
      const rowBottomY = currentRowTopY - rowHeight;

      // Fondo alternado de fila
      if (localIdx % 2 === 0) {
        cmds.push('1 1 1 rg');
      } else {
        cmds.push('0.965 0.953 0.937 rg');
      }
      cmds.push('0.886 0.871 0.851 RG 0.5 w');
      cmds.push(`${marginX} ${rowBottomY.toFixed(2)} ${contentWidth.toFixed(2)} ${rowHeight} re B`);

      const line1Y = rowBottomY + 21;
      const line2Y = rowBottomY + 8.5;

      // Col 0: #
      cmds.push('0.471 0.443 0.424 rg');
      cmds.push('BT /F3 8 Tf');
      cmds.push(`${cols[0].x.toFixed(2)} ${(rowBottomY + 14).toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString(String(globalRowIndex).padStart(2, '0'))} Tj ET`);

      // Col 1: Título y Autor
      cmds.push('0.110 0.098 0.090 rg');
      cmds.push('BT /F2 8.5 Tf');
      cmds.push(`${cols[1].x.toFixed(2)} ${line1Y.toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString(truncateText(book.title, 38))} Tj ET`);

      cmds.push('0.420 0.395 0.375 rg');
      cmds.push('BT /F1 7.5 Tf');
      cmds.push(`${cols[1].x.toFixed(2)} ${line2Y.toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString(truncateText(book.author?.name || 'Autor desconocido', 42))} Tj ET`);

      // Col 2: ISBN / Código e ID corto
      cmds.push('0.161 0.145 0.141 rg');
      cmds.push('BT /F3 7.3 Tf');
      cmds.push(`${cols[2].x.toFixed(2)} ${line1Y.toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString(truncateText(book.isbn || 'N/A', 18))} Tj ET`);

      cmds.push('0.520 0.495 0.475 rg');
      cmds.push('BT /F3 6.5 Tf');
      cmds.push(`${cols[2].x.toFixed(2)} ${line2Y.toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString(`ID: ${truncateText(book.id, 14)}`)} Tj ET`);

      // Col 3: Editorial y Año
      cmds.push('0.161 0.145 0.141 rg');
      cmds.push('BT /F1 7.5 Tf');
      cmds.push(`${cols[3].x.toFixed(2)} ${line1Y.toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString(truncateText(book.publisher || 'Editorial Babilon', 25))} Tj ET`);

      cmds.push('0.471 0.443 0.424 rg');
      cmds.push('BT /F1 7.2 Tf');
      cmds.push(`${cols[3].x.toFixed(2)} ${line2Y.toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString(`Año: ${book.publishedYear || 'S/F'}`)} Tj ET`);

      // Col 4: Categoría y Páginas
      const primaryCat = (book.genres && book.genres[0]) || book.catalogType || 'General';
      cmds.push('0.161 0.145 0.141 rg');
      cmds.push('BT /F2 7.5 Tf');
      cmds.push(`${cols[4].x.toFixed(2)} ${line1Y.toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString(truncateText(primaryCat, 19))} Tj ET`);

      cmds.push('0.471 0.443 0.424 rg');
      cmds.push('BT /F1 7.2 Tf');
      cmds.push(`${cols[4].x.toFixed(2)} ${line2Y.toFixed(2)} Td`);
      cmds.push(
        `${toPdfWinAnsiString(`${book.pageCount || 0} págs. · ${(book.language || 'es').toUpperCase()}`)} Tj ET`
      );

      // Col 5: Origen y Responsable
      cmds.push('0.161 0.145 0.141 rg');
      cmds.push('BT /F1 7.3 Tf');
      cmds.push(`${cols[5].x.toFixed(2)} ${line1Y.toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString(truncateText(book.origin || 'Archivo Babilon', 17))} Tj ET`);

      cmds.push('0.520 0.495 0.475 rg');
      cmds.push('BT /F1 6.8 Tf');
      cmds.push(`${cols[5].x.toFixed(2)} ${line2Y.toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString(truncateText(`Por: ${book.uploadedBy || 'Admin'}`, 17))} Tj ET`);

      // Col 6: Fecha de Subida
      const uploadFormatted = formatShortDate(book.uploadedAt);
      const [uploadDay, uploadHour] = uploadFormatted.split('·').map((s) => s.trim());
      cmds.push('0.110 0.098 0.090 rg');
      cmds.push('BT /F2 7.2 Tf');
      cmds.push(`${cols[6].x.toFixed(2)} ${line1Y.toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString(uploadDay || uploadFormatted)} Tj ET`);

      cmds.push('0.471 0.443 0.424 rg');
      cmds.push('BT /F3 6.8 Tf');
      cmds.push(`${cols[6].x.toFixed(2)} ${line2Y.toFixed(2)} Td`);
      cmds.push(`${toPdfWinAnsiString(uploadHour || '')} Tj ET`);

      // Col 7: Estado / Fecha de Actualización
      const hasUpdate = Boolean(book.wasUpdated && book.updatedAt);
      if (hasUpdate) {
        const updateFormatted = formatShortDate(book.updatedAt);
        const [updDay, updHour] = updateFormatted.split('·').map((s) => s.trim());
        cmds.push('0.761 0.349 0.247 rg');
        cmds.push('BT /F2 7.2 Tf');
        cmds.push(`${cols[7].x.toFixed(2)} ${line1Y.toFixed(2)} Td`);
        cmds.push(`${toPdfWinAnsiString(updDay || 'Editado')} Tj ET`);

        cmds.push('0.580 0.260 0.180 rg');
        cmds.push('BT /F3 6.6 Tf');
        cmds.push(`${cols[7].x.toFixed(2)} ${line2Y.toFixed(2)} Td`);
        cmds.push(`${toPdfWinAnsiString(updHour ? `Act. ${updHour}` : 'Actualizado')} Tj ET`);
      } else {
        cmds.push('0.086 0.490 0.325 rg');
        cmds.push('BT /F2 7.2 Tf');
        cmds.push(`${cols[7].x.toFixed(2)} ${line1Y.toFixed(2)} Td`);
        cmds.push(`${toPdfWinAnsiString('Original')} Tj ET`);

        cmds.push('0.471 0.443 0.424 rg');
        cmds.push('BT /F1 6.7 Tf');
        cmds.push(`${cols[7].x.toFixed(2)} ${line2Y.toFixed(2)} Td`);
        cmds.push(`${toPdfWinAnsiString('Sin cambios')} Tj ET`);
      }

      currentRowTopY = rowBottomY;
    });

    // Pie de página
    cmds.push('0.850 0.835 0.815 RG 0.6 w');
    cmds.push(`${marginX} 26 ${(pageWidth - marginX).toFixed(2)} 26 l S`);

    cmds.push('0.471 0.443 0.424 rg');
    cmds.push('BT /F1 7.5 Tf');
    cmds.push(`${marginX} 14 Td`);
    cmds.push(
      `${toPdfWinAnsiString(
        'Babilon — Plataforma Editorial & Archivo Bibliográfico Digital · Reporte Oficial de Bitácora'
      )} Tj ET`
    );

    cmds.push('BT /F2 7.5 Tf');
    cmds.push(`${(pageWidth - marginX - 95).toFixed(2)} 14 Td`);
    cmds.push(`${toPdfWinAnsiString(`Página ${pageIdx + 1} de ${totalPdfPages}`)} Tj ET`);

    pageStreams.push(cmds.join('\n'));
  }

  // Ensamblar objetos PDF 1.4
  // Obj 1: Catalog, Obj 2: Pages, Obj 3..6: Fonts (Helvetica, Helvetica-Bold, Courier, Times-Bold)
  const objects: string[] = [];
  const addObject = (body: string): number => {
    objects.push(body);
    return objects.length;
  };

  addObject('<< /Type /Catalog /Pages 2 0 R >>'); // 1
  addObject(''); // 2 (se rellena con Kids)
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'); // 3: /F1
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'); // 4: /F2
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>'); // 5: /F3
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>'); // 6: /F4

  const pageObjectIds: number[] = [];

  for (const streamContent of pageStreams) {
    const contentId = addObject(
      `<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`
    );
    const pageId = addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(
        2
      )}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageObjectIds.push(pageId);
  }

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds
    .map((id) => `${id} 0 R`)
    .join(' ')}] /Count ${pageObjectIds.length} >>`;

  // Construir tabla xref y archivo final
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  // Convertir string Latin1 a Uint8Array para descarga binaria limpia
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) {
    bytes[i] = pdf.charCodeAt(i) & 0xff;
  }

  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bitacora-libros-babilon-${new Date().toISOString().slice(0, 10)}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
