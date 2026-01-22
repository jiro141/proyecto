import { useState, useEffect, useRef } from "react";
import { FaMoneyBillWave } from "react-icons/fa";
import { usePresupuesto } from "../../../context/PresupuestoContext";

export default function PresupuestoCard({ label = "Presupuesto Estimado (USD)" }) {
  const { formData, currentAPUIndex, updateAPUField } = usePresupuesto();
  const apuActual = formData.apus?.[currentAPUIndex] || {};

  const [presupuesto, setPresupuesto] = useState(Number(apuActual.body?.presupuesto_base || 0));
  const [depreciacion, setDepreciacion] = useState(Number(apuActual.body?.depreciacion || 0));

  const [presupuestoTotal, setPresupuestoTotal] = useState(0);

  const isUserEditing = useRef(false);

  // 🧮 Recalcular total con % incluido
  useEffect(() => {
    const totalConDesp = presupuesto * (1 + depreciacion / 100);
    setPresupuestoTotal(totalConDesp);
  }, [presupuesto, depreciacion]);


  // ✅ Actualiza el APU actual en el contexto si el usuario editó
  useEffect(() => {
    if (!isUserEditing.current) return;
    updateAPUField("presupuesto_base", presupuesto);
    updateAPUField("depreciacion", depreciacion);
    isUserEditing.current = false;
  }, [presupuesto, depreciacion]);

  // 🔁 Escucha cambios externos del contexto (cuando se cambia de APU)
  useEffect(() => {
    const base = Number(apuActual.body?.presupuesto_base || 0);
    const desp = Number(apuActual.body?.depreciacion || 0);
    if (base !== presupuesto || desp !== depreciacion) {
      setPresupuesto(base);
      setDepreciacion(desp);
    }
  }, [apuActual.body?.presupuesto_base, apuActual.body?.depreciacion]);


  const formatoMoneda = (valor) =>
    valor.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });

  return (
    <div
      className="relative bg-white shadow-md rounded-lg p-5 pt-10 transition-all duration-200 flex flex-col justify-between"
      style={{ minHeight: "220px", maxHeight: "220px" }}
    >
      <div
        className="absolute -top-4 left-5 w-12 h-12 flex items-center justify-center rounded-lg z-[5] shadow-md"
        style={{ backgroundColor: "#0B2C4D", color: "white" }}
      >
        <FaMoneyBillWave size={20} />
      </div>

      <p className="text-sm text-gray-500 mb-3">{label}</p>

      <div className="flex flex-row gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-400">Presupuesto Base</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={presupuesto}
            onChange={(e) => {
              isUserEditing.current = true;
              setPresupuesto(parseFloat(e.target.value) || 0);
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Ingrese el presupuesto estimado"
          />
        </div>

        <div className="w-1/3">
          <label className="text-xs text-gray-400">% Desperdicio / Margen</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={depreciacion}
            onChange={(e) => {
              isUserEditing.current = true;
              setDepreciacion(parseFloat(e.target.value) || 0);
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Ej: 10"
          />
        </div>
      </div>

      <p className="mt-4 text-lg font-semibold text-gray-800 text-right">
        {formatoMoneda(presupuestoTotal)}
      </p>
    </div>
  );
}
