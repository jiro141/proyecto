import React, { useState } from "react";
import { BounceLoader } from "react-spinners";
import { FaSearch, FaMoneyBillWave, FaBuilding, FaChevronDown, FaChevronUp, FaHistory, FaPlus, FaFileExcel } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "../../components/Modal";
import useCuentasPorCliente from "../../hooks/useCuentasPorCliente";
import useCuentasExcelGenerator from "../PresupuestosLayout/hooks/useCuentasExcelGenerator";
import { getReporteAbonos, createAbono } from "../../api/controllers/Cuentas";

const formatCurrency = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? "$0.00" : `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

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

export default function ClientesCuentasPorCliente() {
  const { clientes, totales, loading, error } = useCuentasPorCliente();
  const [search, setSearch] = useState("");
  const [expandedClients, setExpandedClients] = useState({});
  const [searchPresupuestos, setSearchPresupuestos] = useState({}); // búsqueda por cliente
  
  // Estados para modal de abonos
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [isDetalleOpen, setDetalleOpen] = useState(false);
  const [abonosReporte, setAbonosReporte] = useState([]);
  const [loadingAbonos, setLoadingAbonos] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isHistorialOpen, setHistorialOpen] = useState(false);
  const ITEMS_PER_PAGE = 5;
  
  // Estados para registrar abono
  const [isModalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    monto: "", 
    referencia_pago: "",
    fecha_abono: new Date().toISOString().split('T')[0],
  });
  
  // Estados para exportar Excel
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [loadingExport, setLoadingExport] = useState(false);
  
  // Hook para generar Excel
  const { generarExcelCuentas, generarExcelPorCliente } = useCuentasExcelGenerator();

  // Exportar Excel por cliente específico
  const handleExportExcelPorCliente = (clienteData) => {
    if (clienteData && clienteData.reportes && clienteData.reportes.length > 0) {
      generarExcelPorCliente(clienteData);
      toast.success("Excel generado exitosamente");
    } else {
      toast.warning("No hay datos para exportar de este cliente");
    }
  };
  
  const handleOpenExportModal = () => {
    setFechaDesde("");
    setFechaHasta("");
    setExportModalOpen(true);
  };
  
  const handleExportExcel = async () => {
    setLoadingExport(true);
    try {
      // Usar el endpoint de resumen con filtro de fechas
      const { getResumenCuentas } = await import("../../api/controllers/Cuentas");
      const result = await getResumenCuentas(fechaDesde || null, fechaHasta || null);
      
      if (result?.detalle?.length > 0) {
        generarExcelCuentas(result.detalle, result.totales, fechaDesde, fechaHasta);
        toast.success("Excel generado exitosamente");
        setExportModalOpen(false);
      } else {
        toast.warning("No hay datos para exportar en el período seleccionado");
      }
    } catch {
      toast.error("Error al generar el Excel");
    } finally {
      setLoadingExport(false);
    }
  };

  // Registrar abono
  const handleSubmitAbono = async () => {
    if (!selectedReporte || !formData.monto) {
      toast.error("Complete los campos requeridos");
      return;
    }
    try {
      await createAbono({
        reporte: selectedReporte.id,
        monto: parseFloat(formData.monto),
        referencia_pago: formData.referencia_pago || "",
        fecha_abono: formData.fecha_abono || new Date().toISOString(),
      });
      toast.success("Abono registrado exitosamente");
      setModalOpen(false);
      setFormData({ 
        monto: "", 
        referencia_pago: "",
        fecha_abono: new Date().toISOString().split('T')[0],
      });
      // Recargar abonos
      const result = await getReporteAbonos(selectedReporte.id);
      setAbonosReporte(result);
    } catch {
      toast.error("Error al registrar el abono");
    }
  };

  // Filtrar clientes por búsqueda
  const filteredClientes = clientes.filter((cliente) => {
    const searchLower = search.toLowerCase();
    const nombre = cliente.cliente?.nombre?.toLowerCase() || "";
    const rif = cliente.cliente?.rif?.toLowerCase() || "";
    return nombre.includes(searchLower) || rif.includes(searchLower);
  });

  // Toggle expandir cliente - solo expandir sin modal
  const toggleClient = (clienteId) => {
    setExpandedClients((prev) => ({ ...prev, [clienteId]: !prev[clienteId] }));
  };

  // Abrir modal de abonos al hacer click en un reporte
  const handleOpenAbonosFromClient = async (reporte) => {
    setSelectedReporte(reporte);
    setLoadingAbonos(true);
    setDetalleOpen(true);
    setCurrentPage(1);
    try {
      const result = await getReporteAbonos(reporte.id);
      setAbonosReporte(result);
    } catch {
      setAbonosReporte([]);
    } finally {
      setLoadingAbonos(false);
    }
  };

  // Abrir historial de pagos
  const handleOpenHistorial = () => {
    setHistorialOpen(true);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error al cargar las cuentas por cobrar. Verifica la conexión con el servidor.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0b2c4d] text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-3">
              <FaMoneyBillWave size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-300">Total Facturado</p>
              <p className="text-xl font-bold">{formatCurrency(totales.total_facturado)}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-600 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-3">
              <FaMoneyBillWave size={24} />
            </div>
            <div>
              <p className="text-sm text-green-100">Total Abonado</p>
              <p className="text-xl font-bold">{formatCurrency(totales.total_abonado)}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#e53935] text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-3">
              <FaMoneyBillWave size={24} />
            </div>
            <div>
              <p className="text-sm text-red-100">Total Pendiente</p>
              <p className="text-xl font-bold">{formatCurrency(totales.total_pendiente)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de clientes */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <BounceLoader color="#0b2c4d" size={80} />
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          {search ? "No hay clientes que coincidan con la búsqueda" : "No hay cuentas por cobrar registradas"}
        </div>
      ) : (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white">
          <div className="px-6 py-4 bg-[#0b2c4d] border-b">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FaBuilding size={18} />
                Cuentas por Cobrar - Resumen por Cliente
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenExportModal}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded flex items-center gap-2 transition"
                >
                  <FaFileExcel size={14} />
                  Exportar Excel
                </button>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar cliente..."
                    className="pl-8 pr-3 py-1 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-black"
                  />
                </div>
              </div>
            </div>
          </div>

          <table className="w-full text-sm text-left text-gray-900">
            <thead className="text-xs uppercase bg-[#0b2c4d] text-white">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">RIF</th>
                <th className="px-4 py-3 text-center">Presupuestos</th>
                <th className="px-4 py-3 text-right">Total Facturado</th>
                <th className="px-4 py-3 text-right">Total Abonado</th>
                <th className="px-4 py-3 text-right">Pendiente</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map((clienteData) => {
                const cliente = clienteData.cliente || {};
                const isExpanded = expandedClients[cliente.id];
                
                return (
                  <React.Fragment key={cliente.id}>
                    {/* Fila principal del cliente */}
                    <tr
                      className="bg-white border-b hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => toggleClient(cliente.id)}
                    >
                      <td className="px-4 py-4 text-center">
                        {isExpanded ? (
                          <span className="text-gray-500">▲</span>
                        ) : (
                          <span className="text-gray-500">▼</span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-800">
                        {cliente.nombre || "-"}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {cliente.rif || "-"}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {clienteData.reportes?.length || 0}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-gray-800 font-medium">
                        {formatCurrency(clienteData.total_facturado)}
                      </td>
                      <td className="px-4 py-4 text-right text-green-600 font-medium">
                        {formatCurrency(clienteData.total_abonado)}
                      </td>
                      <td className={`px-4 py-4 text-right font-bold ${clienteData.total_pendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(clienteData.total_pendiente)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportExcelPorCliente(clienteData);
                          }}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Exportar a Excel"
                        >
                          <FaFileExcel size={18} />
                        </button>
                      </td>
                    </tr>

                    {/* Fila expandida con reportes del cliente */}
                    {isExpanded && clienteData.reportes && clienteData.reportes.length > 0 && (
                      <tr key={`${cliente.id}-detail`}>
                        <td colSpan={7} className="bg-gray-50 px-8 py-4">
                          {/* Buscador de presupuestos */}
                          <div className="mb-3">
                            <input
                              type="text"
                              placeholder="Buscar por número o descripción..."
                              value={searchPresupuestos[cliente.id] || ""}
                              onChange={(e) => setSearchPresupuestos(prev => ({ ...prev, [cliente.id]: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b2c4d] text-black"
                            />
                          </div>
                          
                          <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-200 text-gray-700 sticky top-0">
                                <tr>
                                  <th className="px-4 py-2 text-left">N° Presupuesto</th>
                                  <th className="px-4 py-2 text-left">Descripción</th>
                                  <th className="px-4 py-2 text-right">Total</th>
                                  <th className="px-4 py-2 text-right">Abonado</th>
                                  <th className="px-4 py-2 text-right">Pendiente</th>
                                </tr>
                              </thead>
                              <tbody>
                                {clienteData.reportes
                                  .filter(reporte => {
                                    const search = (searchPresupuestos[cliente.id] || "").toLowerCase();
                                    if (!search) return true;
                                    return (
                                      reporte.n_presupuesto?.toLowerCase().includes(search) ||
                                      reporte.descripcion?.toLowerCase().includes(search)
                                    );
                                  })
                                  .slice(0, 10)
                                  .map((reporte) => (
                                  <tr 
                                    key={reporte.id} 
                                    onClick={() => handleOpenAbonosFromClient(reporte)}
                                    className="border-b hover:bg-blue-50 cursor-pointer transition"
                                  >
                                    <td className="px-4 py-2 font-medium text-[#0b2c4d]">
                                      {reporte.n_presupuesto}
                                    </td>
                                    <td className="px-4 py-2">
                                      {reporte.descripcion || "-"}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                      {formatCurrency(reporte.total)}
                                    </td>
                                    <td className="px-4 py-2 text-right text-green-600">
                                      {formatCurrency(reporte.abonado)}
                                    </td>
                                    <td className={`px-4 py-2 text-right font-medium ${reporte.pendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {formatCurrency(reporte.pendiente)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detalle del Reporte */}
      <Modal
        isOpen={isDetalleOpen}
        onClose={() => {
          setDetalleOpen(false);
          setSelectedReporte(null);
          setAbonosReporte([]);
        }}
        title={`Presupuesto ${selectedReporte?.n_presupuesto || ""}`}
        width="max-w-3xl"
      >
        {selectedReporte && (
          <div className="space-y-4">
            {/* Info del reporte */}
            <div className="bg-[#0b2c4d] text-white rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Cliente:</span>
                <span className="font-medium">{selectedReporte.cliente_nombre || selectedReporte.cliente?.nombre}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Descripción:</span>
                <span className="font-medium text-right">{selectedReporte.descripcion || "-"}</span>
              </div>
              <hr className="border-white/20 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total:</span>
                <span className="font-bold text-lg">{formatCurrency(selectedReporte.total)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Abonado:</span>
                <span className="font-bold text-lg text-green-400">{formatCurrency(selectedReporte.abonado)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Pendiente:</span>
                <span className={`font-bold text-lg ${selectedReporte.pendiente > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatCurrency(selectedReporte.pendiente)}
                </span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setFormData({ 
                    monto: "", 
                    referencia_pago: "",
                    fecha_abono: new Date().toISOString().split('T')[0],
                  });
                  setModalOpen(true);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition font-medium"
              >
                <FaPlus size={16} />
                Registrar Abono
              </button>
              <button
                onClick={handleOpenHistorial}
                className="flex-1 bg-[#0b2c4d] hover:bg-[#143d65] text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition font-medium"
              >
                <FaHistory size={16} />
                Ver Historial
              </button>
            </div>

            {/* Resumen rápido */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                Pagos registrados: <span className="font-semibold">{abonosReporte.length}</span>
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Historial de Pagos */}
      <Modal
        isOpen={isHistorialOpen}
        onClose={() => {
          setHistorialOpen(false);
        }}
        title={`Historial de Pagos - ${selectedReporte?.n_presupuesto || ""}`}
        width="max-w-2xl"
        height="h-[70vh]"
      >
        <div className="flex flex-col h-full">
          {loadingAbonos ? (
            <div className="flex-1 flex justify-center items-center">
              <BounceLoader color="#0b2c4d" size={60} />
            </div>
          ) : abonosReporte.length === 0 ? (
            <div className="flex-1 flex justify-center items-center text-gray-500">
              No hay pagos registrados
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto border rounded-lg mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                      <th className="px-4 py-3 text-left font-semibold">Monto</th>
                      <th className="px-4 py-3 text-left font-semibold">Referencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abonosReporte.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((abono) => (
                      <tr key={abono.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{formatDate(abono.fecha_abono)}</td>
                        <td className="px-4 py-3 text-green-600 font-medium">{formatCurrency(abono.monto)}</td>
                        <td className="px-4 py-3">{abono.referencia_pago || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {Math.ceil(abonosReporte.length / ITEMS_PER_PAGE) > 1 && (
                <div className="flex items-center justify-between border-t pt-3">
                  <p className="text-sm text-gray-600">
                    Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, abonosReporte.length)} de {abonosReporte.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                      ←
                    </button>
                    <span className="px-3 py-1">{currentPage} / {Math.ceil(abonosReporte.length / ITEMS_PER_PAGE)}</span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(Math.ceil(abonosReporte.length / ITEMS_PER_PAGE), p + 1))}
                      disabled={currentPage >= Math.ceil(abonosReporte.length / ITEMS_PER_PAGE)}
                      className={`px-3 py-1 rounded ${currentPage >= Math.ceil(abonosReporte.length / ITEMS_PER_PAGE) ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Modal Registrar Abono */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setFormData({ 
            monto: "", 
            referencia_pago: "",
            fecha_abono: new Date().toISOString().split('T')[0],
          });
        }}
        title="Registrar Abono"
        width="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <div className="bg-gray-100 p-3 rounded-lg border">
            <p className="text-sm text-gray-600 mb-1">Presupuesto seleccionado:</p>
            <p className="font-semibold text-gray-800">
              {selectedReporte?.n_presupuesto} - {selectedReporte?.cliente_nombre || selectedReporte?.cliente?.nombre}
            </p>
            {selectedReporte?.descripcion && (
              <p className="text-sm text-gray-500 mt-1">{selectedReporte.descripcion}</p>
            )}
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p><strong>Total:</strong> {formatCurrency(selectedReporte?.total)}</p>
            <p><strong>Pendiente:</strong> {formatCurrency(selectedReporte?.pendiente)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.monto}
              onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0b2c4d] text-black"
              placeholder="0.00"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referencia de Pago
            </label>
            <input
              type="text"
              value={formData.referencia_pago}
              onChange={(e) => setFormData({ ...formData, referencia_pago: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0b2c4d] text-black"
              placeholder="N° de transferencia o cheque"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha del Abono
            </label>
            <input
              type="date"
              value={formData.fecha_abono}
              onChange={(e) => setFormData({ ...formData, fecha_abono: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0b2c4d] text-black"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setModalOpen(false);
                setFormData({ 
                  monto: "", 
                  referencia_pago: "",
                  fecha_abono: new Date().toISOString().split('T')[0],
                });
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitAbono}
              className="bg-[#0b2c4d] hover:bg-[#143d65] text-white font-semibold px-4 py-2 rounded transition"
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Exportar Excel */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Exportar Cuentas a Excel"
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Seleccione el rango de fechas para exportar los registros de abonos.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicial
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0b2c4d] text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Final
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0b2c4d] text-black"
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p className="text-gray-600">
              <strong>Nota:</strong> Si deja las fechas vacías, se exportarán todos los registros.
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setExportModalOpen(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleExportExcel}
              disabled={loadingExport}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded transition disabled:opacity-50 flex items-center gap-2"
            >
              <FaFileExcel size={14} />
              {loadingExport ? "Generando..." : "Exportar Excel"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}