import { useState, useEffect } from "react";
import {
  FaSearch,
  FaPlus,
  FaMinus,
  FaExclamationTriangle,
  FaTools,
  FaHammer,
  FaBoxOpen,
} from "react-icons/fa";
import { FaHelmetSafety } from "react-icons/fa6";
import { toast } from "react-toastify";

export default function InventarioTable({
  tipo = "EPP",
  data = [],
  onSearch,
  onCantidadChange,
}) {
  const [query, setQuery] = useState("");
  const [cantidades, setCantidades] = useState({});

  // 🔍 Búsqueda con debounce
  useEffect(() => {
    const delay = setTimeout(() => {
      if (onSearch) onSearch(query);
    }, 500);
    return () => clearTimeout(delay);
  }, [query, onSearch]);

  // 🧩 Iconos dinámicos por tipo
  const getIcon = () => {
    switch (tipo) {
      case "EPP":
        return <FaHelmetSafety size={18} />;
      case "stock":
        return <FaTools size={18} />;
      case "consumibles":
        return <FaHammer size={18} />;
      default:
        return <FaBoxOpen size={18} />;
    }
  };

  const titulo =
    tipo === "stock"
      ? "Ferretería"
      : tipo === "EPP"
      ? "E.P.P."
      : tipo === "consumibles"
      ? "Consumibles"
      : tipo;

  // 🧮 Cambiar cantidad (con validación de límite)
  const handleChange = (id, delta) => {
    setCantidades((prev) => {
      const actual = prev[id] || 0;
      const item = data.find((d) => d.id === id);
      const stockDisponible = item?.unidades ?? 0;
      const nuevoValor = Math.max(actual + delta, 0);

      if (nuevoValor > stockDisponible) {
        toast.warning(`${titulo}: stock insuficiente.`, {
          position: "top-right",
          autoClose: 2500,
        });
        return prev; // ❌ No aumentar más allá del límite
      }

      const actualizado = { ...prev, [id]: nuevoValor };
      if (onCantidadChange) onCantidadChange(id, nuevoValor);
      return actualizado;
    });
  };

  return (
    <div
      className={`relative bg-white shadow-md rounded-lg p-5 pt-10 h-full max-h-[calc(65vh-8rem)] min-h-[calc(65vh-8rem)] flex flex-col`}
    >
      {/* === HEADER === */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div
            className="absolute -top-5 left-5 w-12 h-12 flex items-center justify-center rounded-lg shadow-md"
            style={{ backgroundColor: "#0B2C4D", color: "white" }}
          >
            {getIcon()}
          </div>
          <h2 className="text-lg font-bold text-gray-800">{titulo}</h2>
        </div>

        <div className="relative">
          <FaSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={14}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar producto..."
            className="pl-8 pr-3 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C4D]"
          />
        </div>
      </div>

      {/* === TABLA === */}
      <div className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <table className="w-full text-left border-collapse min-w-[520px]">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="text-gray-500 text-xs uppercase border-b">
              <th className="pb-2 px-2">Nombre</th>
              {tipo !== "EPP" && <th className="pb-2 px-2">Modelo</th>}
              <th className="pb-2 px-2 text-center">Stock</th>
              <th className="pb-2 px-2 text-center">Acción</th>
            </tr>
          </thead>

          <tbody>
            {data.length > 0 ? (
              data.map((item) => {
                const stock = item.unidades ?? 0;
                const cantidad = cantidades[item.id] || 0;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 border-b transition-colors last:border-none"
                  >
                    <td className="py-2.5 px-2 text-sm font-medium text-gray-700">
                      {item.name || "—"}
                    </td>

                    {tipo !== "EPP" && (
                      <td className="py-2.5 px-2 text-sm text-gray-800">
                        {item.modelo || "—"}
                      </td>
                    )}

                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`font-semibold ${
                          stock > 5
                            ? "text-green-600"
                            : stock > 0
                            ? "text-orange-500"
                            : "text-red-600"
                        }`}
                      >
                        {stock}
                      </span>
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleChange(item.id, -1)}
                          className="p-1 border rounded hover:bg-gray-100"
                        >
                          <FaMinus size={12} />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">
                          {cantidad}
                        </span>
                        <button
                          onClick={() => handleChange(item.id, +1)}
                          className="p-1 border rounded hover:bg-gray-100"
                        >
                          <FaPlus size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={tipo !== "EPP" ? "4" : "3"}
                  className="text-center py-4 text-gray-500 italic"
                >
                  No hay productos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
