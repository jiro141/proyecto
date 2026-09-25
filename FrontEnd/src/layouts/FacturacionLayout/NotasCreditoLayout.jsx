import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaEye, FaBan, FaSearch, FaFileAlt } from "react-icons/fa";
import BounceLoader from "react-spinners/BounceLoader";
import { getNotasCredito, anularNotaCredito } from "../../api/controllers/Facturas";
import Modal from "../../components/Modal";
import Paginator from "../../components/Paginator";
import NotaCreditoDetalleModal from "./components/NotaCreditoDetalleModal";
import { formatFecha, formatMoneda, EstadoBadge } from "./utils";
import { notifyError } from "../../api/apiErrors";

export default function NotasCreditoLayout() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ count: 0 });
  const [detalle, setDetalle] = useState(null);
  const [anularId, setAnularId] = useState(null);
  const [anulando, setAnulando] = useState(false);

  const fetchNotas = async () => {
    setLoading(true);
    try {
      const data = await getNotasCredito(debouncedSearch, page);
      setNotas(data.results || []);
      setPagination({ count: data.count || 0 });
    } catch (error) {
      console.error(error);
      notifyError(error, "Error al cargar notas de crédito");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotas();
  }, [debouncedSearch, page]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleAnular = async () => {
    if (!anularId) return;
    setAnulando(true);
    try {
      await anularNotaCredito(anularId);
      toast.success("Nota de crédito anulada.");
      setAnularId(null);
      fetchNotas();
    } catch (error) {
      notifyError(error, "Error al anular la nota de crédito");
      console.error(error);
    } finally {
      setAnulando(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0b2c4d] border-b flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaFileAlt size={18} />
              Notas de Crédito
            </h2>
            <p className="text-xs text-gray-300">
              Notas de crédito generadas por anulación de facturas
            </p>
          </div>
          <div className="relative">
            <FaSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número, cliente o RIF..."
              className="pl-8 pr-3 py-1 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-black"
            />
          </div>
        </div>

        {/* Tabla */}
        <table className="w-full text-sm text-left text-gray-900">
          <thead className="text-xs uppercase bg-[#0b2c4d] text-white">
            <tr>
              <th className="px-6 py-3">N° Nota</th>
              <th className="px-6 py-3">Factura Ref.</th>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Fecha</th>
              <th className="px-6 py-3 text-right">Total</th>
              <th className="px-6 py-3 text-center">Moneda</th>
              <th className="px-6 py-3 text-center">Estado</th>
              <th className="px-6 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8">
                  <div className="flex justify-center items-center w-full h-full">
                    <BounceLoader color="#0b2c4d" size={80} />
                  </div>
                </td>
              </tr>
            ) : notas.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500">
                  No hay notas de crédito disponibles
                </td>
              </tr>
            ) : (
              notas.map((n) => (
                <tr
                  key={n.id}
                  onClick={() => setDetalle(n)}
                  className="bg-white border-b hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {n.n_nota}
                  </td>
                  <td className="px-6 py-4">{n.n_factura || "—"}</td>
                  <td className="px-6 py-4">{n.cliente_nombre}</td>
                  <td className="px-6 py-4">{formatFecha(n.fecha)}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-800">
                    {formatMoneda(n.total, n.moneda)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {n.moneda === "BS" ? "Bs" : "USD"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <EstadoBadge estado={n.estado} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetalle(n);
                        }}
                        className="text-[#0B2C4D] hover:text-blue-700"
                        title="Ver detalle"
                      >
                        <FaEye size={18} />
                      </button>
                      {n.estado === "EMITIDA" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnularId(n.id);
                          }}
                          className="text-red-500 hover:text-red-700"
                          title="Anular"
                        >
                          <FaBan size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Paginator
          currentPage={page}
          totalCount={pagination.count}
          pageSize={20}
          onPageChange={setPage}
        />
      </div>

      {/* Modal detalle */}
      <NotaCreditoDetalleModal
        nota={detalle}
        onClose={() => setDetalle(null)}
        onAnular={(id) => {
          setDetalle(null);
          setAnularId(id);
        }}
      />

      {/* Modal confirmar anulación */}
      <Modal
        isOpen={!!anularId}
        onClose={() => setAnularId(null)}
        title="Confirmar anulación"
      >
        <div className="space-y-4">
          <p>
            ¿Estás seguro de anular esta{" "}
            <span className="font-bold text-red-700">nota de crédito</span>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setAnularId(null)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={handleAnular}
              disabled={anulando}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded disabled:opacity-50"
            >
              {anulando ? "Anulando..." : "Anular nota"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
