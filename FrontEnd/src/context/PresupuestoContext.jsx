// src/context/PresupuestoContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const STORAGE_KEY = "presupuesto_draft";
const PresupuestoContext = createContext();

const initialAPU = () => ({
    body: {
        descripcion: "",
        rendimiento: 0.75,
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
    descripcion: "",
    fechaCulminacion: new Date(),
    presupuesto_base: 0,
    presupuesto_estimado: 0,
    porcentaje_productividad: 1,
    apus: [initialAPU()],
});

export const PresupuestoProvider = ({ children }) => {
    const location = useLocation();
    const [formData, setFormData] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : initialPresupuesto();
    });
    const [currentAPUIndex, setCurrentAPUIndex] = useState(0);

    // === CRUD APUs ===
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
            return { ...prev, apus: [...apus] };
        });

    const updateAPUField = (key, value) =>
        setFormData((prev) => {
            const apus = prev.apus.map((apu, idx) =>
                idx === currentAPUIndex
                    ? { ...apu, body: { ...apu.body, [key]: value } }
                    : apu
            );
            return { ...prev, apus };
        });

    const updateAPUSection = (section, data) =>
        setFormData((prev) => {
            const apus = prev.apus.map((apu, idx) =>
                idx === currentAPUIndex ? { ...apu, [section]: data } : apu
            );
            return { ...prev, apus };
        });

    const deleteAPU = (index) =>
        setFormData((prev) => {
            const apus = prev.apus.filter((_, i) => i !== index);
            const nextIndex = Math.max(0, index - 1);
            return { ...prev, apus, currentAPUIndex: nextIndex };
        });

    const resetPresupuesto = () => {
        localStorage.removeItem(STORAGE_KEY);
        setFormData(initialPresupuesto());
        setCurrentAPUIndex(0);
    };

    // 💾 Guardar automáticamente
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        } catch (error) {
            console.error("Error guardando en localStorage:", error);
        }
    }, [formData]);



    return (
        <PresupuestoContext.Provider
            value={{
                formData,
                setFormData,
                currentAPUIndex,
                setCurrentAPUIndex,
                addAPU,
                updateAPU,
                updateAPUField,
                updateAPUSection,
                deleteAPU,
                resetPresupuesto,
            }}
        >
            {children}
        </PresupuestoContext.Provider>
    );
};

export const usePresupuesto = () => useContext(PresupuestoContext);
