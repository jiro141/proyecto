import React, { useMemo, useEffect } from "react";
import { FaFileInvoiceDollar } from "react-icons/fa";
import TableHeader from "./TableHeader";
import TotalesSidebar from "./TotalesSidebar";
import TotalesAccordions from "./TotalesAccordions";
import { usePresupuesto } from "../../../context/PresupuestoContext";

const TotalesPanel = ({ apuIndex, hideAccordions }) => {
  const { formData, currentAPUIndex, updateAPU, loading } = usePresupuesto();

  // ✅ Si no viene apuIndex (Etapa 2), usamos el actual del contexto
  const effectiveIndex = typeof apuIndex === "number" ? apuIndex : currentAPUIndex;

  // ✅ Esperar a que cargue la hidratación
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando datos del presupuesto...</div>
      </div>
    );
  }

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

  // 🧩 Tomar presupuesto_base del body del APU
  const presupuesto_base = Number(apuActual.body?.presupuesto_base || 0);
  const cantidad = Number(apuActual.body?.cantidad || 1);

  // ===============================
  // 🧮 Función genérica de subtotal
  // ===============================
  const calcularSubtotal = (items) =>
    items.reduce((acc, item) => {
      const costo = Number(item.costo || item.precio_unitario || 0);
      const cant = Number(item.cantidad || 0);
      const desp = Number(item.desp || 0);
      return acc + cant * (1 + desp / 100) * costo;
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
    totalUnitario,
    costoPorUnidad,
    costoDirectoPorUnidad,
    adminYGastos,
    subTotal,
    utilidad,
    herramientasPorRendimiento
  } = useMemo(() => {
    const eppTotal = calcularSubtotal(epps);
    const materialesTotal = calcularSubtotal([...stock_almacen, ...consumibles]);
    const herramientasTotal = calcularSubtotal(herramientas);
    const herramientasPorRendimiento = herramientasTotal / rendimiento;

    // ✅ Cálculos siguiendo sistema viejo:
    // Mano de obra base = suma de mano de obra (sin logística)
    const manoObraBaseTotal = calcularSubtotal(mano_obra);
    const logisticaTotal = calcularSubtotal(logistica);

    // Total días trabajados (solo mano de obra)
    const totalDiasTrabajados = mano_obra.reduce(
      (acc, item) => acc + Number(item.cantidad || 0),
      0
    );
    
    // Bono alimenticio: $15 × días trabajados
    const bonoAlimentacion = totalDiasTrabajados * 15;
    
    // ✅ Prestaciones: 200% del (manoObraBaseTotal + bonoAlimenticio)
    const prestacionesSociales = (manoObraBaseTotal + bonoAlimentacion) * 2;
    
    // ✅ Total mano de obra (como sistema viejo): base + bono + prestaciones + logística
    const manoObraTotal = manoObraBaseTotal + bonoAlimentacion + prestacionesSociales + logisticaTotal;

    // ✅ Costo por unidad = manoObraTotal / rendimiento (sin logística)
    const costoPorUnidad = rendimiento
      ? manoObraTotal / rendimiento
      : manoObraTotal;

    // ✅ Costo directo por unidad = costoPorUnidad + materiales + herramientas (sin logística)
    const costoDirectoPorUnidad =
      costoPorUnidad + materialesTotal + herramientasPorRendimiento;

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
      totalUnitario,
      costoPorUnidad,
      costoDirectoPorUnidad,
      adminYGastos,
      subTotal,
      utilidad,
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
    cantidad,
  ]);

  // 🔁 Sincroniza el presupuesto_base con el totalUnitario calculado (sin multiplicar por cantidad)
  useEffect(() => {
    if (!formData?.apus?.[effectiveIndex]) return;

    const apuActual = formData.apus[effectiveIndex];
    // ✅ Solo el totalUnitario, sin multiplicar por cantidad
    const nuevoPresupuesto = Number(totalUnitario.toFixed(2));

    if (apuActual.body?.presupuesto_base !== nuevoPresupuesto) {
      updateAPU(effectiveIndex, {
        body: {
          ...apuActual.body,
          presupuesto_base: nuevoPresupuesto,
        },
      });
    }
  }, [totalUnitario, effectiveIndex, formData?.apus, updateAPU]);

  // Filtrar items con cantidad > 0
  const herramientasFiltradas = herramientas.filter(
    (item) => Number(item.cantidad) > 0
  );
  const manoObraFiltrada = mano_obra.filter(
    (item) => Number(item.cantidad) > 0
  );
  const logisticaFiltrada = logistica.filter(
    (item) => Number(item.cantidad) > 0
  );

  return (
    <div className="relative bg-white shadow-md rounded-lg p-5 pt-10 flex flex-col h-full min-h-[calc(65vh-8rem)]">
      <TableHeader icon={<FaFileInvoiceDollar />} titulo="Resumen de Costos" etapa={apuIndex} />

      <div className="mt-4 flex flex-col md:flex-row gap-4">
        {/* === Totales finales (IZQUIERDA) === */}
        <TotalesSidebar
          materialesTotal={materialesTotal}
          herramientasPorRendimiento={herramientasPorRendimiento}
          logisticaTotal={logisticaTotal}
          bonoAlimentacion={bonoAlimentacion}
          prestacionesSociales={prestacionesSociales}
          manoObraTotal={manoObraTotal}
          costoPorUnidad={costoPorUnidad}
          costoDirectoPorUnidad={costoDirectoPorUnidad}
          adminYGastos={adminYGastos}
          subTotal={subTotal}
          utilidad={utilidad}
          totalUnitario={totalUnitario}
        />

        {/* === ACORDEONES (DERECHA) === */}
        {!hideAccordions && (
          <TotalesAccordions
            stock_almacen={stock_almacen}
            consumibles={consumibles}
            materialesTotal={materialesTotal}
            herramientasFiltradas={herramientasFiltradas}
            herramientasPorRendimiento={herramientasPorRendimiento}
            manoObraFiltrada={manoObraFiltrada}
            manoObraTotal={manoObraTotal}
            bonoAlimentacion={bonoAlimentacion}
            prestacionesSociales={prestacionesSociales}
            logisticaFiltrada={logisticaFiltrada}
            logisticaTotal={logisticaTotal}
          />
        )}
      </div>
    </div>
  );
};

export default TotalesPanel;