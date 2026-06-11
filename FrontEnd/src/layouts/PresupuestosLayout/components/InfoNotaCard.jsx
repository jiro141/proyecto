import { FaRegFileAlt } from "react-icons/fa";

export default function InfoNotaCard({ onAbrirModal }) {
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
        style={{ backgroundColor: "#0B2C4D", color: "white" }}
      >
        <FaRegFileAlt size={20} />
      </div>

      {/* Contenido */}
      <div className="pt-2 h-full flex flex-col">
        <p className="text-sm text-gray-500">Información / Notas</p>

        <div className="flex items-center justify-center flex-grow">
          <button
            onClick={onAbrirModal}
            className="bg-[#0b2c4d] hover:bg-[#143d65] text-white px-6 py-3 rounded-lg text-sm font-medium transition shadow-md"
          >
            Editar info
          </button>
        </div>
      </div>
    </div>
  );
}
