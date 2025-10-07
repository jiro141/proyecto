import { useState } from "react";
import { FaBolt } from "react-icons/fa";

export default function ProductividadCard({
  defaultValue = 50,
  onChange,
  label = "Porcentaje de Productividad",
}) {
  const [valor, setValor] = useState(defaultValue);

  const handleChange = (e) => {
    const nuevoValor = Number(e.target.value);
    setValor(nuevoValor);
    if (onChange) onChange(nuevoValor);
  };

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
        <FaBolt size={20} />
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col justify-between h-full pt-2">
        <div>
          <p className="text-sm text-gray-500 mb-2">{label}</p>

          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold text-gray-800">
              {valor}%
            </span>
            <span
              className={`text-sm font-medium ${
                valor >= 80
                  ? "text-green-600"
                  : valor >= 50
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {valor >= 80 ? "Excelente" : valor >= 50 ? "Aceptable" : "Bajo"}
            </span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min="0"
            max="100"
            value={valor}
            onChange={handleChange}
            className="w-full accent-[#0B2C4D] cursor-pointer"
          />
        </div>

        {/* Indicador visual de productividad */}
        <div className="w-full h-3 bg-gray-200 rounded-full mt-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              valor >= 80
                ? "bg-green-500"
                : valor >= 50
                ? "bg-yellow-400"
                : "bg-red-500"
            }`}
            style={{ width: `${valor}%` }}
          />
        </div>
      </div>
    </div>
  );
}
