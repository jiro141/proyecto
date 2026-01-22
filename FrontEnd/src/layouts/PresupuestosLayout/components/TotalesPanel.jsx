import React, { useMemo, useEffect } from "react";
import Accordion from "../../../components/Accordion";
import { FaFileInvoiceDollar } from "react-icons/fa";
import TableHeader from "./TableHeader";
import { usePresupuesto } from "../../../context/PresupuestoContext";

const TotalesPanel = ({ apuIndex }) => {
  const { formData, setFormData, currentAPUIndex } = usePresupuesto();

  // ✅ Si no viene apuIndex (Etapa 2), usamos el actual del contexto
  const effectiveIndex = typeof apuIndex === "number" ? apuIndex : currentAPUIndex;

  const apus = formData?.apus || [];
  const apuActual = apus[effectiveIndex] || {};
  const materiales = apuActual.materiales || {};
  const rendimiento = Number(apuActual.body?.rendimiento || 1) || 1;

  const {
    stock_almacen = [],
    consumibles = [],
    epps = [],
  } = materiales;

  const {
    herramientas = [],
    mano_obra = [],
    logistica = [],
  } = apuActual || {};

  // 🧩 Tomar presupuesto directamente desde el body del APU
  const presupuesto_base = Number(apuActual.body?.totalUnitario || 0);
  const porcentaje_desp = Number(apuActual.body?.porcentaje_desp || 0);

  // ===============================
  // 🧮 Función genérica de subtotal
  // ===============================
  const calcularSubtotal = (items) =>
    items.reduce((acc, item) => {
      const costo = Number(item.costo || item.precio_unitario || 0);
      const cantidad = Number(item.cantidad || 0);
      const desp = Number(item.desp || 0);
      return acc + cantidad * (1 + desp / 100) * costo;
    }, 0);

  // ===============================
  // 🔢 Cálculos principales (memoizados)
  // ===============================
  const {
    eppTotal,
    materialesTotal,
    herramientasTotal,
    manoObraTotal,
    logisticaTotal,
    bonoAlimentacion,
    prestacionesSociales,
    grandTotal,
    totalUnitario,
    costoPorUnidad,
    costoDirectoPorUnidad,
    adminYGastos,
    subTotal,
    utilidad,
    presupuestoConDesp,
    herramientasPorRendimiento
  } = useMemo(() => {
    const eppTotal = calcularSubtotal(epps);
    const materialesTotal = calcularSubtotal([...stock_almacen, ...consumibles]);
    const herramientasTotal = calcularSubtotal(herramientas);
    const herramientasPorRendimiento = herramientasTotal / rendimiento;

    const manoObraBaseTotal = calcularSubtotal(mano_obra);
    const logisticaTotal = calcularSubtotal(logistica);

    const totalDiasTrabajados = mano_obra.reduce(
      (acc, item) => acc + Number(item.cantidad || 0),
      0
    );
    const manoObraBase = manoObraBaseTotal + logisticaTotal;
    const bonoAlimentacion = totalDiasTrabajados * 15;
    const prestacionesSociales = manoObraBase * 2;
    const manoObraTotal = manoObraBase + bonoAlimentacion + prestacionesSociales;

    const grandTotal =
      eppTotal + materialesTotal + herramientasPorRendimiento + manoObraTotal + logisticaTotal;

    // 💰 Presupuesto base con % de desperdicio
    const presupuestoConDesp = presupuesto_base * (1 + porcentaje_desp / 100);

    const costoPorUnidad = rendimiento
      ? manoObraTotal / rendimiento
      : manoObraTotal;

    const costoDirectoPorUnidad =
      costoPorUnidad +
      materialesTotal +
      herramientasPorRendimiento ;

    const adminYGastos = costoDirectoPorUnidad * 0.15;
    const subTotal = costoDirectoPorUnidad + adminYGastos;
    const utilidad = subTotal * 0.15;
    const totalUnitario = subTotal + utilidad;

    return {
      eppTotal,
      materialesTotal,
      herramientasTotal,
      manoObraTotal,
      logisticaTotal,
      bonoAlimentacion,
      prestacionesSociales,
      grandTotal,
      totalUnitario,
      costoPorUnidad,
      costoDirectoPorUnidad,
      adminYGastos,
      subTotal,
      utilidad,
      presupuestoConDesp,
      herramientasPorRendimiento
    };
  }, [
    epps,
    stock_almacen,
    consumibles,
    herramientas,
    mano_obra,
    logistica,
    rendimiento,
    presupuesto_base,
    porcentaje_desp,
  ]);
  // 🔁 Sincroniza el totalUnitario calculado con el body del APU en formData
  useEffect(() => {
    if (!formData?.apus || !formData.apus[effectiveIndex]) return;

    const apuActual = formData.apus[effectiveIndex];
    const cantidad = Number(apuActual.body?.cantidad || 0);
    const nuevoPresupuesto = (totalUnitario * cantidad) || 0;

    // 💰 Redondea a 2 decimales
    const presupuestoRedondeado = Number(nuevoPresupuesto.toFixed(2));

    // ⚙️ Evita bucles: solo actualiza si el valor cambió realmente
    if (apuActual.body?.presupuesto_base !== presupuestoRedondeado) {
      const updatedFormData = structuredClone(formData);
      updatedFormData.apus[effectiveIndex].body.presupuesto_base = presupuestoRedondeado;
      setFormData(updatedFormData);
    }
  }, [totalUnitario, effectiveIndex, formData.apus, setFormData]);





  const formatoMoneda = (valor) =>
    valor.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });

  // Antes del return, en tu componente:
  const herramientasFiltradas = herramientas.filter(
    (item) => Number(item.cantidad) > 0
  );

  const manoObraFiltrada = mano_obra.filter(
    (item) => Number(item.cantidad) > 0
  );

  const logisticaFiltrada = logistica.filter(
    (item) => Number(item.cantidad) > 0
  );

  // ===============================
  // 🧾 Render UI
  // ===============================
  return (
    <div className="relative bg-white shadow-md rounded-lg p-5 pt-10 flex flex-col h-full min-h-[calc(65vh-8rem)]">
      <TableHeader icon={<FaFileInvoiceDollar />} titulo="Resumen de Costos" etapa={apuIndex} />

      {/* Contenedor principal en dos columnas: Totales (izquierda) y Acordeones (derecha) */}
      <div className="mt-4 flex flex-col md:flex-row gap-4">
        {/* === Totales finales (IZQUIERDA) === */}
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
            <div className="flex justify-between font-bold  text-[#0B2C4D]">
              <span>Total Logística</span>
              <span>{formatoMoneda(logisticaTotal)}</span>
            </div>

            {/* 🔹 Detalle Mano de Obra */}
            <div className="flex justify-between font-medium text-[#0B2C4D] mt-2">
              <span>Bono Alimenticio ($15 × Días Trabajados)</span>
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
            <div className="flex justify-between font-medium mt-2">
              <span>Presupuesto Base + % Desperdicio</span>
              <span>{formatoMoneda(presupuestoConDesp)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Costo por unidad (MO ÷ Rendimiento)</span>
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


        {/* ACORDEONES (DERECHA) */}
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
                    {item.cantidad} × {formatoMoneda(Number((1 + item.desp / 100) * item.costo) || 0)}
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
                    {item.cantidad} × {formatoMoneda(item.costo)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm italic text-center py-2">
                Sin registros
              </p>
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
                      {item.cantidad} × {formatoMoneda(item.costo)}
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
              <p className="text-gray-400 text-sm italic text-center py-2">
                Sin registros
              </p>
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
                    {item.cantidad} × {formatoMoneda(item.costo)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm italic text-center py-2">
                Sin registros
              </p>
            )}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default TotalesPanel;
