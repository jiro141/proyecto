import React, { useState } from "react";
import { FaTimes, FaBan, FaFileInvoiceDollar, FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import { formatFecha, formatMoneda, EstadoBadge } from "../utils";
import usePDFNotaCredito from "../hooks/usePDFNotaCredito";

export default function NotaCreditoDetalleModal({ nota, onClose, onAnular }) {
  const { generarPDFNotaCredito, calcularMaxItems } = usePDFNotaCredito();
  const [generando, setGenerando] = useState(false);

  if (!nota) return null;

  const subtotal = Number(nota.subtotal || 0);
  const descuento = Number(nota.monto_descuento || 0);
  const iva = Number(nota.monto_iva || 0);
  const total = Number(nota.total || 0);

  const maxItemsInfo = calcularMaxItems(
    nota.items || [],
    nota.cliente_direccion || ""
  );
  const itemsCount = (nota.items || []).length;
  const excedeLimite = !maxItemsInfo.cabenTodos;

  const handleGenerarPDF = async () => {
    try {
      setGenerando(true);
      const resultado = generarPDFNotaCredito(nota, {
        n_factura: nota.n_factura || "",
        tasaBCV: null,
      });
      if (!resultado.ok) {
        toast.error(
          "Límite máximo de ítems alcanzado para una sola hoja."
        );
        return;
      }
      toast.success("PDF de la nota de crédito descargado.");
    } catch (err) {
      console.error("Error generando PDF:", err);
      toast.error("No se pudo generar el PDF.");
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#0B2C4D] text-white px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FaFileInvoiceDollar size={20} />
            <h2 className="font-bold text-lg">
              Nota de Crédito {nota.n_nota}
            </h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Datos generales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-gray-500 text-sm">Factura Ref.</span>
              <p className="font-medium">{nota.n_factura || "—"}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Fecha</span>
              <p className="font-medium">{formatFecha(nota.fecha)}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Moneda</span>
              <p className="font-medium">{nota.moneda === "BS" ? "Bolívares (Bs)" : "Dólares (USD)"}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Estado</span>
              <div className="mt-1">
                <EstadoBadge estado={nota.estado} />
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm">
            <span className="font-medium text-yellow-800">Motivo: </span>
            <span className="text-yellow-700">{nota.motivo || "—"}</span>
          </div>

          {/* Tasa (si aplica) */}
          {nota.moneda === "BS" && nota.tasa_bs_usd && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm">
              <span className="font-medium text-blue-800">
                Tasa BCV: Bs {Number(nota.tasa_bs_usd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
            </div>
          )}

          {/* Datos del cliente */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Datos del cliente
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Nombre:</span>{" "}
                <span className="font-medium">{nota.cliente_nombre}</span>
              </div>
              <div>
                <span className="text-gray-500">RIF:</span>{" "}
                <span className="font-medium">{nota.cliente_rif || "—"}</span>
              </div>
              <div>
                <span className="text-gray-500">Encargado:</span>{" "}
                <span className="font-medium">{nota.cliente_encargado || "—"}</span>
              </div>
              <div>
                <span className="text-gray-500">Teléfono:</span>{" "}
                <span className="font-medium">{nota.cliente_telefono || "—"}</span>
              </div>
              <div>
                <span className="text-gray-500">Dirección:</span>{" "}
                <span className="font-medium">{nota.cliente_direccion || "—"}</span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Items
              </h3>
              <span
                className={`text-xs font-semibold ${
                  excedeLimite ? "text-red-600" : "text-gray-500"
                }`}
              >
                {itemsCount} de {maxItemsInfo.maxItems} máximo por hoja
                {excedeLimite && " — excede el límite"}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Cant.</th>
                  <th className="px-3 py-2 text-left">Descripción</th>
                  <th className="px-3 py-2 text-center">Und.</th>
                  <th className="px-3 py-2 text-right">P.Unit</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(nota.items || []).map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-3 py-2">{item.cantidad}</td>
                    <td className="px-3 py-2">{item.apu_descripcion}</td>
                    <td className="px-3 py-2 text-center">{item.unidad || "—"}</td>
                    <td className="px-3 py-2 text-right">
                      {formatMoneda(item.precio_unitario, nota.moneda)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatMoneda(item.total_item, nota.moneda)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatMoneda(subtotal, nota.moneda)}</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Descuento ({nota.porcentaje_descuento}%)</span>
                  <span>- {formatMoneda(descuento, nota.moneda)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">IVA</span>
                <span className="font-medium">{formatMoneda(iva, nota.moneda)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
                <span>TOTAL</span>
                <span className="text-[#0B2C4D]">{formatMoneda(total, nota.moneda)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-3 flex justify-end gap-2">
          <button
            onClick={handleGenerarPDF}
            disabled={generando || excedeLimite}
            className="px-4 py-2 bg-[#0B2C4D] text-white rounded hover:bg-[#143d65] flex items-center gap-2 disabled:opacity-50"
          >
            <FaDownload size={16} />
            {generando ? "Generando..." : "Generar PDF"}
          </button>
          {nota.estado === "EMITIDA" && (
            <button
              onClick={() => onAnular?.(nota.id)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
            >
              <FaBan size={16} />
              Anular
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
