import React from "react";
import Modal from "../../../components/Modal";
import usePDFReciboAbono from "../../PresupuestosLayout/hooks/usePDFReciboAbono";
import { notifyError } from "../../../api/apiErrors";

const formatCurrency = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? "$0.00" : `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Modal de éxito tras registrar un abono, con la opción de generar el recibo PDF.
 * @param {Object|null} abono - respuesta de createAbono; null = cerrado
 * @param {Object} cliente - { nombre, rif } para el recibo
 */
export default function ReciboAbonoModal({ abono, cliente, onClose }) {
  const { generarReciboAbono } = usePDFReciboAbono();

  const handleGenerarRecibo = () => {
    try {
      generarReciboAbono(abono, cliente);
    } catch (error) {
      console.error(error);
      notifyError(error, "No se pudo generar el recibo PDF");
    }
  };

  return (
    <Modal
      isOpen={Boolean(abono)}
      onClose={onClose}
      title="Abono Registrado"
      width="max-w-md"
    >
      {abono && (
        <div className="text-center space-y-6">
          <div className="space-y-1">
            <p className="text-gray-700">
              El abono se ha registrado correctamente.
            </p>
            <p className="text-sm text-gray-500">
              Presupuesto <strong>{abono.n_presupuesto}</strong> · Abono{" "}
              <strong>{formatCurrency(abono.monto)}</strong> · Saldo pendiente{" "}
              <strong>{formatCurrency(abono.monto_restante)}</strong>
            </p>
          </div>
          <div className="flex justify-center gap-6">
            <button
              onClick={handleGenerarRecibo}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              Generar Recibo
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
