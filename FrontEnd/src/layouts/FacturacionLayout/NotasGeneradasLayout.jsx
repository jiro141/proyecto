import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaEye, FaBan, FaSearch, FaFileAlt, FaFileInvoiceDollar, FaExchangeAlt } from "react-icons/fa";
import BounceLoader from "react-spinners/BounceLoader";
import { getNotasCredito, getNotasDebito, anularNotaCredito, anularNotaDebito } from "../../api/controllers/Facturas";
import Modal from "../../components/Modal";
import Paginator from "../../components/Paginator";
import NotaCreditoDetalleModal from "./components/NotaCreditoDetalleModal";
import NotaDebitoDetalleModal from "./components/NotaDebitoDetalleModal";
import { formatFecha, formatMoneda, EstadoBadge } from "./utils";

export default function NotasGeneradasLayout() {
  const [activeTab, setActiveTab] = useState("todas"); // "todas" | "credito" | "debito"
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [notasCredito, setNotasCredito] = useState([]);
  const [notasDebito, setNotasDebito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ count: 0 });

  const [detalle, setDetalle] = useState(null);
  const [tipoDetalle, setTipoDetalle] = useState(null); // "credito" | "debito"
  const [anularId, setAnularId] = useState(null);
  const [tipoAnular, setTipoAnular] = useState(null);
  const [anulando, setAnulando] = useState(false);

  const fetchNotas = async () => {
    setLoading(true);
    try {
      const fetchCredito = activeTab === "debito" ? Promise.resolve({ results: [] }) : getNotasCredito(debouncedSearch, page);
      const fetchDebito = activeTab === "credito" ? Promise.resolve({ results: [] }) : getNotasDebito(debouncedSearch, page);

      const [dataCredito, dataDebito] = await Promise.all([fetchCredito, fetchDebito]);

      const nc = (dataCredito.results || []).map((n) => ({ ...n, _tipo: "credito" }));
      const nd = (dataDebito.results || []).map((n) => ({ ...n, _tipo: "debito" }));

      // Combinar y ordenar por fecha descendente
      const combined = [...nc, ...nd].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      if (activeTab === "todas") {
        setNotasCredito(combined);
        setPagination({ count: combined.length });
      } else if (activeTab === "credito") {
        setNotasCredito(nc);
        setPagination({ count: dataCredito.count || nc.length });
      } else {
        setNotasCredito(nd);
        setPagination({ count: dataDebito.count || nd.length });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar notas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotas();
  }, [debouncedSearch, page, activeTab]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleAnular = async () => {
    if (!anularId || !tipoAnular) return;
    setAnulando(true);
    try {
      if (tipoAnular === "credito") {
        await anularNotaCredito(anularId);
        toast.success("Nota de crédito anulada.");
      } else {
        await anularNotaDebito(anularId);
        toast.success("Nota de débito anulada.");
      }
      setAnularId(null);
      setTipoAnular(null);
      fetchNotas();
    } catch (error) {
      toast.error("Error al anular la nota");
      console.error(error);
    } finally {
      setAnulando(false);
    }
  };

  const handleVerDetalle = (nota, tipo) => {
    setDetalle(nota);
    setTipoDetalle(tipo);
  };

  const notas = notasCredito;

  return (
    <div className="p-4 space-y-4">
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0b2c4d] border-b flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaExchangeAlt size={18} />
              Notas Generadas
            </h2>
            <p className="text-xs text-gray-300">
              Notas de crédito y débito generadas
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

        {/* Tabs */}
        <div className="px-6 py-3 border-b bg-gray-50 flex gap-2">
          <button
            onClick={() => { setActiveTab("todas"); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "todas"
                ? "bg-[#0b2c4d] text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => { setActiveTab("credito"); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              activeTab === "credito"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <FaFileAlt size={12} />
            Notas de Crédito
          </button>
          <button
            onClick={() => { setActiveTab("debito"); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              activeTab === "debito"
                ? "bg-orange-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <FaFileInvoiceDollar size={12} />
            Notas de Débito
          </button>
        </div>

        {/* Tabla */}
        <table className="w-full text-sm text-left text-gray-900">
          <thead className="text-xs uppercase bg-[#0b2c4d] text-white">
            <tr>
              <th className="px-6 py-3">Tipo</th>
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
                <td colSpan={9} className="px-6 py-8">
                  <div className="flex justify-center items-center w-full h-full">
                    <BounceLoader color="#0b2c4d" size={80} />
                  </div>
                </td>
              </tr>
            ) : notas.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-6 text-gray-500">
                  No hay notas disponibles
                </td>
              </tr>
            ) : (
              notas.map((n) => (
                <tr
                  key={`${n._tipo}-${n.id}`}
                  onClick={() => handleVerDetalle(n, n._tipo)}
                  className="bg-white border-b hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        n._tipo === "credito"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {n._tipo === "credito" ? "NC" : "ND"}
                    </span>
                  </td>
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
                          handleVerDetalle(n, n._tipo);
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
                            setTipoAnular(n._tipo);
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

      {/* Modal detalle NC */}
      {tipoDetalle === "credito" && (
        <NotaCreditoDetalleModal
          nota={detalle}
          onClose={() => { setDetalle(null); setTipoDetalle(null); }}
          onAnular={(id) => {
            setDetalle(null);
            setTipoDetalle(null);
            setAnularId(id);
            setTipoAnular("credito");
          }}
        />
      )}

      {/* Modal detalle ND */}
      {tipoDetalle === "debito" && (
        <NotaDebitoDetalleModal
          nota={detalle}
          onClose={() => { setDetalle(null); setTipoDetalle(null); }}
          onAnular={(id) => {
            setDetalle(null);
            setTipoDetalle(null);
            setAnularId(id);
            setTipoAnular("debito");
          }}
        />
      )}

      {/* Modal confirmar anulación */}
      <Modal
        isOpen={!!anularId}
        onClose={() => { setAnularId(null); setTipoAnular(null); }}
        title="Confirmar anulación"
      >
        <div className="space-y-4">
          <p>
            ¿Estás seguro de anular esta{" "}
            <span className={`font-bold ${tipoAnular === "credito" ? "text-green-700" : "text-orange-700"}`}>
              {tipoAnular === "credito" ? "nota de crédito" : "nota de débito"}
            </span>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setAnularId(null); setTipoAnular(null); }}
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
