import { useState, useEffect } from "react";
import { FaHashtag, FaSave, FaSyncAlt } from "react-icons/fa";
import { getControlConfig, createControlConfig } from "../../../api/controllers/ControlConfig";
import { toast } from "react-toastify";
import { usePresupuesto } from "../../../context/PresupuestoContext";

export default function ControlCard() {
  const { formData } = usePresupuesto();
  const [puntoInicio, setPuntoInicio] = useState("");
  const [siguienteNumero, setSiguienteNumero] = useState("");
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);

  // Si hay n_presupuesto en el formData (edición), usarlo; si no, usar el siguiente número
  const numeroMostrado = formData?.n_presupuesto || siguienteNumero;

  /** ========================
   * Cargar número de control
   * ======================== */
  useEffect(() => {
    // Si ya tenemos n_presupuesto (edición), no cargar el siguiente número
    if (formData?.n_presupuesto) {
      setSiguienteNumero(formData.n_presupuesto);
      setPuntoInicio(formData.n_presupuesto); // Mostrar el número del presupuesto como referencia
      setLoading(false);
      return;
    }

    const fetchControl = async () => {
      try {
        const data = await getControlConfig();
        if (data?.punto_inicio !== undefined) {
          setPuntoInicio(data.punto_inicio);
          setSiguienteNumero(data.siguiente_n_presupuesto || data.punto_inicio);
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
  }, [formData?.n_presupuesto]); // ← Se ejecuta cuando cambia n_presupuesto (edición)

  /** ========================
   * Guardar número de control
   * ======================== */
  const handleGuardar = async () => {
    if (!siguienteNumero || isNaN(siguienteNumero)) {
      toast.error("Debe ingresar un número válido.");
      return;
    }

    try {
      // El punto de inicio será el siguiente número - 1
      const nuevoPuntoInicio = parseInt(siguienteNumero) - 1;
      await createControlConfig({ punto_inicio: nuevoPuntoInicio });
      setPuntoInicio(nuevoPuntoInicio);
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
            {/* Campo editable - muestra el número de presupuesto si existe, o el siguiente número */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                disabled={!editando || formData?.n_presupuesto}
                value={numeroMostrado}
                onChange={(e) => setSiguienteNumero(e.target.value)}
                className={`border rounded-lg px-3 py-2 w-full text-lg font-semibold text-gray-800 ${
                  editando
                    ? "focus:outline-none focus:ring-2 focus:ring-blue-400 border-blue-300"
                    : "bg-gray-100 cursor-not-allowed"
                }`}
              />
              {editando && !formData?.n_presupuesto ? (
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
              <span>Punto de inicio:</span>
              <span className="font-semibold text-gray-800">
                #{puntoInicio || "—"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
