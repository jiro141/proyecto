import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

/**
 * Paginator visual reutilizable para tablas con paginación server-side.
 *
 * @param {number} currentPage - Página actual (1-indexed)
 * @param {number} totalCount  - Total de registros en el backend
 * @param {number} pageSize    - Cantidad de registros por página
 * @param {function} onPageChange - Callback que recibe la nueva página (1-indexed)
 * @param {number} [siblingCount=1] - Cuántas páginas mostrar a cada lado de la actual
 */
export default function Paginator({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
  siblingCount = 1,
}) {
  const totalPages = Math.ceil(totalCount / pageSize);

  // No mostrar nada si hay 0 o 1 página
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Generar rango de páginas a mostrar
  const generatePageNumbers = () => {
    const pages = [];
    const leftSibling = Math.max(currentPage - siblingCount, 1);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages);

    // Siempre incluir la primera página
    if (leftSibling > 1) {
      pages.push(1);
      if (leftSibling > 2) {
        pages.push("...");
      }
    }

    // Páginas centrales
    for (let i = leftSibling; i <= rightSibling; i++) {
      pages.push(i);
    }

    // Siempre incluir la última página
    if (rightSibling < totalPages) {
      if (rightSibling < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = generatePageNumbers();

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
      {/* Info de registros */}
      <p className="text-sm text-gray-600">
        Mostrando <span className="font-medium">{startItem}</span> -{" "}
        <span className="font-medium">{endItem}</span> de{" "}
        <span className="font-medium">{totalCount}</span> registros
      </p>

      {/* Controles de navegación */}
      <div className="flex items-center gap-1">
        {/* Botón Anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition ${
            currentPage === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          }`}
          title="Página anterior"
        >
          <FaChevronLeft size={14} />
        </button>

        {/* Números de página */}
        {pages.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-1 text-sm text-gray-500"
              >
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                currentPage === page
                  ? "bg-[#0b2c4d] text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* Botón Siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition ${
            currentPage === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          }`}
          title="Página siguiente"
        >
          <FaChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
