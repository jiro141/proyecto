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
    createNotaReporte,
    updateNotaReporte,
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
                // 🧾 1. CREAR REPORTE
                // =========================
                const reportePayload = {
                    cliente: formData.cliente.id,
                    descripcion: formData.descripcion || "Nuevo presupuesto",
                };
                
                // Agregar orden_servicio si existe (es opcional)
                if (formData.orden_servicio) {
                    reportePayload.orden_servicio = formData.orden_servicio;
                }

                const reporte = esEdicion
                    ? await updateReporte(formData.id, reportePayload)
                    : await createReporte(reportePayload);

                if (!reporte?.id) throw new Error("Error en reporte");

                // =========================
                // 📝 2. CREAR NOTA (después del reporte)
                // =========================
                const titulo = formData.titulo || "Nota";
                const descripcion = formData.notas || "";

                // Solo guardar nota si hay descripción (no vacía)
                if (descripcion && descripcion.trim() !== "") {
                    if (formData.notaId) {
                        // Actualizar nota existente
                        await updateNotaReporte(formData.notaId, {
                            titulo: titulo,
                            descripcion: descripcion,
                        });
                    } else {
                        // Crear nueva nota ASOCIADA AL REPORTE
                        const nota = await createNotaReporte(reporte.id, {
                            titulo: titulo,
                            descripcion: descripcion,
                        });
                        // Guardar el ID de la nota para futuras actualizaciones
                        formData.notaId = nota.id;
                    }
                }

                // =========================
                // 🧮 3. CREAR APUs (después de nota)
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

                    // =========================
                    // 📦 4. CREAR MATERIALES (después del APU)
                    // =========================
                    const materiales = apu.materiales || {};
                    const { stock_almacen = [], consumibles = [], epps = [] } = materiales;

                    // Stock almacen
                    // El backend toma el precio_unitario desde el inventario automáticamente
                    for (const mat of stock_almacen) {
                        // Solo enviar si tiene ID válido
                        if (!mat.id) continue;
                        await createAPUMaterial(apuResponse.id, {
                            apu: apuResponse.id,
                            stock_id: Number(mat.id),
                            cantidad: Number(mat.cantidad),
                            desperdicio: Number(mat.desp || 0),
                        });
                    }

                    // Consumibles
                    // El backend toma el precio_unitario desde el inventario automáticamente
                    for (const mat of consumibles) {
                        // Solo enviar si tiene ID válido
                        if (!mat.id) continue;
                        await createAPUMaterial(apuResponse.id, {
                            apu: apuResponse.id,
                            consumible_id: Number(mat.id),
                            cantidad: Number(mat.cantidad),
                            desperdicio: Number(mat.desp || 0),
                        });
                    }

                    // =========================
                    // 🔧 5. CREAR HERRAMIENTAS
                    // =========================
                    for (const herramienta of apu.herramientas || []) {
                        // Solo enviar si tiene descripción válida Y cantidad > 0
                        if (!herramienta.descripcion || herramienta.descripcion.trim() === "") continue;
                        if (Number(herramienta.cantidad) <= 0) continue;
                        await createAPUHerramienta(apuResponse.id, {
                            apu: apuResponse.id,
                            descripcion: herramienta.descripcion,
                            cantidad: Number(herramienta.cantidad) || 1,
                            precio_unitario: Number(herramienta.costo) || 0,
                            depreciacion_hora: 0,
                            unidad: herramienta.unidad || "UND",
                        });
                    }

                    // =========================
                    // 👷 6. CREAR MANO DE OBRA
                    // =========================
                    for (const mo of apu.mano_obra || []) {
                        // Solo enviar si tiene descripción válida Y cantidad > 0
                        if (!mo.descripcion || mo.descripcion.trim() === "") continue;
                        if (Number(mo.cantidad) <= 0) continue;
                        await createAPUManoObra(apuResponse.id, {
                            apu: apuResponse.id,
                            descripcion: mo.descripcion,
                            cantidad: Number(mo.cantidad) || 1,
                            precio_unitario: Number(mo.costo) || 0,
                            unidad: mo.unidad || "DIA",
                        });
                    }

                    // =========================
                    // 🚚 7. CREAR LOGÍSTICA
                    // =========================
                    for (const log of apu.logistica || []) {
                        // Solo enviar si tiene descripción válida Y cantidad > 0
                        if (!log.descripcion || log.descripcion.trim() === "") continue;
                        if (Number(log.cantidad) <= 0) continue;
                        await createAPULogistica(apuResponse.id, {
                            apu: apuResponse.id,
                            descripcion: log.descripcion,
                            cantidad: Number(log.cantidad) || 1,
                            precio_unitario: Number(log.costo) || 0,
                            unidad: log.unidad || "UND",
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
