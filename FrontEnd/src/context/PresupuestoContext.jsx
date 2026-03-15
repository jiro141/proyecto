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
  const [formData, setFormData] = useState(initialPresupuesto);
  const [hydrated, setHydrated] = useState(false);

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
     Persistencia
  ===================== */

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
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
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData, hydrated]);

  const hydratePresupuesto = (data) => {
    setFormData({
      ...initialPresupuesto(),
      ...data,
    });
    setCurrentAPUIndex(0);
  };
  return (
    <PresupuestoContext.Provider
      value={{
        formData,
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
