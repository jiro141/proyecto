import React, { useEffect } from "react";
import ClienteCard from "../components/ClienteCard";
import DescripcionCard from "../components/DescripcionCard";
import CalendarioCard from "../components/CalendarioCard";
import ControlCard from "../components/ControlCard";
import ProductividadCard from "../components/ProductividadCard";
import PresupuestoCard from "../components/PresupuestoCard";

/**
 * 🧩 Etapa1 – Datos Generales del Presupuesto
 * Conectada con el formData global del layout principal.
 */
export default function Etapa1({ formData, setFormData }) {
  // ================================
  // HANDLERS DE CAMPOS PRINCIPALES
  // ================================
  const handleClienteSelect = (cliente) => {
    setFormData((prev) => ({
      ...prev,
      cliente,
    }));
  };

  const handleDescripcionChange = (descripcion) => {
    setFormData((prev) => ({
      ...prev,
      descripcion,
    }));
  };

  const handleFechaChange = (fecha) => {
    setFormData((prev) => ({
      ...prev,
      fechaCulminacion: fecha,
    }));
  };

  const handleProductividadChange = (valor) => {
    setFormData((prev) => ({
      ...prev,
      porcentaje_productividad: valor / 100, // el card devuelve 0–100, guardamos 0–1
    }));
  };

  const handlePresupuestoChange = (valor) => {
    setFormData((prev) => ({
      ...prev,
      presupuesto_base: Number(valor) || 0,
    }));
  };

  // ================================
  // AUTO-CÁLCULO DEL PRESUPUESTO TOTAL
  // ================================
  useEffect(() => {
    const calcularCostoMateriales = (lista = []) =>
      lista.reduce((acc, item) => {
        const precio = Number(item.precio || item.costo_unitario || 0);
        const cantidad = Number(item.cantidad || 0);
        return acc + precio * cantidad;
      }, 0);

    const totalMateriales =
      calcularCostoMateriales(formData.epps) +
      calcularCostoMateriales(formData.stock_almacen) +
      calcularCostoMateriales(formData.consumibles);

    const total = totalMateriales + Number(formData.presupuesto_base || 0);

    setFormData((prev) => ({
      ...prev,
      presupuesto_estimado: Number(total.toFixed(2)),
    }));
  }, [
    formData.epps,
    formData.stock_almacen,
    formData.consumibles,
    formData.presupuesto_base,
    setFormData,
  ]);

  // ================================
  // RENDER UI
  // ================================
  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-8">
      {/* === CLIENTE + PRODUCTIVIDAD === */}
      <div className="col-span-2 grid grid-cols-2 gap-6">
        <ClienteCard
          onClienteSelect={handleClienteSelect}
          defaultCliente={formData.cliente}
        />
        <ProductividadCard
          defaultValue={(formData.porcentaje_productividad || 0.75) * 100}
          onChange={handleProductividadChange}
        />
      </div>

      {/* === DESCRIPCIÓN + PRESUPUESTO === */}
      <div className="col-span-2 grid grid-cols-2 gap-6">
        <DescripcionCard
          descripcion={formData.descripcion}
          onDescripcionChange={handleDescripcionChange}
        />
        <PresupuestoCard
          defaultValue={formData.presupuesto_base || 0}
          calculado={formData.presupuesto_estimado || 0}
          onChange={handlePresupuestoChange}
        />
      </div>

      {/* === CONTROL CARD (N° Control / Config) === */}
      <div className="col-start-3 row-start-1">
        <ControlCard />
      </div>

      {/* === FECHA ESTIMADA === */}
      <div className="col-start-3 row-start-2">
        <CalendarioCard
          fecha={formData.fechaCulminacion}
          onFechaChange={handleFechaChange}
        />
      </div>
    </div>
  );
}
