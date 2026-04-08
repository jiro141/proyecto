import React from "react";
import Modal from "../../../components/Modal";

export const Etapa3Modals = ({
  deleteModalOpen,
  apuToDelete,
  successModalOpen,
  isReportGenerated,
  onCancelDelete,
  onConfirmDelete,
  onCloseSuccessModal,
  onGenerarPDF,
  onGenerarExcel,
}) => {
  return (
    <>
      {/* === MODAL ELIMINAR APU === */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={onCancelDelete}
        title="Eliminar APU"
        width="max-w-md"
      >
        <p className="text-gray-700 text-center mb-6">
          ¿Seguro que deseas eliminar el <strong>APU #{(apuToDelete ?? 0) + 1}</strong>?
          <br />
          Esta acción no se puede deshacer.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={onCancelDelete}
            className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmDelete}
            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            Eliminar
          </button>
        </div>
      </Modal>

      {/* === MODAL ÉXITO: GENERAR PDF / EXCEL === */}
      <Modal
        isOpen={successModalOpen}
        onClose={onCloseSuccessModal}
        title="Presupuesto Generado"
        width="max-w-md"
      >
        <div className="text-center space-y-6">
          <p className="text-gray-700">
            El presupuesto se ha guardado correctamente.
          </p>
          <div className="flex justify-center gap-6">
            <button
              onClick={onGenerarPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              Generar PDF
            </button>
            <button
              onClick={onGenerarExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Generar Excel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Etapa3Modals;