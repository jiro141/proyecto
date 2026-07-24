import React, { useState } from "react";
import Modal from "../../../components/Modal";
import { usePresupuesto } from "../../../context/PresupuestoContext";
import { updateAPUPorcentajeAdmin } from "../../../api/controllers/Presupuesto";
import { toast } from "react-toastify";

const formatoMoneda = (valor) => {
  const numero = Number(valor ?? 0);
  if (isNaN(numero)) return "$0,00";
  return `$${numero.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
  porcentajeAdmin = 15,
  apuId,
  effectiveIndex,
}) => {
  const { updateAPU } = usePresupuesto();
  const [modalOpen, setModalOpen] = useState(false);
  const [porcentajeInput, setPorcentajeInput] = useState(porcentajeAdmin);
  const [guardando, setGuardando] = useState(false);

  const abrirModal = () => {
    setPorcentajeInput(porcentajeAdmin);
    setModalOpen(true);
  };

  const guardarPorcentaje = async () => {
    const nuevoPorcentaje = Math.max(0, Math.min(100, Number(porcentajeInput) || 0));

    // 1️⃣ Guardar en contexto (y localStorage automáticamente)
    updateAPU(effectiveIndex, {
      porcentaje_administracion: nuevoPorcentaje,
    });

    // 2️⃣ Si el APU ya existe en backend, persistir
    if (apuId) {
      setGuardando(true);
      try {
        await updateAPUPorcentajeAdmin(apuId, nuevoPorcentaje);
        toast.success(`Porcentaje actualizado a ${nuevoPorcentaje}%`);
      } catch (error) {
        toast.error("Error al guardar en el servidor");
      } finally {
        setGuardando(false);
      }
    } else {
      toast.success(`Porcentaje actualizado a ${nuevoPorcentaje}%`);
    }

    setModalOpen(false);
  };

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

        {/* 🔹 Administración y gastos — clickeable */}
        <div className="flex justify-between font-medium group">
          <span
            className="text-blue-600 cursor-pointer hover:text-blue-800 hover:underline transition-colors"
            onClick={abrirModal}
            title="Haz clic para editar el porcentaje"
          >
            {porcentajeAdmin}% Administración y gastos
          </span>
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

      {/* 🟦 Modal para editar porcentaje */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Editar % de Administración y Gastos"
        width="max-w-sm"
      >
        <div className="space-y-4 p-2">
          <p className="text-sm text-gray-600">
            Define el porcentaje de gastos administrativos para este APU.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Porcentaje (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={porcentajeInput}
              onChange={(e) => setPorcentajeInput(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-center text-lg font-bold"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={guardarPorcentaje}
              disabled={guardando}
              className="bg-[#0B2C4D] hover:bg-[#143D68] text-white px-4 py-2 rounded text-sm disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TotalesSidebar;