import React, { useState } from "react";
import { FaHistory, FaCheck, FaClock, FaTimes, FaPlay, FaMoneyBill, FaCheckCircle } from "react-icons/fa";
import { updateReporteEstado } from "../../../api/controllers/Presupuesto";
import { toast } from "react-toastify";
import { BounceLoader } from "react-spinners";

const ESTADOS = [
  { key: "ESPERA", label: "En espera", icon: FaClock, color: "gray" },
  { key: "RECHAZADO", label: "Rechazado", icon: FaTimes, color: "red" },
  { key: "APROBADO_ESPERA", label: "Aprobado - Espera", icon: FaCheck, color: "yellow" },
  { key: "EJECUTADO", label: "Ejecutado", icon: FaPlay, color: "blue" },
  { key: "EJECUTADO_POR_PAGAR", label: "Por pagar", icon: FaMoneyBill, color: "orange" },
  { key: "EJECUTADO_PAGADO", label: "Pagado", icon: FaCheckCircle, color: "green" },
];

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const colorMap = {
  gray: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300" },
  red: { bg: "bg-red-100", text: "text-red-600", border: "border-red-300" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-600", border: "border-yellow-300" },
  blue: { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-300" },
  orange: { bg: "bg-orange-100", text: "text-orange-600", border: "border-orange-300" },
  green: { bg: "bg-green-100", text: "text-green-600", border: "border-green-300" },
};

export default function EstadoHistorial({ reporte, onEstadoActualizado }) {
  const [historial, setHistorial] = useState([{
    estado: reporte.estado,
    estado_display: reporte.estado_display,
    fecha: reporte.fecha_creacion,
    comentario: "Estado inicial del presupuesto",
  }]);
  const [loading, setLoading] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  const getEstadoInfo = (estadoKey) => {
    return ESTADOS.find((e) => e.key === estadoKey) || ESTADOS[0];
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    if (nuevoEstado === reporte.estado) {
      setShowSelector(false);
      return;
    }

    setLoading(true);
    try {
      const updated = await updateReporteEstado(reporte.id, nuevoEstado);

      const nuevoRegistro = {
        estado: updated.estado,
        estado_display: updated.estado_display,
        fecha: new Date().toISOString(),
        comentario: `Cambiado a: ${getEstadoInfo(updated.estado).label}`,
      };

      setHistorial((prev) => [nuevoRegistro, ...prev]);
      setShowSelector(false);

      if (onEstadoActualizado) {
        onEstadoActualizado(updated);
      }

      toast.success(`Estado actualizado a: ${updated.estado_display}`);
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  const estadoActual = getEstadoInfo(reporte.estado);
  const estadoColors = colorMap[estadoActual.color] || colorMap.gray;

  return (
    <div className="flex flex-col">
      {/* Info del presupuesto */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-1 flex-shrink-0">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">Presupuesto:</span>
          <span className="font-medium">{reporte.n_presupuesto}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">Cliente:</span>
          <span className="font-medium truncate ml-2">{reporte.cliente_nombre}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">Fecha:</span>
          <span className="font-medium">{formatDate(reporte.fecha_creacion)}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">Total:</span>
          <span className="font-medium">
            ${parseFloat(reporte.total_reporte || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Secciones principales */}
      <div className="flex gap-3 mt-3">
        {/* Seccion Izquierda - Cambiar Estado */}
        <div className="w-1/2">
          <div className={`border-2 ${estadoColors.border} rounded-lg p-3`}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Estado Actual</h3>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full ${estadoColors.bg} flex items-center justify-center`}>
                {React.createElement(estadoActual.icon, { className: estadoColors.text, size: 24 })}
              </div>
              <p className="font-bold text-base text-center">{reporte.estado_display || estadoActual.label}</p>
            </div>

            <button
              onClick={() => setShowSelector(!showSelector)}
              className="w-full mt-3 bg-[#0b2c4d] hover:bg-[#143d65] text-white px-3 py-2 rounded-lg transition text-xs font-medium"
            >
              {showSelector ? "Cerrar" : "Cambiar Estado"}
            </button>

            {showSelector && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2">Selecciona el nuevo estado:</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {ESTADOS.map((estado) => {
                    const Icon = estado.icon;
                    const isActive = estado.key === reporte.estado;
                    const colors = colorMap[estado.color] || colorMap.gray;
                    return (
                      <button
                        key={estado.key}
                        onClick={() => !loading && handleCambiarEstado(estado.key)}
                        disabled={loading || isActive}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg border transition ${
                          isActive
                            ? "border-green-500 bg-green-50 cursor-default"
                            : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        {loading ? (
                          <BounceLoader size={16} color="#0b2c4d" />
                        ) : (
                          <>
                            <div className={`w-6 h-6 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                              <Icon className={colors.text} size={12} />
                            </div>
                            <span className="text-xs font-medium text-left flex-1">{estado.label}</span>
                            {isActive && <span className="text-xs text-green-600 flex-shrink-0">Actual</span>}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seccion Derecha - Historial */}
        <div className="w-1/2 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <FaHistory className="text-gray-500" size={14} />
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Historial</h3>
          </div>
          <div className="flex-1 border border-gray-200 rounded-lg p-2 overflow-y-auto">
            <div className="space-y-2">
              {historial.map((item, index) => {
                const estadoInfo = getEstadoInfo(item.estado);
                const Icon = estadoInfo.icon;
                const colors = colorMap[estadoInfo.color] || colorMap.gray;
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                      index === 0 ? "bg-blue-50 border border-blue-200" : "bg-white border border-gray-200"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={colors.text} size={10} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{item.estado_display || estadoInfo.label}</p>
                        <span className="text-gray-400 ml-1 whitespace-nowrap text-[10px]">{formatDate(item.fecha)}</span>
                      </div>
                      {item.comentario && (
                        <p className="text-gray-400 mt-0.5 truncate">{item.comentario}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
