import React, { useState, useEffect } from "react";
import { useEtapa2Logic } from "../hooks/useEtapa2Logic";
import { usePresupuesto } from "../../../context/PresupuestoContext";
import TotalesPanel from "../components/TotalesPanel";
import Etapa2HeaderGrid from "../components/Etapa2HeaderGrid";
import Etapa2ActionButtons from "../components/Etapa2ActionButtons";
import Etapa2Modals from "../components/Etapa2Modals";
import presupuestoInicial from "../components/presupuestoInicial.json";

export const Etapa2 = ({ onStockInsuficiente, etapa }) => {
  // 🧠 Hook con toda la lógica de inventario, búsqueda y modales
  const {
    searchStock,
    setSearchStock,
    searchCons,
    setSearchCons,
    openModal,
    setOpenModal,
    stock,
    consumibles,
    loadingStock,
    loadingCons,
    errorStock,
    errorCons,
    refetchStock,
    refetchCons,
    handleCantidadChange,
    handleTotalChange,
  } = useEtapa2Logic();

  // 🧩 Hook del contexto Presupuesto
  const {
    formData,
    currentAPUIndex,
    setCurrentAPUIndex,
    addAPU,
  } = usePresupuesto();

  // 💰 Estado local de presupuesto
  const [presupuestoData, setPresupuestoData] = useState(presupuestoInicial);
  const [totales, setTotales] = useState({ grandTotal: 0 });

  // 🔄 Recalcular total general al cambiar datos
  useEffect(() => {
    const totalGeneral =
      (presupuestoData.herramientas_total || 0) +
      (presupuestoData.mano_obra_total || 0);
    setTotales({ grandTotal: totalGeneral });
  }, [presupuestoData]);

  // ➕ Crear nuevo APU
  const handleNuevoAPU = () => addAPU();

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* === Cabecera con descripción, rendimiento y cantidades === */}
      <Etapa2HeaderGrid />

      {/* === Selector del APU activo + botón === */}
      <div className="flex items-center justify-between mb-6 px-12">
        <div className="flex items-center gap-3 w-full max-w-xl">
          <label className="font-semibold text-sm text-gray-700 tracking-wide whitespace-nowrap">
            A.P.U. activo:
          </label>

          <div className="relative flex-1">
            <select
              className="w-full border border-gray-300 bg-white rounded-lg pl-4 pr-8 py-2 text-sm text-gray-700 shadow-sm focus:ring-2 focus:ring-[#0B2C4D]"
              value={currentAPUIndex}
              onChange={(e) => setCurrentAPUIndex(Number(e.target.value))}
            >
              {formData.apus.map((apu, i) => (
                <option key={i} value={i}>
                  {apu.body?.descripcion?.trim() || `A.P.U. ${i + 1}`}
                </option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500 text-xs">
              ▼
            </span>
          </div>
        </div>

        <button
          onClick={handleNuevoAPU}
          className="flex items-center gap-1 bg-[#0B2C4D] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#143a61] transition duration-150 ease-in-out shadow-sm whitespace-nowrap"
        >
          <span className="text-lg leading-none">＋</span>
          Nuevo APU
        </button>
      </div>

      {/* === Sección principal === */}
      <div className="flex flex-grow gap-8">
        {/* TotalesPanel ocupa el 70% a la izquierda */}
        <div className="w-[70%]">
          <TotalesPanel
            formData={formData}
            presupuestoData={presupuestoData}
            onUpdateTotals={setTotales}
            etapa={etapa}
          />
        </div>

        {/* Botones a la derecha ocupando el 30% restante */}
        <div className="w-[30%] flex flex-col justify-start">
          <Etapa2ActionButtons setOpenModal={setOpenModal} />
        </div>
      </div>





      {/* === Modales: Stock, Consumibles, Mano de Obra, etc. === */}
      <Etapa2Modals
        openModal={openModal}
        setOpenModal={setOpenModal}
        stock={stock}
        consumibles={consumibles}
        loadingStock={loadingStock}
        loadingCons={loadingCons}
        errorStock={errorStock}
        errorCons={errorCons}
        refetchStock={refetchStock}
        refetchCons={refetchCons}
        onStockInsuficiente={onStockInsuficiente}
        presupuestoData={presupuestoData}
        setPresupuestoData={setPresupuestoData}
        handleCantidadChange={handleCantidadChange}
        handleTotalChange={handleTotalChange}
      />
    </div>
  );
};
