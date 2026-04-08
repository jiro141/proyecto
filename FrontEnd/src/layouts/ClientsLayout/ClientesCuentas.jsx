import React, { useState, useEffect, useMemo } from "react";
import { BounceLoader } from "react-spinners";
import { FaSearch, FaMoneyBillWave, FaPlus, FaHistory } from "react-icons/fa";
import { FaRegTrashCan, FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "../../components/Modal";
import Select from "react-select";
import useCuentas from "../../hooks/useCuentas";
import { createAbono, deleteAbono, getReportes, getReporteAbonos } from "../../api/controllers/Cuentas";

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

const ITEMS_PER_PAGE = 5;

export default function ClientesCuentas() {
  const { reportes, loading, error, refetch } = useCuentas();
  const [search, setSearch] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDetalleOpen, setDetalleOpen] = useState(false);
  const [isHistorialOpen, setHistorialOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [abonosReporte, setAbonosReporte] = useState([]);
  const [loadingAbonos, setLoadingAbonos] = useState(false);
  const [formData, setFormData] = useState({
    reporte: null,
    monto: "",
    referencia_pago: "",
  });
  const [reportesOptions, setReportesOptions] = useState([]);
  const [loadingReportes, setLoadingReportes] = useState(false);
  const [searchReportes, setSearchReportes] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isModalOpen && !formData.reporte) {
      loadReportes();
    }
  }, [isModalOpen, searchReportes]);

  const loadReportes = async () => {
    setLoadingReportes(true);
    try {
      const result = await getReportes();
      const data = Array.isArray(result) ? result : result.results || [];
      const filtered = data.filter(
        (r) =>
          parseFloat(r.total_reporte) > 0 &&
          (searchReportes === "" ||
            r.n_presupuesto?.toLowerCase().includes(searchReportes.toLowerCase()) ||
            r.cliente_nombre?.toLowerCase().includes(searchReportes.toLowerCase()))
      );
      setReportesOptions(
        filtered.map((r) => ({
          value: r.id,
          label: `${r.n_presupuesto} - ${r.cliente_nombre}`,
          data: r,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReportes(false);
    }
  };

  const handleRowClick = async (reporte) => {
    setSelectedReporte(reporte);
    setLoadingAbonos(true);
    setDetalleOpen(true);
    setCurrentPage(1);
    try {
      const result = await getReporteAbonos(reporte.id);
      setAbonosReporte(result);
    } catch (err) {
      console.error(err);
      setAbonosReporte([]);
    } finally {
      setLoadingAbonos(false);
    }
  };

  const handleOpenHistorial = async () => {
    setHistorialOpen(true);
    setCurrentPage(1);
    if (abonosReporte.length === 0 && selectedReporte) {
      setLoadingAbonos(true);
      try {
        const result = await getReporteAbonos(selectedReporte.id);
        setAbonosReporte(result);
      } catch (err) {
        console.error(err);
        setAbonosReporte([]);
      } finally {
        setLoadingAbonos(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.reporte || !formData.monto) {
      toast.error("Complete los campos requeridos");
      return;
    }
    try {
      await createAbono({
        reporte: formData.reporte.value,
        monto: parseFloat(formData.monto),
        referencia_pago: formData.referencia_pago || "",
      });
      toast.success("Abono registrado exitosamente");
      setModalOpen(false);
      setFormData({ reporte: null, monto: "", referencia_pago: "" });
      refetch();
    } catch (err) {
      toast.error("Error al registrar el abono");
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAbono(deleteId);
      toast.success("Abono eliminado exitosamente");
      setDeleteId(null);
      refetch();
      if (selectedReporte) {
        const result = await getReporteAbonos(selectedReporte.id);
        setAbonosReporte(result);
      }
    } catch (err) {
      toast.error("Error al eliminar el abono");
    }
  };

  const filteredReportes = reportes.filter((reporte) => {
    const searchLower = search.toLowerCase();
    return (
      (reporte.n_presupuesto?.toLowerCase() || "").includes(searchLower) ||
      (reporte.cliente_nombre?.toLowerCase() || "").includes(searchLower) ||
      (reporte.descripcion?.toLowerCase() || "").includes(searchLower)
    );
  });

  const totales = reportes.reduce(
    (acc, curr) => ({
      totalReportes: acc.totalReportes + parseFloat(curr.total_reporte || 0),
      totalAbonado: acc.totalAbonado + parseFloat(curr.total_abonado || 0),
      totalPendiente: acc.totalPendiente + parseFloat(curr.saldo_pendiente || 0),
    }),
    { totalReportes: 0, totalAbonado: 0, totalPendiente: 0 }
  );

  const totalPages = Math.ceil(abonosReporte.length / ITEMS_PER_PAGE);
  const paginatedAbonos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return abonosReporte.slice(start, start + ITEMS_PER_PAGE);
  }, [abonosReporte, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (error)
    return <div className="p-4 text-red-600">Error al cargar datos</div>;

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
              <p className="text-sm text-gray-300">Total Reportes</p>
              <p className="text-xl font-bold">{formatCurrency(totales.totalReportes)}</p>
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
              <p className="text-xl font-bold">{formatCurrency(totales.totalAbonado)}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#e53935] text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-3">
              <FaMoneyBillWave size={24} />
            </div>
            <div>
              <p className="text-sm text-red-100">Pendiente por Cobrar</p>
              <p className="text-xl font-bold">{formatCurrency(totales.totalPendiente)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de reportes */}
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white">
        <div className="px-6 py-4 bg-[#0b2c4d] border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Cuentas por Cobrar - Presupuestos</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="pl-8 pr-3 py-1 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-black"
              />
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#e53935] hover:bg-[#c2302d] text-white font-medium py-2 px-4 rounded flex items-center gap-2 transition"
            >
              <FaPlus size={14} />
              Registrar Abono
            </button>
          </div>
        </div>

        <table className="w-full text-sm text-left text-gray-900">
          <thead className="text-xs uppercase bg-[#0b2c4d] text-white">
            <tr>
              <th className="px-6 py-3">N° Presupuesto</th>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Descripción</th>
              <th className="px-6 py-3">Fecha</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Abonado</th>
              <th className="px-6 py-3">Pendiente</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8">
                  <div className="flex justify-center items-center w-full h-full">
                    <BounceLoader color="#0b2c4d" size={80} />
                  </div>
                </td>
              </tr>
            ) : filteredReportes.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  No hay registros disponibles
                </td>
              </tr>
            ) : (
              filteredReportes.map((reporte) => (
                <tr
                  key={reporte.id}
                  onClick={() => handleRowClick(reporte)}
                  className="bg-white border-b hover:bg-gray-100 cursor-pointer transition"
                >
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {reporte.n_presupuesto || "-"}
                  </td>
                  <td className="px-6 py-4">
                    {reporte.cliente_nombre || "-"}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">
                    {reporte.descripcion || "-"}
                  </td>
                  <td className="px-6 py-4">
                    {formatDate(reporte.fecha_creacion)}
                  </td>
                  <td className="px-6 py-4 text-gray-800 font-medium">
                    {formatCurrency(reporte.total_reporte)}
                  </td>
                  <td className="px-6 py-4 text-green-600 font-medium">
                    {formatCurrency(reporte.total_abonado)}
                  </td>
                  <td className={`px-6 py-4 font-medium ${parseFloat(reporte.saldo_pendiente) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(reporte.saldo_pendiente)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Registrar Abono */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          if (!selectedReporte) {
            setFormData({ reporte: null, monto: "", referencia_pago: "" });
            setSearchReportes("");
          }
        }}
        title="Registrar Abono"
        width="max-w-md"
      >
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {formData.reporte ? (
            <div className="bg-gray-100 p-3 rounded-lg border">
              <p className="text-sm text-gray-600 mb-1">Presupuesto seleccionado:</p>
              <p className="font-semibold text-gray-800">{formData.reporte.label}</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Presupuesto *
              </label>
              <Select
                value={formData.reporte}
                onChange={(option) => setFormData({ ...formData, reporte: option })}
                options={reportesOptions}
                isLoading={loadingReportes}
                placeholder="Buscar presupuesto..."
                isSearchable
                onInputChange={(value) => setSearchReportes(value)}
                className="basic-single"
                classNamePrefix="select"
              />
            </div>
          )}
          {formData.reporte && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p><strong>Cliente:</strong> {formData.reporte.data?.cliente_nombre}</p>
              <p><strong>Total:</strong> {formatCurrency(formData.reporte.data?.total_reporte)}</p>
              <p><strong>Pendiente:</strong> {formatCurrency(formData.reporte.data?.saldo_pendiente)}</p>
            </div>
          )}
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
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                if (!selectedReporte) {
                  setFormData({ reporte: null, monto: "", referencia_pago: "" });
                  setSearchReportes("");
                }
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-[#0b2c4d] hover:bg-[#143d65] text-white font-semibold px-4 py-2 rounded transition"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalle del Reporte */}
      <Modal
        isOpen={isDetalleOpen}
        onClose={() => {
          setDetalleOpen(false);
          setSelectedReporte(null);
          setAbonosReporte([]);
        }}
        title={`Presupuesto ${selectedReporte?.n_presupuesto || ""}`}
        width="max-w-xl"
      >
        {selectedReporte && (
          <div className="space-y-4">
            {/* Info del reporte */}
            <div className="bg-[#0b2c4d] text-white rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Cliente:</span>
                <span className="font-medium">{selectedReporte.cliente_nombre}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Descripción:</span>
                <span className="font-medium text-right max-w-xs">{selectedReporte.descripcion || "-"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Fecha:</span>
                <span className="font-medium">{formatDate(selectedReporte.fecha_creacion)}</span>
              </div>
              <hr className="border-white/20 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total:</span>
                <span className="font-bold text-lg">{formatCurrency(selectedReporte.total_reporte)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Abonado:</span>
                <span className="font-bold text-lg text-green-400">{formatCurrency(selectedReporte.total_abonado)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Pendiente:</span>
                <span className={`font-bold text-lg ${parseFloat(selectedReporte.saldo_pendiente) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatCurrency(selectedReporte.saldo_pendiente)}
                </span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setFormData({
                    reporte: {
                      value: selectedReporte.id,
                      label: `${selectedReporte.n_presupuesto} - ${selectedReporte.cliente_nombre}`,
                      data: selectedReporte,
                    },
                    monto: "",
                    referencia_pago: "",
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

      {/* Modal Historial de Pagos (sobre el modal de detalle) */}
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
                      <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAbonos.map((abono) => (
                      <tr key={abono.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{formatDate(abono.fecha_abono)}</td>
                        <td className="px-4 py-3 text-green-600 font-medium">{formatCurrency(abono.monto)}</td>
                        <td className="px-4 py-3">{abono.referencia_pago || "-"}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setDeleteId(abono.id)}
                            className="text-red-600 hover:text-red-800 transition"
                            title="Eliminar"
                          >
                            <FaRegTrashCan size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-3">
                  <p className="text-sm text-gray-600">
                    Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, abonosReporte.length)} de {abonosReporte.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg transition ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                    >
                      <FaChevronLeft size={16} />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-8 h-8 rounded-lg text-sm transition ${currentPage === page ? 'bg-[#0b2c4d] text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg transition ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                    >
                      <FaChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirmar eliminación"
      >
        <div className="space-y-4">
          <p>
            ¿Estás seguro de eliminar este{" "}
            <span className="font-bold text-red-700">abono</span>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteId(null)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
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
