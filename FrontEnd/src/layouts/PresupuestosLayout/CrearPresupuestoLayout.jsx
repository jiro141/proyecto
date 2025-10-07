import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "../../components/Modal";

import useReportes from "../../hooks/useReportes";
import { createReporte } from "../../api/controllers/Presupuesto";
import { getControlConfig } from "../../api/controllers/ControlConfig";

// 🧩 Componentes
import Etapa1 from "./steps/Etapa1";
import { Etapa2 } from "./steps/Etapa2";
import Etapa3 from "./steps/Etapa3";

export default function CrearPresupuestoLayout() {
  const { refetch: refetchReportes } = useReportes();

  // ================================
  // ESTADOS PRINCIPALES
  // ================================
  const [etapa, setEtapa] = useState(1);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [lockModal, setLockModal] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [numeroControl, setNumeroControl] = useState("");

  // ================================
  // FORM DATA (Datos de todas las etapas)
  // ================================
  const [formData, setFormData] = useState({
    cliente: null,
    descripcion: "",
    fechaCulminacion: new Date(),
    stock_almacen: [],
    consumibles: [],
    epps: [],
    presupuesto_base: 0,
    presupuesto_estimado: 0,
    porcentaje_productividad: 0.75,
  });

  // ================================
  // CONSULTAR NÚMERO DE CONTROL
  // ================================
  useEffect(() => {
    const fetchNumeroControl = async () => {
      toast.dismiss();
      try {
        const data = await getControlConfig();
        if (data?.punto_inicio) {
          setNumeroControl(data.punto_inicio);
          setLockModal(false);
        } else {
          setModalOpen(true);
          setLockModal(true);
          toast.warning("No existe un número de control configurado.");
        }
      } catch (error) {
        console.error("Error al obtener el número de control:", error);
        setModalOpen(true);
        setLockModal(true);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchNumeroControl();
  }, []);

  // ================================
  // AUTO-CÁLCULO DEL PRESUPUESTO TOTAL
  // ================================
  useEffect(() => {
    const calcularCosto = (lista = []) =>
      lista.reduce((acc, item) => {
        const precio = Number(item.precio || item.costo_unitario || 0);
        const cantidad = Number(item.cantidad || 0);
        return acc + precio * cantidad;
      }, 0);

    const totalMateriales =
      calcularCosto(formData.epps) +
      calcularCosto(formData.stock_almacen) +
      calcularCosto(formData.consumibles);

    const totalFinal = totalMateriales + Number(formData.presupuesto_base || 0);

    setFormData((prev) => ({
      ...prev,
      presupuesto_estimado: Number(totalFinal.toFixed(2)),
    }));
  }, [
    formData.epps,
    formData.stock_almacen,
    formData.consumibles,
    formData.presupuesto_base,
  ]);

  // ================================
  // CALLBACK: STOCK INSUFICIENTE
  // ================================
  const handleStockInsuficiente = (tipo, producto) => {
    toast.warning(
      `${
        tipo === "stock"
          ? "Ferretería"
          : tipo === "EPP"
          ? "E.P.P."
          : "Consumibles"
      }: stock insuficiente. Se añadió a la lista de proveedores.`,
      { position: "top-right", autoClose: 2500 }
    );
  };

  // ================================
  // CREAR REPORTE FINAL
  // ================================
  const handleCreateReporte = async (presupuestoConProductividad) => {
    if (!formData.cliente)
      return toast.error("Debe seleccionar un cliente antes de guardar.");

    try {
      const fechaActual = new Date().toISOString().split("T")[0];
      const fechaCulminacion = new Date(formData.fechaCulminacion)
        .toISOString()
        .split("T")[0];

      const payload = {
        cliente: formData.cliente?.id,
        fecha: fechaActual,
        stock_almacen: formData.stock_almacen.map((i) => i.id),
        consumibles: formData.consumibles.map((i) => i.id),
        epps: formData.epps.map((i) => i.id),
        presupuesto_estimado: Number(presupuestoConProductividad.toFixed(2)), // ✅ valor recibido desde Etapa3
        porcentaje_productividad: formData.porcentaje_productividad,
        lugar: formData.cliente?.direccion || "Sin dirección registrada",
        fecha_estimacion_culminacion: fechaCulminacion,
        observaciones: formData.descripcion || "Nuevo presupuesto",
        aprobado: false,
      };

      console.log("📦 Payload final enviado:", payload);

      if (!payload.cliente)
        return toast.error("El cliente seleccionado no tiene ID válido.");

      await createReporte(payload);
      refetchReportes();
      toast.success("Presupuesto creado correctamente ");
    } catch (error) {
      console.error("Error al crear el presupuesto:", error);
      toast.error("Error al crear el presupuesto ");
    }
  };

  // ================================
  // NAVEGACIÓN ENTRE ETAPAS
  // ================================
  const nextStep = () => etapa < 3 && setEtapa(etapa + 1);
  const prevStep = () => etapa > 1 && setEtapa(etapa - 1);

  if (loadingConfig) return <p className="p-6">Cargando configuración...</p>;

  // ================================
  // RENDER
  // ================================
  return (
    <div className="relative p-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />

      {/* ENCABEZADO DE ETAPAS */}
      <div className="flex items-center justify-center gap-12 mb-4 -mt-6">
        {[
          { num: 1, label: "Datos Generales" },
          { num: 2, label: "Materiales" },
          { num: 3, label: "Confirmación" },
        ].map(({ num, label }) => (
          <div key={num} className="flex flex-col items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-bold shadow-md transition-all ${
                etapa === num
                  ? "bg-[#0B2C4D] scale-110 shadow-lg"
                  : "bg-gray-300 scale-100"
              }`}
            >
              {num}
            </div>
            <p
              className={`mt-2 text-sm font-medium ${
                etapa === num ? "text-[#0B2C4D]" : "text-gray-500"
              }`}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* CONTENIDO DE ETAPAS */}
      {etapa === 1 && <Etapa1 formData={formData} setFormData={setFormData} />}
      {etapa === 2 && (
        <Etapa2
          formData={formData}
          setFormData={setFormData}
          onStockInsuficiente={handleStockInsuficiente}
        />
      )}
      {etapa === 3 && (
        <Etapa3 formData={formData} onCreate={handleCreateReporte} />
      )}

      {/* BOTONES DE NAVEGACIÓN */}
      <div className="flex justify-between mt-8">
        {etapa > 1 ? (
          <button
            onClick={prevStep}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
          >
            ← Anterior
          </button>
        ) : (
          <span></span>
        )}

        {etapa < 3 && (
          <button
            onClick={nextStep}
            className="bg-[#0B2C4D] hover:bg-[#123b65] text-white px-4 py-2 rounded-lg"
          >
            Siguiente →
          </button>
        )}
      </div>
    </div>
  );
}
