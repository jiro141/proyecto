import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaPlus, FaEye, FaBan, FaSearch, FaFileAlt, FaDownload } from "react-icons/fa";
import BounceLoader from "react-spinners/BounceLoader";
import useFacturas from "../../hooks/useFacturas";
import { anularFactura } from "../../api/controllers/Facturas";
import Modal from "../../components/Modal";
import Paginator from "../../components/Paginator";
import FacturaDetalleModal from "./components/FacturaDetalleModal";
import { formatFecha, formatMoneda, EstadoBadge } from "./utils";

// Hooks de PDF
import usePDFNotaCredito from "./hooks/usePDFNotaCredito";
import usePDFNotaDebito from "./hooks/usePDFNotaDebito";
import { notifyError } from "../../api/apiErrors";

export default function FacturacionLayout() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { facturas, loading, refetch, page, setPage, pagination } = useFacturas(debouncedSearch);
  const [detalle, setDetalle] = useState(null);

  // Estado para el modal de anulación
  const [anularId, setAnularId] = useState(null);
  const [tipoNota, setTipoNota] = useState("credito");
  const [motivo, setMotivo] = useState("");
  const [anulando, setAnulando] = useState(false);

  // Estado para el modal de resultado
  const [notaResult, setNotaResult] = useState(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  // Hooks de PDF
  const { generarPDFNotaCredito } = usePDFNotaCredito();
  const { generarPDFNotaDebito } = usePDFNotaDebito();

  // Debounce del buscador
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleAnular = async () => {
    if (!anularId) return;
    setAnulando(true);
    try {
      const result = await anularFactura(anularId, motivo, tipoNota);
      toast.success(`Factura anulada. ${tipoNota === "credito" ? "Nota de Crédito" : "Nota de Débito"} generada.`);

      // Guardar resultado para mostrar el modal con PDF.
      // `result.nota_generada` ya viene completo (NotaCreditoSerializer /
      // NotaDebitoSerializer) con todos los campos planos que necesitan
      // usePDFNotaCredito/usePDFNotaDebito (cliente_nombre, subtotal,
      // monto_iva, motivo, n_factura, items, total propio de la nota, etc.).
      // Solo le agregamos `tipo` porque el backend no lo incluye.
      setNotaResult({
        ...result.nota_generada,
        tipo: tipoNota,
      });

      setAnularId(null);
      setTipoNota("credito");
      setMotivo("");
      refetch();
    } catch (error) {
      notifyError(error, "Error al anular la factura");
      console.error(error);
    } finally {
      setAnulando(false);
    }
  };

  const handleDescargarPDF = async () => {
    if (!notaResult) return;
    setGenerandoPDF(true);
    try {
      let resultado;
      if (notaResult.tipo === "credito") {
        resultado = await generarPDFNotaCredito(notaResult, {
          n_factura: notaResult.n_factura || "",
        });
      } else {
        resultado = await generarPDFNotaDebito(notaResult, {
          n_factura: notaResult.n_factura || "",
        });
      }
      if (!resultado.ok) {
        toast.error("No se pudo generar el PDF.");
        return;
      }
      toast.success("PDF descargado.");
    } catch (err) {
      console.error("Error generando PDF:", err);
      notifyError(err, "No se pudo generar el PDF.");
    } finally {
      setGenerandoPDF(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Tabla */}
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

        <Paginator
          currentPage={page}
          totalCount={pagination.count}
          pageSize={20}
          onPageChange={setPage}
        />
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

      {/* ========================================
          MODAL ANULACIÓN — Paso 1: Tipo de nota + Motivo
          ======================================== */}
      <Modal
        isOpen={!!anularId && !notaResult}
        onClose={() => {
          setAnularId(null);
          setTipoNota("credito");
          setMotivo("");
        }}
        title="Anular Factura"
      >
        <div className="space-y-5">
          <p className="text-gray-700">
            Seleccione el tipo de nota a generar para esta anulación:
          </p>

          {/* Tipo de nota */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTipoNota("credito")}
              className={`p-4 rounded-lg border-2 text-left transition ${
                tipoNota === "credito"
                  ? "border-green-600 bg-green-50"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <FaFileAlt
                  size={18}
                  className={tipoNota === "credito" ? "text-green-600" : "text-gray-400"}
                />
                <span className={`font-bold ${tipoNota === "credito" ? "text-green-700" : "text-gray-700"}`}>
                  Nota de Crédito
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Reduce el saldo que el cliente debe. Generada automáticamente al anular.
              </p>
            </button>

            <button
              onClick={() => setTipoNota("debito")}
              className={`p-4 rounded-lg border-2 text-left transition ${
                tipoNota === "debito"
                  ? "border-orange-600 bg-orange-50"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <FaFileAlt
                  size={18}
                  className={tipoNota === "debito" ? "text-orange-600" : "text-gray-400"}
                />
                <span className={`font-bold ${tipoNota === "debito" ? "text-orange-700" : "text-gray-700"}`}>
                  Nota de Débito
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Ajusta montos por correcciones o recargos sobre la factura original.
              </p>
            </button>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo (opcional)
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Describa el motivo de la anulación..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setAnularId(null);
                setTipoNota("credito");
                setMotivo("");
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={handleAnular}
              disabled={anulando}
              className={`font-semibold px-4 py-2 rounded disabled:opacity-50 flex items-center gap-2 ${
                tipoNota === "credito"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-orange-600 hover:bg-orange-700 text-white"
              }`}
            >
              {anulando ? (
                <>
                  <BounceLoader size={14} color="white" />
                  Anulando...
                </>
              ) : (
                <>
                  <FaBan size={14} />
                  Anular con {tipoNota === "credito" ? "Nota de Crédito" : "Nota de Débito"}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================
          MODAL RESULTADO — Paso 2: Nota generada + PDF
          ======================================== */}
      <Modal
        isOpen={!!notaResult}
        onClose={() => setNotaResult(null)}
        title="Anulación completada"
      >
        <div className="space-y-5">
          {/* Icono de éxito */}
          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
              notaResult?.tipo === "credito" ? "bg-green-100" : "bg-orange-100"
            }`}>
              <FaFileAlt
                size={32}
                className={notaResult?.tipo === "credito" ? "text-green-600" : "text-orange-600"}
              />
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              {notaResult?.tipo === "credito" ? "Nota de Crédito" : "Nota de Débito"} generada
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Número: <span className="font-bold">{notaResult?.n_nota}</span>
            </p>
          </div>

          {/* Resumen */}
          <div className={`rounded-lg p-4 ${
            notaResult?.tipo === "credito" ? "bg-green-50 border border-green-200" : "bg-orange-50 border border-orange-200"
          }`}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Factura original:</span>
                <p className="font-medium">{notaResult?.n_factura || "—"}</p>
              </div>
              <div>
                <span className="text-gray-500">Tipo:</span>
                <p className="font-medium">
                  {notaResult?.tipo === "credito" ? "Nota de Crédito" : "Nota de Débito"}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Total:</span>
                <p className="font-bold text-lg">
                  {formatMoneda(notaResult?.total, notaResult?.moneda)}
                </p>
              </div>
            </div>
          </div>

          {/* Botón PDF */}
          <div className="flex justify-center">
            <button
              onClick={handleDescargarPDF}
              disabled={generandoPDF}
              className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition disabled:opacity-50 ${
                notaResult?.tipo === "credito"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-orange-600 hover:bg-orange-700 text-white"
              }`}
            >
              <FaDownload size={18} />
              {generandoPDF ? "Generando PDF..." : "Descargar PDF"}
            </button>
          </div>

          {/* Cerrar */}
          <div className="flex justify-center">
            <button
              onClick={() => setNotaResult(null)}
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
