import { useState, useEffect } from "react";
import { FaHashtag, FaSave, FaSyncAlt } from "react-icons/fa";
import { getControlConfig, createControlConfig } from "../../../api/controllers/ControlConfig";
import { toast } from "react-toastify";

export default function ControlCard() {
  const [numeroControl, setNumeroControl] = useState("");
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);

  /** ========================
   * Cargar número de control
   * ======================== */
  useEffect(() => {
    const fetchControl = async () => {
      try {
        const data = await getControlConfig();
        if (data?.punto_inicio) {
          setNumeroControl(data.punto_inicio);
        } else {
          toast.warning("No existe un número de control configurado.");
        }
      } catch (error) {
        console.error("Error al obtener el número de control:", error);
        toast.error("Error al cargar el número de control.");
      } finally {
        setLoading(false);
      }
    };
    fetchControl();
  }, []);

  /** ========================
   * Guardar número de control
   * ======================== */
  const handleGuardar = async () => {
    if (!numeroControl || isNaN(numeroControl)) {
      toast.error("Debe ingresar un número válido.");
      return;
    }

    try {
      await createControlConfig({ punto_inicio: numeroControl });
      toast.success("Número de control actualizado correctamente.");
      setEditando(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el número de control.");
    }
  };

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
        <FaHashtag size={20} />
      </div>

      {/* Contenido */}
      <div className="flex flex-col justify-between flex-grow pt-2">
        <p className="text-sm text-gray-500 ">Número de Presupuesto</p>

        {loading ? (
          <p className="text-gray-500 text-sm">Cargando...</p>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Campo editable */}
            {/* <h2 className="text-center text-3xl text-[#0B2C4D] font-bold">{numeroControl}</h2> */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                disabled={!editando}
                value={numeroControl}
                onChange={(e) => setNumeroControl(e.target.value)}
                className={`border rounded-lg px-3 py-2 w-full text-lg font-semibold text-gray-800 ${
                  editando
                    ? "focus:outline-none focus:ring-2 focus:ring-blue-400 border-blue-300"
                    : "bg-gray-100 cursor-not-allowed"
                }`}
              />
              {editando ? (
                <button
                  onClick={handleGuardar}
                  className="bg-[#FC3B3C] text-white px-3 py-2 rounded-lg flex items-center gap-2"
                >
                  <FaSave size={14} /> Guardar
                </button>
              ) : (
                <button
                  onClick={() => setEditando(true)}
                  className="bg-[#0B2C4D] text-white px-3 py-2 rounded-lg flex items-center gap-2"
                >
                  <FaSyncAlt size={14} /> Editar
                </button>
              )}
            </div>

            {/* Estado actual */}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Último número registrado:</span>
              <span className="font-semibold text-gray-800">
                #{numeroControl || "—"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
