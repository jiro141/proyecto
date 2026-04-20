import React from "react";
import Accordion from "../../../components/Accordion";

const formatoMoneda = (valor) => {
  const numero = Number(valor ?? 0);
  if (isNaN(numero)) return "$0,00";
  return `$${numero.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const TotalesAccordions = ({
  stock_almacen,
  consumibles,
  materialesTotal,
  herramientasFiltradas,
  herramientasPorRendimiento,
  manoObraFiltrada,
  manoObraTotal,
  bonoAlimentacion,
  prestacionesSociales,
  logisticaFiltrada,
  logisticaTotal,
}) => {
  return (
    <div className="w-full md:w-1/2 space-y-2">
      {/* === Materiales === */}
      <Accordion
        title={`Materiales (${stock_almacen.length + consumibles.length})`}
        subtitle={`Total: ${formatoMoneda(materialesTotal)}`}
      >
        {[...stock_almacen, ...consumibles].length > 0 ? (
          [...stock_almacen, ...consumibles].map((item) => (
            <div key={item.id} className="flex justify-between text-sm border-b py-1">
              <span>{item.descripcion || item.nombre}</span>
              <span>
                {item.cantidad} × {formatoMoneda(Number((1 + (item.desp || 0) / 100) * (item.costo || 0)))}
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm italic text-center py-2">Sin registros</p>
        )}
      </Accordion>

      {/* === Herramientas === */}
      <Accordion
        title={`Herramientas (${herramientasFiltradas.length})`}
        subtitle={`Total: ${formatoMoneda(herramientasPorRendimiento)}`}
      >
        {herramientasFiltradas.length > 0 ? (
          herramientasFiltradas.map((item) => (
            <div key={item.id} className="flex justify-between text-sm border-b py-1">
              <span>{item.descripcion}</span>
              <span>
                {item.cantidad} × {formatoMoneda(Number(item.depreciacion_bs_hora || 0))}
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm italic text-center py-2">Sin registros</p>
        )}
      </Accordion>

      {/* === Mano de Obra === */}
      <Accordion
        title={`Mano de Obra (${manoObraFiltrada.length})`}
        subtitle={`Total: ${formatoMoneda(manoObraTotal)}`}
      >
        {manoObraFiltrada.length > 0 ? (
          <>
            {manoObraFiltrada.map((item) => (
              <div key={item.id} className="flex justify-between text-sm border-b py-1">
                <span>{item.descripcion}</span>
                <span>
                  {item.cantidad} × {formatoMoneda(Number(item.precio_unitario || 0))}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-medium border-t mt-2 pt-2">
              <span>$15.00 / Día BONO ALIMENTICIO</span>
              <span>{formatoMoneda(bonoAlimentacion)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>200% (Prestaciones Sociales)</span>
              <span>{formatoMoneda(prestacionesSociales)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t pt-1">
              <span>TOTAL MANO DE OBRA</span>
              <span>{formatoMoneda(manoObraTotal)}</span>
            </div>
          </>
        ) : (
          <p className="text-gray-400 text-sm italic text-center py-2">Sin registros</p>
        )}
      </Accordion>

      {/* === Logística === */}
      <Accordion
        title={`Logística (${logisticaFiltrada.length})`}
        subtitle={`Total: ${formatoMoneda(logisticaTotal)}`}
      >
        {logisticaFiltrada.length > 0 ? (
          logisticaFiltrada.map((item) => (
            <div key={item.id} className="flex justify-between text-sm border-b py-1">
              <span>{item.descripcion}</span>
              <span>
                {item.cantidad} × {formatoMoneda(Number(item.precio_unitario || 0))}
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm italic text-center py-2">Sin registros</p>
        )}
      </Accordion>
    </div>
  );
};

export default TotalesAccordions;