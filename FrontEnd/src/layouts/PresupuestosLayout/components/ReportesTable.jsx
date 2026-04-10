import React from "react";
import BounceLoader from "react-spinners/BounceLoader";
import { getReporteDetalle } from "../../../api/controllers/Presupuesto";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;

  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();

  return `${d}/${m}/${y}`;
};

const getEstadoBadge = (estado) => {
  const badges = {
    EN_ESPERA: { bg: "bg-gray-500", text: "text-white", label: "En espera" },
    APROBADO_ESPERA: { bg: "bg-yellow-500", text: "text-white", label: "Aprobado en espera" },
    EJECUTADO: { bg: "bg-blue-600", text: "text-white", label: "Ejecutado" },
    PAGADO: { bg: "bg-green-600", text: "text-white", label: "Pagado" },
    CANCELADO: { bg: "bg-red-600", text: "text-white", label: "Cancelado" },
  };

  const badge = badges[estado] || { bg: "bg-gray-400", text: "text-white", label: estado };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
      {badge.label}
    </span>
  );
};

export default function ReportesTable({
  columns,
  data = [],
  loading,
  onRowClick,
  onAction, 
}) {
  return (
    <div className="relative flex flex-col h-full -m-7">
      {loading ? (
        <div className="flex justify-center items-center h-[30vh]">
          <BounceLoader color="#0b2c4d" size={70} />
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[40vh] border rounded-lg">
          <table className="w-full text-left min-w-[520px]">
            {/* HEADER */}
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-xs text-gray-600 border-b font-bold">
                {columns.map((col) => (
                  <th key={col.key} className="pb-2 px-3 font-medium text-center">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length ? (
                data.map((row, i) => (
                  <tr
                    key={i}
                    onClick={() => onRowClick?.(row)}
                    className="border-b hover:bg-blue-50/40 transition"
                  >
                    {columns.map((col, index) => {
                      if (col.type === "action") {
                        const Icon = col.icon;
                        return (
                          <td
                            key={col.key}
                            className="px-3 py-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => onAction?.(col.action, row)}
                              className={`text-gray-500 transition ${col.hoverColor || "hover:text-[#0b2c4d]"
                                }`}
                              title={col.action}
                            >
                              <Icon size={20} />
                            </button>

                          </td>
                        );
                      }
                      const value = row[col.key];
                      const display =
                        col.key.toLowerCase().includes("fecha")
                          ? formatDate(value)
                          : value ?? "—";

                      const isEstadoColumn = col.key === "estado_display";

                      return (
                        <td
                          key={col.key}
                          className={`px-3 py-3 text-sm ${index === 0
                              ? "font-medium text-gray-900"
                              : "text-gray-700"
                            }`}
                        >
                          {isEstadoColumn ? getEstadoBadge(row.estado) : display}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-6 text-gray-500 italic"
                  >
                    No hay reportes disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
