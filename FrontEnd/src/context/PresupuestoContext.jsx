// src/context/PresupuestoContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { get, set, del } from "idb-keyval";

const STORAGE_KEY = "presupuesto_draft";
const EDICION_KEY = "presupuesto_edicion";
const PresupuestoContext = createContext();

/* =====================
   Initializers
===================== */

const initialAPU = () => ({
  body: {
    descripcion: "",
    rendimiento: 1,
    unidad: "UND",
    cantidad: 1,
    depreciacion: 0,
    presupuesto_base: 0,
    porcentaje_desp: 0,
  },
  materiales: {
    stock_almacen: [],
    consumibles: [],
    epps: [],
  },
  mano_obra: [],
  herramientas: [],
  logistica: [],
  porcentaje_administracion: 15, // % de gastos administrativos
});

const initialPresupuesto = () => ({
  cliente: null,
  n_presupuesto: null, // Para edición - guardar número de presupuesto
  orden_servicio: "", // Orden de servicio (opcional)
  titulo: "Nota",
  notas: "",
  descripcion: "",
  fechaCulminacion: new Date(),
  presupuesto_base: 0,
  presupuesto_estimado: 0,
  porcentaje_productividad: 1,
  apus: [initialAPU()],
  porcentaje_descuento: 0,
  descripcion_descuento: "",
  validez_oferta: "5 DÍAS",
  forma_pago: "60% ANTICIPO  40% A SU ENTREGA",
  terminos_condiciones: "LOS PRECIOS NO INCLUYEN IVA; LO QUE NO ENCUENTRE EN EL PRESENTE PRESUPUESTO SERÁ PRESUPUESTADO POR APARTE.",
});

/* =====================
   Provider
===================== */

export const PresupuestoProvider = ({ children }) => {
  // ✅ Solo inicial con estructura vacía - la hidratación ocurre en useEffect
  const [formData, setFormData] = useState(initialPresupuesto);
  const [loading, setLoading] = useState(true); // Estado de carga para la hidratación

  const [currentAPUIndex, setCurrentAPUIndex] = useState(0);

  /* =====================
     Presupuesto (global)
  ===================== */

  const updatePresupuestoField = (key, value) =>
    setFormData((prev) => ({
      ...prev,
      [key]:
        key === "titulo" && String(value).trim() === ""
          ? "Nota"
          : value,
    }));

  /* =====================
     APU CRUD
  ===================== */

  const addAPU = () => {
    setFormData((prev) => ({
      ...prev,
      apus: [...prev.apus, initialAPU()],
    }));
    setCurrentAPUIndex((prev) => prev + 1);
  };

  const updateAPU = (index, data) =>
    setFormData((prev) => {
      const apus = [...prev.apus];
      apus[index] = { ...apus[index], ...data };
      return { ...prev, apus };
    });

  const updateAPUField = (key, value) =>
    setFormData((prev) => ({
      ...prev,
      apus: prev.apus.map((apu, idx) =>
        idx === currentAPUIndex
          ? { ...apu, body: { ...apu.body, [key]: value } }
          : apu
      ),
    }));

  const updateAPUSection = (section, data) =>
    setFormData((prev) => ({
      ...prev,
      apus: prev.apus.map((apu, idx) =>
        idx === currentAPUIndex ? { ...apu, [section]: data } : apu
      ),
    }));

  const deleteAPU = (index) => {
    setFormData((prev) => ({
      ...prev,
      apus: prev.apus.filter((_, i) => i !== index),
    }));
    setCurrentAPUIndex((prev) => Math.max(0, prev - 1));
  };

  const resetPresupuesto = () => {
    del(STORAGE_KEY).catch(() => {});
    setFormData(initialPresupuesto());
    setCurrentAPUIndex(0);
  };

  const updateAPUMateriales = (section, items) => {
    setFormData((prev) => ({
      ...prev,
      apus: prev.apus.map((apu, idx) =>
        idx === currentAPUIndex
          ? {
            ...apu,
            materiales: {
              ...apu.materiales,
              [section]: items,
            },
          }
          : apu
      ),
    }));
  };
  /* =====================
     Persistencia e Hidratación
  ===================== */

  useEffect(() => {
    const hydrateFromStorage = async () => {
      try {
        // 1️⃣ Primero: verificar si viene de edición (presupuesto_edicion)
        const edicionData = await get(EDICION_KEY);
        if (edicionData) {
          await del(EDICION_KEY);
          setFormData({
            ...initialPresupuesto(),
            ...edicionData,
          });
          setLoading(false);
          return;
        }

        // 2️⃣ Segundo: verificar si hay un borrador (presupuesto_draft)
        const saved = await get(STORAGE_KEY);
        if (saved) {
          setFormData({
            ...initialPresupuesto(),
            ...saved,
            fechaCulminacion: new Date(saved.fechaCulminacion),
          });
        }
      } catch (e) {
        console.error("Error hidratando presupuesto:", e);
        setFormData(initialPresupuesto());
      } finally {
        setLoading(false);
      }
    };

    hydrateFromStorage();
  }, []);

  useEffect(() => {
    const persistDraft = async () => {
      if (loading) return;

      const edicionPendiente = await get(EDICION_KEY);
      if (edicionPendiente) return;

      await set(STORAGE_KEY, formData);
      console.log("💾 [PresupuestoContext] Draft guardado en IndexedDB. APUs:", formData.apus?.length);
      console.log("📦 Objeto completo:", formData);
    };

    persistDraft();
  }, [formData, loading]);

  const hydratePresupuesto = (data) => {

    setFormData({
      ...initialPresupuesto(),
      ...data,
    });
    setCurrentAPUIndex(0);
    setLoading(false); // Ya tenemos datos, no hay más espera
  };
  return (
    <PresupuestoContext.Provider
      value={{
        formData,
        loading, // ✅ Exportar estado de carga
        currentAPUIndex,
        setCurrentAPUIndex,
        addAPU,
        updateAPU,
        updateAPUField,
        updateAPUSection,
        deleteAPU,
        resetPresupuesto,
        updatePresupuestoField,
        updateAPUMateriales,
        hydratePresupuesto,
      }}
    >
      {children}
    </PresupuestoContext.Provider>
  );
};

/* =====================
   Hook
===================== */

export const usePresupuesto = () => useContext(PresupuestoContext);
