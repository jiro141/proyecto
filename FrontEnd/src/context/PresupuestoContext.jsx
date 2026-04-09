// src/context/PresupuestoContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const STORAGE_KEY = "presupuesto_draft";
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
    localStorage.removeItem(STORAGE_KEY);
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
    const hydrateFromStorage = () => {
      try {
        // 1️⃣ Primero: verificar si viene de edición (presupuesto_edicion)
        const edicionData = localStorage.getItem("presupuesto_edicion");
        if (edicionData) {
          const parsed = JSON.parse(edicionData);
          console.log("🔄 [PresupuestoContext] Hidratando desde edición:", parsed);
          localStorage.removeItem("presupuesto_edicion");
          setFormData({
            ...initialPresupuesto(),
            ...parsed,
          });
          setLoading(false);
          return;
        }

        // 2️⃣ Segundo: verificar si hay un borrador (presupuesto_draft)
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log("🔄 [PresupuestoContext] Hidratando desde draft:", parsed);
          setFormData({
            ...initialPresupuesto(),
            ...parsed,
            fechaCulminacion: new Date(parsed.fechaCulminacion),
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

  // Guardar a localStorage solo cuando NO está cargando Y no viene de edición reciente
  // Si hay presupuesto_edicion, no guardar hasta que se hydrate
  useEffect(() => {
    if (loading) return;
    
    // Si viene de edición (tiene ID), no guardar en draft para evitar duplicación
    const edicionPendiente = localStorage.getItem("presupuesto_edicion");
    if (edicionPendiente) return;
    
    // Si el formData tiene ID (edición), no guardar en draft
    if (formData?.id) return;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData, loading]);

  const hydratePresupuesto = (data) => {
    console.log("🔄 [PresupuestoContext] hydratePresupuesto llamado:", data);
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
