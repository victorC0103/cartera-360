/**
 * Pagination.jsx — Componente reutilizable de paginación Enterprise UI
 * Uso:
 *   <Pagination
 *     totalItems={filteredData.length}
 *     pageSize={pageSize}
 *     currentPage={currentPage}
 *     onPageChange={setCurrentPage}
 *     onPageSizeChange={setPageSize}
 *   />
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function Pagination({
  totalItems = 0,
  pageSize = 10,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem   = Math.min(safePage * pageSize, totalItems);

  // Generar rango de páginas visibles con elipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (safePage >= totalPages - 3)
      return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', safePage - 1, safePage, safePage + 1, '…', totalPages];
  };

  const pages = getPageNumbers();

  const btnBase =
    'inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium transition-all select-none';
  const btnEnabled =
    'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer';
  const btnDisabled =
    'text-gray-300 cursor-not-allowed';
  const btnActive =
    'bg-indigo-600 text-white shadow-sm cursor-default pointer-events-none';
  const btnEllipsis =
    'text-gray-400 cursor-default pointer-events-none';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-gray-100">
      {/* Izquierda: info de registros + selector de tamaño */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>
          {totalItems === 0
            ? 'Sin registros'
            : `Mostrando ${startItem}–${endItem} de ${totalItems} registros`}
        </span>
        <span className="hidden sm:inline text-gray-200">|</span>
        <div className="hidden sm:flex items-center gap-1.5">
          <span>Filas:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange?.(Number(e.target.value));
              onPageChange?.(1);
            }}
            className="border border-gray-200 rounded-md text-xs text-gray-700 px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Derecha: controles de navegación */}
      <div className="flex items-center gap-0.5">
        {/* Primer página */}
        <button
          onClick={() => onPageChange?.(1)}
          disabled={safePage === 1}
          title="Primera página"
          className={`${btnBase} ${safePage === 1 ? btnDisabled : btnEnabled}`}
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Anterior */}
        <button
          onClick={() => onPageChange?.(safePage - 1)}
          disabled={safePage === 1}
          title="Página anterior"
          className={`${btnBase} ${safePage === 1 ? btnDisabled : btnEnabled}`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Números de página */}
        {pages.map((p, idx) =>
          p === '…' ? (
            <span key={`ellipsis-${idx}`} className={`${btnBase} ${btnEllipsis}`}>
              ···
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange?.(p)}
              className={`${btnBase} ${p === safePage ? btnActive : btnEnabled}`}
            >
              {p}
            </button>
          )
        )}

        {/* Siguiente */}
        <button
          onClick={() => onPageChange?.(safePage + 1)}
          disabled={safePage === totalPages}
          title="Página siguiente"
          className={`${btnBase} ${safePage === totalPages ? btnDisabled : btnEnabled}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Última página */}
        <button
          onClick={() => onPageChange?.(totalPages)}
          disabled={safePage === totalPages}
          title="Última página"
          className={`${btnBase} ${safePage === totalPages ? btnDisabled : btnEnabled}`}
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
