import React from "react";
import { BounceLoader } from "react-spinners";
import { FaFileInvoiceDollar, FaEye } from "react-icons/fa";
import Modal from "../../../components/Modal";
import { formatFecha, formatMoneda } from "../utils";

export default function VerFacturasModal({
  reporte,
  facturas,
  loading,
  onClose,
  onSelectFactura,
}) {
  const list = Array.isArray(facturas) ? facturas : [];

  return (
    <Modal
      isOpen={!!reporte}
      onClose={onClose}
      title={`Facturas del presupuesto #${reporte?.n_presupuesto || ""}`}
      width="max-w-3xl"
      height="h-[70vh]"
    >
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <BounceLoader color="#0b2c4d" size={60} />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No hay facturas para este presupuesto.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">N° Factura</th>
                <th className="px-4 py-2 text-left">Orden de Control</th>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.map((factura) => (
                <tr
                  key={factura.id}
                  onClick={() => onSelectFactura?.(factura)}
                  className="border-b hover:bg-blue-50 cursor-pointer transition"
                >
                  <td className="px-4 py-2 font-medium text-[#0b2c4d] flex items-center gap-2">
                    <FaFileInvoiceDollar size={14} />
                    {factura.n_factura}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {factura.orden_control || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {formatFecha(factura.fecha)}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatMoneda(factura.total, factura.moneda)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${
                        factura.estado === "EMITIDA"
                          ? "bg-green-600"
                          : "bg-red-600"
                      }`}
                    >
                      <FaEye size={10} />
                      {factura.estado === "EMITIDA" ? "Emitida" : "Anulada"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}