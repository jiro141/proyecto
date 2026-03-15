import { toast } from "react-toastify";
import {
    createReporte,
    updateReporte,
    createAPU,
    updateAPU,
    createAPUMaterial,
    updateAPUMaterial,
    createAPUHerramienta,
    createAPUManoObra,
    createAPULogistica,
} from "../../../api/controllers/Presupuesto";

export default function useReportesActions() {

    const guardarPresupuesto = async ({ formData, refetchReportes }) => {

        if (!formData?.cliente) {
            toast.error("Debe seleccionar un cliente antes de guardar.");
            return null;
        }

        const esEdicion = Boolean(formData.id);

        const resultado = await toast.promise(
            (async () => {

                // =========================
                // 🧾 REPORTE
                // =========================
                const reporte = esEdicion
                    ? await updateReporte(formData.id, {
                        cliente: formData.cliente.id,
                        descripcion: formData.descripcion,
                    })
                    : await createReporte({
                        cliente: formData.cliente.id,
                        descripcion: formData.descripcion || "Nuevo presupuesto",
                    });

                if (!reporte?.id) throw new Error("Error en reporte");

                // =========================
                // 🧮 APUs
                // =========================
                for (const apu of formData.apus || []) {

                    // 🔴 Si estamos editando y el APU no tiene id → ES NUEVO
                    const esNuevoAPU = esEdicion && !apu.id;

                    // 🔵 Si estamos editando y tiene id → SOLO UPDATE
                    const esAPUExistente = esEdicion && apu.id;

                    let apuResponse;

                    if (esAPUExistente) {
                        apuResponse = await updateAPU(apu.id, {
                            ...apu.body,
                            reporte: reporte.id,
                        });
                    }
                    else if (esNuevoAPU) {
                        apuResponse = await createAPU(reporte.id, {
                            ...apu.body,
                            reporte: reporte.id,
                        });
                    }
                    else {
                        // 🆕 creación normal (cuando el reporte es nuevo)
                        apuResponse = await createAPU(reporte.id, {
                            ...apu.body,
                            reporte: reporte.id,
                        });
                    }
                }


                refetchReportes?.();

                return {
                    ok: true,
                    mensaje: esEdicion
                        ? "Presupuesto actualizado correctamente"
                        : "Presupuesto creado correctamente",
                    reporte,
                };

            })(),
            {
                pending: esEdicion
                    ? "Actualizando presupuesto..."
                    : "Creando presupuesto...",
                success: esEdicion
                    ? "Presupuesto actualizado correctamente"
                    : "Presupuesto creado correctamente",
                error: {
                    render({ data }) {
                        return data?.message || "❌ Error en el proceso";
                    },
                },
            }
        );

        return resultado;
    };

    return {
        guardarPresupuesto,
    };
}
