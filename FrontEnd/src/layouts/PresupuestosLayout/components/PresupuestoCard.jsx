import { useState } from "react";
import { FaMoneyBillWave } from "react-icons/fa";

export default function PresupuestoCard({
  defaultValue = 0,
  onChange,
  label = "Presupuesto Estimado (USD)",
}) {
  const [presupuesto, setPresupuesto] = useState(defaultValue);

  const handleChange = (e) => {
    const valor = parseFloat(e.target.value) || 0;
    setPresupuesto(valor);
    if (onChange) onChange(valor);
  };

  // Formato en dólares
  const formatoMoneda = (valor) =>
    valor.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });

  return (
    <div
      className="relative bg-white shadow-md rounded-lg p-4 pt-10 overflow-visible transition-all duration-200"
      style={{
        minHeight: "200px",
        maxHeight: "200px",
      }}
    >
      {/* Icono flotante */}
      <div
        className="absolute -top-4 left-5 w-12 h-12 flex items-center justify-center rounded-lg z-[5] shadow-md"
        style={{
          backgroundColor: "#0B2C4D",
          color: "white",
        }}
      >
        <FaMoneyBillWave size={20} />
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col justify-between h-full pt-2">
        <p className="text-sm text-gray-500 mb-2">{label}</p>

        {/* Input numérico */}
        <input
          type="number"
          min="0"
          value={presupuesto}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Ingrese el presupuesto estimado"
        />

        {/* Mostrar valor formateado */}
        <p className="mt-3 text-lg font-semibold text-gray-800 text-right">
          {formatoMoneda(presupuesto)}
        </p>
      </div>
    </div>
  );
}
