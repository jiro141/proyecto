import React, { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaTrash, FaSave, FaTruck, FaFilePdf, FaCheck, FaExpand } from "react-icons/fa";
import Modal from "../../../components/Modal";
import {
  getNotasEntregaByReporte,
  getEntregasResumen,
  createNotaEntrega,
  getReporteDetalle,
  deleteNotaEntrega,
} from "../../../api/controllers/Presupuesto";
import { toast } from "react-toastify";
import { BounceLoader } from "react-spinners";
import usePDFNotaEntrega from "../hooks/usePDFNotaEntrega";

const initialItem = () => ({
  apu_id: null,
  apu_descripcion: "",
  cantidad_total: 0,
  cantidad_entregada: 0,
  precio_unitario: 0,
});

const initItemsFromApus = (apus, entregasAcumuladas = {}) => {
  if (!apus || apus.length === 0) return [initialItem()];
  return apus.map((apu) => {
    const entregaAnterior = entregasAcumuladas[apu.descripcion] || 0;
    const cantidadTotal = parseFloat(apu.cantidad) || 0;
    const pendiente = cantidadTotal - entregaAnterior;
    return {
      apu_id: apu.id || null,
      apu_descripcion: apu.descripcion || "",
      cantidad_total: cantidadTotal,
      cantidad_entregada: 0,
      cantidad_pendiente: pendiente,
      precio_unitario: parseFloat(apu.precio_unitario) || 0,
    };
  });
};

// Calcular entregas acumuladas por APU desde las notas anteriores
const calcularEntregasAcumuladas = (notasEntrega) => {
  const acumuladas = {};
  notasEntrega
    .filter((n) => n.estado === "BORRADOR" || n.estado === "EMITIDA")
    .forEach((nota) => {
      (nota.items || []).forEach((item) => {
        const desc = item.apu_descripcion;
        if (!acumuladas[desc]) {
          acumuladas[desc] = 0;
        }
        acumuladas[desc] += parseFloat(item.cantidad_entregada) || 0;
      });
    });
  return acumuladas;
};

