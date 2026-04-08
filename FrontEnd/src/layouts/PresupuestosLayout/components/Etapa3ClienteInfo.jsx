import React from "react";

const formatoMoneda = (valor) =>
  valor?.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }) || "$0.00";

export const ClienteInfo = ({ formData, presupuestoEstimado }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-5 border border-gray-200">
      <h3 className="text-lg font-semibold text-[#0B2C4D] mb-3">
        Información del Cliente
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <p>
          <strong>Cliente:</strong> {formData?.cliente?.nombre || "—"}
        </p>
        <p>
          <strong>RIF:</strong> {formData?.cliente?.rif || "—"}
        </p>
        <p>
          <strong>Encargado:</strong> {formData?.cliente?.encargado || "—"}
        </p>

        <p>
          <strong>Fecha de Culminación:</strong>{" "}
          {new Date(formData?.fechaCulminacion).toLocaleDateString()}
        </p>
        <p>
          <strong>Presupuesto Base:</strong>{" "}
          {formatoMoneda(presupuestoEstimado || 0)}
        </p>
        <p>
          <strong>% Productividad:</strong>{" "}
          {formData?.porcentaje_productividad || 1}x
        </p>
      </div>
    </div>
  );
};

export default ClienteInfo;