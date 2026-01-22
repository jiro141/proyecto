import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const STORAGE_KEY = "presupuesto_draft";

/**
 * 🧠 Hook para manejar el borrador local de un presupuesto (etapas 1–3)
 * ✅ Ahora soporta múltiples APUs con índice activo
 */
export default function usePresupuestoDraft() {
    const [draft, setDraft] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved
            ? JSON.parse(saved)
            : { cliente: null, reporte: null, apus: [] };
    });

    const [currentAPUIndex, setCurrentAPUIndex] = useState(0); // 👈 nuevo índice activo
    const location = useLocation();

    // 🧩 Métodos de edición
    const setCliente = (cliente) =>
        setDraft((prev) => ({ ...prev, cliente }));

    const setReporte = (body) =>
        setDraft((prev) => ({ ...prev, reporte: body }));

    const addAPU = (apuBody = {}) =>
        setDraft((prev) => {
            const nuevoAPU = {
                id: null,
                body: apuBody,
                materiales: [],
                mano_obra: [],
                logistica: [],
            };
            const apus = [...prev.apus, nuevoAPU];
            return { ...prev, apus };
        });

    const updateAPU = (index, updated) =>
        setDraft((prev) => {
            const apus = [...prev.apus];
            apus[index] = { ...apus[index], ...updated };
            return { ...prev, apus };
        });

    const resetDraft = () => {
        localStorage.removeItem(STORAGE_KEY);
        setDraft({ cliente: null, reporte: null, apus: [] });
        setCurrentAPUIndex(0);
    };

    // 🔄 Guardar cambios en localStorage automáticamente
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }, [draft]);

    return {
        draft,
        setCliente,
        setReporte,
        addAPU,
        updateAPU,
        resetDraft,
        currentAPUIndex,
        setCurrentAPUIndex,
    };
}
