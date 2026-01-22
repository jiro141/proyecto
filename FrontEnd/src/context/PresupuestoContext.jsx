// src/context/PresupuestoContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const STORAGE_KEY = "presupuesto_draft";
const PresupuestoContext = createContext();

export const PresupuestoProvider = ({ children }) => {
    const location = useLocation(); // ✅ correcto uso
    const [formData, setFormData] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved
            ? JSON.parse(saved)
            : {
                cliente: null,
                descripcion: "",
                fechaCulminacion: new Date(),
                presupuesto_base: 0,
                presupuesto_estimado: 0,
                porcentaje_productividad: 1,
                apus: [
                    {
                        body: {
                            descripcion: "",
                            rendimiento: 0.75,
                            unidad: "UND",
                            cantidad: 1,
                            depreciacion: 0,
                            presupuesto_base: 0, // 👈 NUEVO
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
                    },
                ],
            };
    });

    const [currentAPUIndex, setCurrentAPUIndex] = useState(0);

    // 🔧 CRUD de APUs
    const addAPU = () => {
        const nuevo = {
            body: {
                descripcion: "",
                rendimiento: 1,
                unidad: "UND",
                cantidad: 1,
                depreciacion: 0,
            },
            materiales: { stock_almacen: [], consumibles: [], epps: [] },
            mano_obra: [],
            herramientas: [],
            logistica: [],
        };
        setFormData((prev) => ({
            ...prev,
            apus: [...prev.apus, nuevo],
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
        setFormData((prev) => {
            const apus = [...prev.apus];
            apus[currentAPUIndex].body[key] = value;
            return { ...prev, apus };
        });

    const updateAPUSection = (section, data) =>
        setFormData((prev) => {
            const apus = [...prev.apus];
            apus[currentAPUIndex][section] = data;
            return { ...prev, apus };
        });

    const deleteAPU = (index) =>
        setFormData((prev) => {
            const apus = prev.apus.filter((_, i) => i !== index);
            return { ...prev, apus };
        });

    const resetPresupuesto = () => {
        localStorage.removeItem(STORAGE_KEY);
        setFormData({
            cliente: null,
            descripcion: "",
            fechaCulminacion: new Date(),
            presupuesto_base: 0,
            presupuesto_estimado: 0,
            porcentaje_productividad: 1,
            apus: [
                {
                    body: {
                        descripcion: "",
                        rendimiento: 1,
                        unidad: "UND",
                        cantidad: 1,
                        depreciacion: 0,
                    },
                    materiales: { stock_almacen: [], consumibles: [], epps: [] },
                    mano_obra: [],
                    herramientas: [],
                    logistica: [],
                },
            ],
        });
        setCurrentAPUIndex(0);
    };

    // 🧠 Efecto: resetear si no estamos en "/informes/Crear"


    // 💾 Guardar en localStorage cada vez que cambie el formData
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
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
