import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaPlus, FaEye, FaBan, FaSearch } from "react-icons/fa";
import BounceLoader from "react-spinners/BounceLoader";
import useFacturas from "../../hooks/useFacturas";
import { anularFactura } from "../../api/controllers/Facturas";
import Modal from "../../components/Modal";
import FacturaDetalleModal from "./components/FacturaDetalleModal";
import { formatFecha, formatMoneda, EstadoBadge } from "./utils";

export default function FacturacionLayout() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { facturas, loading, refetch } = useFacturas(debouncedSearch);
  const [detalle, setDetalle] = useState(null);
  const [anularId, setAnularId] = useState(null);
  const [anulando, setAnulando] = useState(false);

  // Debounce del buscador
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleAnular = async () => {
    if (!anularId) return;
    setAnulando(true);
    try {
      await anularFactura(anularId);
      toast.success("Factura anulada. El monto vuelve a estar disponible.");
      setAnularId(null);
      refetch();
    } catch (error) {
      toast.error("Error al anular la factura");
      console.error(error);
    } finally {
      setAnulando(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Tabla con estilo compartido (inventario / cuentas por cobrar) */}
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0b2c4d] border-b flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Facturación</h2>
            <p className="text-xs text-gray-300">
              Facturas generadas a partir de presupuestos ejecutados
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
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
            <button
              onClick={() => navigate("/facturas/generar")}
              className="bg-[#e53935] hover:bg-[#c2302d] text-white font-medium py-2 px-4 rounded flex items-center gap-2 transition"
            >
              <FaPlus size={14} />
              Nueva Factura
            </button>
          </div>
        </div>

        {/* Tabla */}
        <table className="w-full text-sm text-left text-gray-900">
          <thead className="text-xs uppercase bg-[#0b2c4d] text-white">
            <tr>
              <th className="px-6 py-3">N° Factura</th>
              <th className="px-6 py-3">Orden de control</th>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Presupuesto</th>
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
            ) : facturas.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-6 text-gray-500">
                  No hay registros disponibles
                </td>
              </tr>
            ) : (
              facturas.map((f) => (
                <tr
                  key={f.id}
                  onClick={() => setDetalle(f)}
                  className="bg-white border-b hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {f.n_factura}
                  </td>
                  <td className="px-6 py-4">
                    {f.orden_control || "-"}
                  </td>
                  <td className="px-6 py-4">{f.cliente_nombre}</td>
                  <td className="px-6 py-4">#{f.n_presupuesto}</td>
                  <td className="px-6 py-4">{formatFecha(f.fecha)}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-800">
                    {formatMoneda(f.total, f.moneda)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {f.moneda === "BS" ? "Bs" : "USD"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <EstadoBadge estado={f.estado} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetalle(f);
                        }}
                        className="text-[#0B2C4D] hover:text-blue-700"
                        title="Ver detalle"
                      >
                        <FaEye size={18} />
                      </button>
                      {f.estado === "EMITIDA" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnularId(f.id);
                          }}
                          className="text-red-500 hover:text-red-700"
                          title="Anular factura"
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
      </div>

      {/* Modal detalle */}
      <FacturaDetalleModal
        factura={detalle}
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
            <span className="font-bold text-red-700">factura</span>? El monto
            facturado volverá a estar disponible para facturar.
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
              {anulando ? "Anulando..." : "Anular factura"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}