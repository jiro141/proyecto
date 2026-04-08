import React from "react";
import Modal from "../../../components/Modal";
import EstadoHistorial from "./EstadoHistorial";
import { BounceLoader } from "react-spinners";

export const ReporteDetalleModal = ({
  isOpen,
  onClose,
  reporte,
  loading
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={reporte ? `Presupuesto ${reporte.n_presupuesto}` : "Cargando..."}
      width="max-w-2xl"
    >
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <BounceLoader color="#0b2c4d" size={60} />
        </div>
      ) : reporte ? (
        <EstadoHistorial
          reporte={reporte}
        />
      ) : (
        <div className="text-center py-8 text-gray-500">
          No se pudo cargar la información del reporte
        </div>
      )}
    </Modal>
  );
};

export default ReporteDetalleModal;