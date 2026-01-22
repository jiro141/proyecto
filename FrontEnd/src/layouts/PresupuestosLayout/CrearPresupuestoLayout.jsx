import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "../../components/Modal";
import { FaFileDownload } from "react-icons/fa";
import { PDFDownloadLink } from "@react-pdf/renderer";

import useReportes from "../../hooks/useReportes";
import { createReporte } from "../../api/controllers/Presupuesto";
import { getControlConfig } from "../../api/controllers/ControlConfig";

// 🧩 Componentes
import Etapa1 from "./steps/Etapa1";
import { Etapa2 } from "./steps/Etapa2";
import Etapa3 from "./steps/Etapa3";
import PresupuestoPDF from "./components/PresupuestoPDF"; // ✅ import correcto
import logo from "../../assets/img/logo.png";

export default function CrearPresupuestoLayout() {
  const { refetch: refetchReportes } = useReportes();

  const [etapa, setEtapa] = useState(1);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [lockModal, setLockModal] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [numeroControl, setNumeroControl] = useState("");
  const [modalDescarga, setModalDescarga] = useState(false);
  const [resumen, setResumen] = useState(null);
  const [guardarBorradorEtapa1, setGuardarBorradorEtapa1] = useState(null);

  const [formData, setFormData] = useState({
    // 🧾 Datos generales del reporte
    cliente: null,
    descripcion: "",
    fechaCulminacion: new Date(),
    n_presupuesto: null,

    // 📊 Configuración base
    presupuesto_base: 0,
    presupuesto_estimado: 0,
    porcentaje_productividad: 0.75, // 0–1

    // 🧱 Lista de APUs (cada uno tiene sus propios datos)
    apus: [
      {
        body: {
          descripcion: "",
          rendimiento: 0.75,
          unidad: "PZA",
          cantidad: 1,
          depreciacion: 0,
        },
        materiales: {
          stock_almacen: [], // [{ stock_id, cantidad, desperdicio }]
          consumibles: [],   // [{ consumible_id, cantidad, desperdicio }]
          epps: [],           // [{ stock_id, cantidad, desperdicio }]
        },
        mano_obra: [],        // [{ descripcion, unidad, cantidad, precio_unitario }]
        herramientas: [],     // [{ descripcion, unidad, cantidad, precio_unitario }]
        logistica: [],        // [{ descripcion, unidad, cantidad, precio_unitario }]
      },
    ],
  });

  // ================================
  // CONSULTAR CONFIGURACIÓN INICIAL
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
  // AUTO-CÁLCULO DEL PRESUPUESTO
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
        presupuesto_estimado: Number(presupuestoConProductividad.toFixed(2)),
        porcentaje_productividad: formData.porcentaje_productividad,
        lugar: formData.cliente?.direccion || "Sin dirección registrada",
        fecha_estimacion_culminacion: fechaCulminacion,
        observaciones: formData.descripcion || "Nuevo presupuesto",
        aprobado: false,
      };

      const response = await createReporte(payload);
      if (response) {
        toast.success("Presupuesto creado correctamente");
        refetchReportes();
        setResumen({
          presupuesto_base: formData.presupuesto_base,
          totalMateriales:
            formData.presupuesto_estimado - formData.presupuesto_base,
          totalConProductividad: presupuestoConProductividad,
          factorAjuste: 1 - formData.porcentaje_productividad,
        });
        setModalDescarga(true);
      } else {
        toast.error("Hubo un problema al crear el presupuesto");
      }
    } catch (error) {
      console.error("Error al crear el presupuesto:", error);
      toast.error("Error al crear el presupuesto");
    }
  };

  // ================================
  // NAVEGACIÓN
  // ================================
  const nextStep = () => etapa < 3 && setEtapa(etapa + 1);
  const prevStep = () => etapa > 1 && setEtapa(etapa - 1);

  if (loadingConfig) return <p className="p-6">Cargando configuración...</p>;
  const handleStockInsuficiente = (tipo, producto) => {
    toast.warning(
      `${tipo === "stock"
        ? "Ferretería"
        : tipo === "EPP"
          ? "E.P.P."
          : "Consumibles"
      }: stock insuficiente. Se añadió a la lista de proveedores.`,
      { position: "top-right", autoClose: 2500 }
    );
  };

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

      {/* ✅ MODAL DESCARGA PDF */}
      <Modal
        isOpen={modalDescarga}
        onClose={() => setModalDescarga(false)}
        title="Descargar Presupuesto"
        width="max-w-md"
      >
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-6">
            Tu presupuesto ha sido creado exitosamente. Puedes descargarlo en
            formato PDF o cerrar esta ventana.
          </p>

          <div className="flex justify-center gap-4">
            {resumen && (
              <PDFDownloadLink
                document={
                  <PresupuestoPDF
                    formData={formData}
                    resumen={resumen}
                    logoSrc={logo}
                  />
                }
                fileName={`Presupuesto_${formData?.cliente?.nombre || "cliente"
                  }.pdf`}
              >
                {({ loading }) =>
                  loading ? (
                    <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md shadow-sm">
                      Generando PDF...
                    </button>
                  ) : (
                    <button className="bg-[#0B2C4D] hover:bg-[#123b65] text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-md">
                      <FaFileDownload /> Descargar PDF
                    </button>
                  )
                }
              </PDFDownloadLink>
            )}
          </div>
        </div>
      </Modal>

      {/* ENCABEZADO DE ETAPAS */}
      <div className="flex items-center justify-center gap-12 mb-4 -mt-6">
        {[
          { num: 1, label: "Datos Generales" },
          { num: 2, label: "APU" },
          { num: 3, label: "Confirmación" },
        ].map(({ num, label }) => (
          <div key={num} className="flex flex-col items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-bold shadow-md transition-all ${etapa === num
                ? "bg-[#0B2C4D] scale-110 shadow-lg"
                : "bg-gray-300 scale-100"
                }`}
            >
              {num}
            </div>
            <p
              className={`mt-2 text-sm font-medium ${etapa === num ? "text-[#0B2C4D]" : "text-gray-500"
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
          etapa={etapa}
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
