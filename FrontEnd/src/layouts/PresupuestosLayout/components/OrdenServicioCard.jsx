import { FaFileAlt } from "react-icons/fa";
import { usePresupuesto } from "../../../context/PresupuestoContext";

export default function OrdenServicioCard() {
  const { formData, updatePresupuestoField } = usePresupuesto();
  
  const orden_servicio = formData?.orden_servicio || "";

  return (
    <div
      className="relative bg-white shadow-md rounded-lg p-4 pt-10 overflow-visible transition-all duration-200 flex flex-col"
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
        <FaFileAlt size={20} />
      </div>

      {/* Contenido */}
      <div className="flex flex-col justify-between flex-grow pt-2">
        <p className="text-sm text-gray-500 ">Orden de Servicio</p>

        <div className="flex flex-col gap-4">
          {/* Campo para número de orden de servicio */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={orden_servicio}
              onChange={(e) => updatePresupuestoField("orden_servicio", e.target.value)}
              placeholder="Agregar número..."
              className="border rounded-lg px-3 py-2 w-full text-lg font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 border-blue-300"
            />
          </div>

          {/* Estado / ayuda */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Campo opcional</span>
          </div>
        </div>
      </div>
    </div>
  );
}