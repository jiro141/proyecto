import { useState } from "react";
import { FaBolt } from "react-icons/fa";

export default function ProductividadCard({
  defaultValue = 75,
  onChange,
  label = "Rendimiento",
}) {
  const [valor, setValor] = useState(defaultValue);

  const handleChange = (e) => {
    const value = e.target.value;

    if (value === "") {
      setValor("");
      if (onChange) onChange("");
      return;
    }

    const nuevoValor = parseFloat(value);
    if (!isNaN(nuevoValor)) {
      setValor(value);
      if (onChange) onChange(nuevoValor);
    }
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

          {/* Input ancho completo */}
          <div className="relative flex items-center w-full">
            <input
              type="number"
              step="any"
              min="0"
              value={valor}
              onChange={handleChange}
              className="w-full pr-6 py-2 border border-gray-300 rounded-lg text-center text-lg font-semibold text-gray-800 shadow-sm focus:ring-2 focus:ring-[#0B2C4D] focus:border-[#0B2C4D] focus:outline-none transition-all duration-150"
            />
            {/* <span className="absolute right-3 text-gray-500 text-sm font-medium">%</span> */}
          </div>
        </div>
      </div>
    </div>
  );
}