export default function NotaEntregaModal({ isOpen, onClose, reporte }) {
  const { generarPDF } = usePDFNotaEntrega();

const [loading, setLoading] = useState(true);
  const [notasEntrega, setNotasEntrega] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [notaDetalle, setNotaDetalle] = useState(null);
  const [reporteDetalle, setReporteDetalle] = useState(null);
  const [entregasAcumuladas, setEntregasAcumuladas] = useState({});
  
  const [codigo, setCodigo] = useState("");
  const [ordenCompra, setOrdenCompra] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState(new Date().toISOString().split("T")[0]);
  const [observaciones, setObservaciones] = useState("");
  const [items, setItems] = useState([]);
  
  // Estado para modal de eliminación
  const [deleteNotaId, setDeleteNotaId] = useState(null);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen && reporte?.id && !reporteDetalle) {
      loadData();
    }
  }, [isOpen, reporte?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const detalle = await getReporteDetalle(reporte.id);
      setReporteDetalle(detalle);
      
      // Intentar cargar notas de entrega (si la API existe)
      try {
        const notas = await getNotasEntregaByReporte(reporte.id);
        setNotasEntrega(notas || []);
        // Calcular entregas acumuladas
        const acumuladas = {};
        (notas || [])
          .filter((n) => n.estado === "BORRADOR" || n.estado === "EMITIDA")
          .forEach((nota) => {
            (nota.items || []).forEach((item) => {
              const desc = item.apu_descripcion;
              if (!acumuladas[desc]) acumuladas[desc] = 0;
              acumuladas[desc] += parseFloat(item.cantidad_entregada) || 0;
            });
          });
        setEntregasAcumuladas(acumuladas);
      } catch (e) {
        // API no existe todavía
        setNotasEntrega([]);
        setEntregasAcumuladas({});
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitForm = async () => {
    if (!reporteDetalle?.apus || reporteDetalle.apus.length === 0) {
      await loadData();
    }
    setItems(initItemsFromApus(reporteDetalle?.apus || [], entregasAcumuladas));
    setShowForm(true);
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = {
        ...newItems[index],
        [field]: field === "apu_descripcion" ? value : parseFloat(value) || 0,
      };
      return newItems;
    });
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const itemsValidos = items.filter((item) => item.cantidad_entregada > 0);
    if (itemsValidos.length === 0) {
      toast.error("Debe agregar al menos un item con cantidad");
      return;
    }

    try {
      // Debug: ver qué se está enviando
      console.log("Enviando items:", JSON.stringify(itemsValidos, null, 2));
      
      await createNotaEntrega({
        reporte: reporte.id,
        codigo: codigo,
        orden_compra: ordenCompra,
        fecha_entrega: fechaEntrega,
        observaciones: observaciones,
        items: itemsValidos,
      });

      toast.success("Nota de entrega creada");
      setShowForm(false);
      setCodigo("");
      setOrdenCompra("");
      setFechaEntrega(new Date().toISOString().split("T")[0]);
      setObservaciones("");
      loadData();
    } catch (error) {
      console.error("Error completo:", error);
      toast.error("Error al crear nota de entrega. ¿El backend está actualizado?");
    }
  };

  const handleEliminar = async () => {
    if (!deleteNotaId) return;
    try {
      await deleteNotaEntrega(deleteNotaId);
      toast.success("Nota de entrega eliminada");
      setDeleteNotaId(null);
      loadData();
    } catch (error) {
      toast.error("Error al eliminar nota de entrega");
    }
  };

  const handleEmitir = async (nota) => {
    toast.info("Funcionalidad en desarrollo");
  };

  const handleAnular = async (notaId) => {
    toast.info("Funcionalidad en desarrollo");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Modal de detalle de nota
  if (notaDetalle) {
    const totalNota = (notaDetalle.items || []).reduce((sum, item) => {
      return sum + (parseFloat(item.cantidad_entregada) * parseFloat(item.precio_unitario));
    }, 0);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="bg-[#0B2C4D] text-white px-4 py-3 flex justify-between items-center">
            <h2 className="font-bold text-lg">Nota de Entrega {notaDetalle.n_nota}</h2>
            <button onClick={() => setNotaDetalle(null)} className="hover:bg-white/20 p-1 rounded">
              <FaTimes size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-gray-500 text-sm">Fecha:</span>
                <p className="font-medium">{formatDate(notaDetalle.fecha_entrega)}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Estado:</span>
                <p className="font-medium">{notaDetalle.estado}</p>
              </div>
              {notaDetalle.orden_compra && (
                <div>
                  <span className="text-gray-500 text-sm">Orden de Compra:</span>
                  <p className="font-medium">{notaDetalle.orden_compra}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500 text-sm">Cliente:</span>
                <p className="font-medium">{notaDetalle.cliente_nombre}</p>
              </div>
            </div>

            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 text-left">Cantidad</th>
                  <th className="px-2 py-2 text-left">Descripción</th>
                  <th className="px-2 py-2 text-right">P.Unit</th>
                  <th className="px-2 py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {(notaDetalle.items || []).map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-2 py-2">{item.cantidad_entregada}</td>
                    <td className="px-2 py-2">{item.apu_descripcion}</td>
                    <td className="px-2 py-2 text-right">${formatNumber(item.precio_unitario)}</td>
                    <td className="px-2 py-2 text-right font-medium">
                      ${formatNumber(item.cantidad_entregada * item.precio_unitario)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t bg-gray-50">
                  <td colSpan={3} className="px-2 py-2 text-right font-bold">TOTAL:</td>
                  <td className="px-2 py-2 text-right font-bold">${formatNumber(totalNota)}</td>
                </tr>
              </tbody>
            </table>

            {notaDetalle.observaciones && (
              <div className="mt-4">
                <span className="text-gray-500 text-sm">Observaciones:</span>
                <p className="mt-1">{notaDetalle.observaciones}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => generarPDF(notaDetalle, { ...reporteDetalle, cliente: { ...reporteDetalle?.cliente, rif: notaDetalle?.cliente_rif } }, notaDetalle.items || [])}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
              >
                <FaFilePdf size={16} />
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-[#0B2C4D] text-white px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FaTruck size={20} />
            <h2 className="font-bold text-lg">Notas de Entrega - Presupuesto {reporte?.n_presupuesto}</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <BounceLoader color="#0b2c4d" />
            </div>
          ) : showForm ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Código de nota"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orden de Compra</label>
                  <input
                    type="text"
                    value={ordenCompra}
                    onChange={(e) => setOrdenCompra(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Número de orden de compra"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Entrega</label>
                  <input
                    type="date"
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={2}
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-2 text-left">APU</th>
                      <th className="px-2 py-2 text-center">Total</th>
                      <th className="px-2 py-2 text-center">Pendiente</th>
                      <th className="px-2 py-2 text-center">Entregar</th>
                      <th className="px-2 py-2 text-center">P.Unit</th>
                      <th className="px-2 py-2 text-center">Subtotal</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={item.apu_descripcion}
                            onChange={(e) => handleItemChange(index, "apu_descripcion", e.target.value)}
                            className="w-full border rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">{formatNumber(item.cantidad_total)}</td>
                        <td className="px-2 py-2 text-center text-orange-600 font-medium">
                          {formatNumber(item.cantidad_pendiente)}
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            max={item.cantidad_pendiente}
                            value={item.cantidad_entregada}
                            onChange={(e) => handleItemChange(index, "cantidad_entregada", e.target.value)}
                            className="w-full border rounded px-2 py-1 text-center"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">${formatNumber(item.precio_unitario)}</td>
                        <td className="px-2 py-2 text-center font-medium">
                          ${formatNumber(item.cantidad_entregada * item.precio_unitario)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700">
                            <FaTrash size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                  Cancelar
                </button>
                <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2">
                  <FaSave size={16} />
                  Guardar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {notasEntrega.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-sm text-gray-600 mb-2">Notas de Entrega</h3>
                  <div className="space-y-2">
                    {notasEntrega.map((nota) => (
                      <div key={nota.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setNotaDetalle(nota)} className="text-blue-600 hover:text-blue-800 font-medium" title="Ver detalle">
                            {nota.n_nota}
                          </button>
                          {nota.orden_compra && <span className="ml-2 text-gray-500 text-sm">({nota.orden_compra})</span>}
                          <span className="ml-2 text-gray-500 text-sm">{formatDate(nota.fecha_entrega)}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setNotaDetalle(nota)} 
                            className="text-red-600 hover:text-red-700" 
                            title="Descargar PDF"
                          >
                            <FaFilePdf size={16} />
                          </button>
                          <button 
                            onClick={() => setDeleteNotaId(nota.id)} 
                            className="text-gray-400 hover:text-red-600" 
                            title="Eliminar"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleInitForm} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-500 hover:text-orange-500 flex items-center justify-center gap-2">
                <FaPlus size={20} />
                Crear Nueva Nota de Entrega
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal confirmar eliminación */}
      <Modal
        isOpen={!!deleteNotaId}
        onClose={() => setDeleteNotaId(null)}
        title="Confirmar eliminación"
      >
        <div className="space-y-4">
          <p>
            ¿Estás seguro de eliminar esta{" "}
            <span className="font-bold text-red-700">nota de entrega</span>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteNotaId(null)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={handleEliminar}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}