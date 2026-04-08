import React from "react";

const formatoMoneda = (valor) => {
  const numero = Number(valor ?? 0);
  if (isNaN(numero)) return "$0.00";
  return numero.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
};

export const TotalesSidebar = ({
  materialesTotal,
  herramientasPorRendimiento,
  logisticaTotal,
  bonoAlimentacion,
  prestacionesSociales,
  manoObraTotal,
  costoPorUnidad,
  costoDirectoPorUnidad,
  adminYGastos,
  subTotal,
  utilidad,
  totalUnitario,
}) => {
  return (
    <div className="w-full md:w-1/2">
      <div className="border-t mt-0 pt-3 text-sm text-gray-700 space-y-1">
        {/* 🔹 Totales por rubro */}
        <div className="flex justify-between font-bold text-[#0B2C4D]">
          <span>Total Materiales</span>
          <span>{formatoMoneda(materialesTotal)}</span>
        </div>
        <div className="flex justify-between font-bold text-[#0B2C4D]">
          <span>Total Herramientas</span>
          <span>{formatoMoneda(herramientasPorRendimiento)}</span>
        </div>
        <div className="flex justify-between font-bold text-[#0B2C4D]">
          <span>Total Logística</span>
          <span>{formatoMoneda(logisticaTotal)}</span>
        </div>

        {/* 🔹 Detalle Mano de Obra */}
        <div className="flex justify-between font-medium text-[#0B2C4D] mt-2">
          <span>Bono Alimenticio ($15 × Días)</span>
          <span>{formatoMoneda(bonoAlimentacion)}</span>
        </div>
        <div className="flex justify-between font-medium text-[#0B2C4D]">
          <span>Prestaciones Sociales (200%)</span>
          <span>{formatoMoneda(prestacionesSociales)}</span>
        </div>
        <div className="flex justify-between font-bold text-[#0B2C4D] border-b pb-2">
          <span>Total Mano de Obra</span>
          <span>{formatoMoneda(manoObraTotal)}</span>
        </div>

        {/* 🔹 Totales de unidad y márgenes */}
        <div className="flex justify-between font-medium">
          <span>Costo por unidad</span>
          <span>{formatoMoneda(costoPorUnidad)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Costo directo por unidad</span>
          <span>{formatoMoneda(costoDirectoPorUnidad)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>15% Administración y gastos</span>
          <span>{formatoMoneda(adminYGastos)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Sub total</span>
          <span>{formatoMoneda(subTotal)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>15% Utilidad</span>
          <span>{formatoMoneda(utilidad)}</span>
        </div>
        <div className="flex justify-between text-base font-bold border-t pt-2">
          <span>Total unitario</span>
          <span>{formatoMoneda(totalUnitario)}</span>
        </div>
      </div>
    </div>
  );
};

export default TotalesSidebar;