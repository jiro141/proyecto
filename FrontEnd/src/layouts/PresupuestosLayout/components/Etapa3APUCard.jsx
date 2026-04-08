import React from "react";
import TotalesPanel from "./TotalesPanel";

const formatoMoneda = (valor) =>
  valor?.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }) || "$0.00";

export const Etapa3APUCard = ({
  apu,
  index,
  onInputChange,
  onShowDeleteModal,
  deleteAPU,
}) => {
  const handleDelete = () => {
    onShowDeleteModal(index);
  };

  const handleInputChange = (field, value) => {
    onInputChange(index, field, value);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 flex flex-col">
      {/* === Encabezado con ícono de eliminar === */}
      <div className="flex justify-between items-center border-b pb-2 mb-3">
        <h4 className="text-lg font-bold text-[#0B2C4D]">
          APU #{index + 1}
        </h4>
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 transition-all"
          title="Eliminar este APU"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* === Descripción === */}
      <p className="text-sm text-gray-600 mb-2">
        {apu.body?.descripcion || "Sin descripción"}
      </p>

      {/* === Campos editables === */}
      <div className="text-xs text-gray-600 grid grid-cols-2 gap-y-1 gap-x-4 mt-2">
        <label className="flex flex-col">
          <strong>Unidad:</strong>
          <input
            type="text"
            value={apu.body?.unidad || ""}
            onChange={(e) => handleInputChange("unidad", e.target.value)}
            className="border rounded-md px-2 py-1 text-xs mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            placeholder="Ej: m², kg, m3"
          />
        </label>

        <label className="flex flex-col">
          <strong>Rendimiento:</strong>
          <input
            type="number"
            value={apu.body?.rendimiento || 0}
            onChange={(e) => handleInputChange("rendimiento", e.target.value)}
            className="border rounded-md px-2 py-1 text-xs mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            step="0.01"
          />
        </label>

        <label className="flex flex-col">
          <strong>Cantidad:</strong>
          <input
            type="number"
            value={apu.body?.cantidad || 0}
            onChange={(e) =>
              handleInputChange("cantidad", Number(e.target.value) || 0)
            }
            className="border rounded-md px-2 py-1 text-xs mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            step="0.01"
          />
        </label>

        <label className="flex flex-col col-span-2">
          <strong>Presupuesto Base:</strong>
          <input
            type="text"
            readOnly
            value={formatoMoneda((apu.body?.presupuesto_base || 0) * (apu.body?.cantidad || 1))}
            className="border rounded-md px-2 py-1 text-xs mt-1 bg-gray-100 cursor-not-allowed"
          />
        </label>
      </div>

      {/* ✅ Panel independiente */}
      <div className="flex-1 overflow-hidden z-[0]">
        <TotalesPanel
          apuIndex={index}
          showDetails={false}
          hideAccordions={true}
        />
      </div>
    </div>
  );
};

export default Etapa3APUCard;