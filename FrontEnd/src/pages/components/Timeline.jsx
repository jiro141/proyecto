import { HiMiniArrowsUpDown } from "react-icons/hi2";

import { FaHardHat, FaTools, FaHammer } from "react-icons/fa";
import { FaArrowUp, FaArrowDown } from "react-icons/fa6";

export default function TimelineCard({ movimientos }) {
  const getIcon = (mov) => {
    if (mov.epp) return <FaHardHat className="text-[#0B2C4D]" size={18} />;
    if (mov.stock) return <FaTools className="text-[#0B2C4D]" size={18} />;
    if (mov.consumible)
      return <FaHammer className="text-[#0B2C4D]" size={18} />;
    return null;
  };

  const getArrow = (tipo) => {
    return tipo === "entrada" ? (
      <FaArrowUp className="text-green-500" />
    ) : (
      <FaArrowDown className="text-red-500" />
    );
  };

  return (
    <div className=" absolute bg-white shadow-md rounded-lg p-5 flex flex-col max-h-[calc(95vh-6rem)]">
      {/* Header con icono y título */}
      <div className="flex items-center mb-4">
        <div
          className="absolute -top-4 left-5 w-12 h-12 flex items-center justify-center rounded-lg shadow-md"
          style={{ backgroundColor: "#0B2C4D", color: "white" }}
        >
          <HiMiniArrowsUpDown size={18} />
        </div>
        <h2 className=" text-lg font-bold text-gray-800 mt-5">Movimientos</h2>
      </div>

      {/* Lista con scroll */}
      <div className="flex-1 overflow-y-auto custom-scroll pr-2 min-h-[calc(80vh-6rem)]">
        {movimientos.map((mov) => (
          <div key={mov.id} className="flex items-start gap-3 mb-4">
            {/* Icono del tipo de item */}
            <div className="mt-1">{getIcon(mov)}</div>

            {/* Contenido */}
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                <span>
                  {mov.nombre} — {mov.cantidad} unidades
                </span>
                <span>{getArrow(mov.tipo)}</span>
              </p>
              <p className="text-xs text-gray-500">{mov.observacion}</p>
              <p className="text-xs text-gray-400">
                {new Date(mov.fecha).toLocaleString("es-VE")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
