import { FaPlus, FaMinus } from "react-icons/fa";

export default function TableRow({
  item,
  tipo,
  cantidad,
  isSelected,
  desp,
  onCantidadChange,
  onDepreciacionChange,
  onDescripcionClick,
  handleCantidadInputChange,
}) {
  const precioUnitario = item.mts_ml_m2 ?? item.utilidad_15 ?? item.costo ?? 0;
  const total = cantidad * (1 + desp / 100) * precioUnitario;

  return (
    <tr
      className={`
        border-b transition-colors last:border-none
        ${isSelected
          ? "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500"
          : "hover:bg-gray-50"}
      `}
    >
      {/* Descripción (clickable para editar) */}
      <td
        className="py-2.5 px-2 text-sm font-medium text-gray-700 cursor-pointer hover:text-[#0B2C4D]"
        onClick={onDescripcionClick}
      >
        {item.descripcion ?? "—"}
      </td>

      {/* Unidad */}
      <td className="py-2.5 px-2 text-sm text-gray-700">
        {item.pza || item.unidad || "—"}
      </td>

      {/* Cantidad */}
      <td className="py-2.5 px-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onCantidadChange(item.id, -1)}
            className="p-1 border rounded hover:bg-gray-100"
          >
            <FaMinus size={12} />
          </button>

          <input
            type="number"
            value={cantidad ?? ""}
            min="0"
            step="any"
            onChange={(e) =>
              handleCantidadInputChange(
                item.id,
                parseFloat(e.target.value || 0)
              )
            }
            className="w-12 text-center text-sm font-medium border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0B2C4D] no-spin"
          />

          <button
            onClick={() => onCantidadChange(item.id, +1)}
            className="p-1 border rounded hover:bg-gray-100"
          >
            <FaPlus size={12} />
          </button>
        </div>
      </td>

      {/* Desp (%) */}
      <td className="py-2.5 px-2 text-center">
        <input
          type="number"
          step="any"
          value={desp ?? ""}
          onChange={(e) =>
            onDepreciacionChange(item.id, parseFloat(e.target.value) || 0)
          }
          className="w-14 text-center text-sm font-medium border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0B2C4D] no-spin"
        />
      </td>

      {/* Precio Unitario */}
      {tipo !== "EPP" && (
        <td className="py-2.5 px-2 text-sm text-gray-700 text-center">
          ${Number(precioUnitario || 0).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
      )}

      {/* Total */}
      <td className="py-2.5 px-2 text-sm font-semibold text-gray-800 text-center">
        ${isNaN(total) ? "0,00" : Number(total).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
    </tr>
  );
}
