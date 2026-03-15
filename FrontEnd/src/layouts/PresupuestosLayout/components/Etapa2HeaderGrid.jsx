import { useEffect, useRef } from "react";
import DescripcionCard from "./DescripcionCard";
import ProductividadCard from "./ProductividadCard";
import PresupuestoCard from "./PresupuestoCard";
import { usePresupuesto } from "../../../context/PresupuestoContext";
import { toast } from "react-toastify";

export default function Etapa2HeaderGrid() {
    const {
        formData,
        currentAPUIndex,
        updateAPUField,
        updateAPU,
    } = usePresupuesto();

    // ✅ Si no hay APU, aseguramos una estructura vacía
    const apuActual = formData.apus?.[currentAPUIndex] || {
        body: {
            descripcion: "",
            rendimiento: 1,
            unidad: "UND",
            cantidad: 1,
            depreciacion: 0,
        },
    };

    const apuBody = apuActual.body || {
        descripcion: "",
        rendimiento: 1,
        unidad: "UND",
        cantidad: 1,
        depreciacion: 0,
    };

    // ================================
    // 🔧 Actualiza el body del APU activo
    // ================================
    const handleChangeAPU = (key, value) => {
        updateAPUField(key, value);
    };

    // ================================
    // 💾 Guardar automáticamente en localStorage (ya lo hace el contexto)
    // Pero esto puede servir para mostrar feedback visual
    // ================================
    const isMounted = useRef(false);

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        try {
            updateAPU(currentAPUIndex, apuActual);
        } catch (err) {
            console.error("Error al guardar APU:", err);
            toast.error("❌ Error al guardar APU");
        }
    }, [
        apuBody.descripcion,
        apuBody.rendimiento,
        apuBody.unidad,
        apuBody.cantidad,
        apuBody.depreciacion,
    ]);

    // ================================
    // 🧩 Render
    // ================================
    return (
        <div className="grid grid-cols-3 gap-6">
            {/* Descripción del APU */}
            <DescripcionCard
                descripcion={apuBody.descripcion}
                onDescripcionChange={(val) => handleChangeAPU("descripcion", val)}
            />

            {/* Productividad (rendimiento) */}
            <ProductividadCard
                defaultValue={(apuBody.rendimiento || 1) }
                onChange={(val) => handleChangeAPU("rendimiento", val )}
            />

            {/* Presupuesto / Cantidad / Unidad */}
            <PresupuestoCard
                unidad={apuBody.unidad}
                cantidad={apuBody.cantidad}
                depreciacion={apuBody.depreciacion}
                onChangeUnidad={(val) => handleChangeAPU("unidad", val)}
                onChangeCantidad={(val) => handleChangeAPU("cantidad", Number(val))}
                onChangeDepreciacion={(val) =>
                    handleChangeAPU("depreciacion", Number(val))
                }
            />
        </div>
    );
}
