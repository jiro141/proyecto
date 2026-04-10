import { toast } from "react-toastify";
import {
    createReporte,
    updateReporte,
    createAPU,
    updateAPU,
    deleteAPU,
    getAPUsByReporte,
    createAPUMaterial,
    updateAPUMaterial,
    createAPUHerramienta,
    updateAPUHerramienta,
    createAPUManoObra,
    updateAPUManoObra,
    createAPULogistica,
    updateAPULogistica,
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
                
                // ✅ Agregar fecha de culminación (formato YYYY-MM-DD)
                if (formData.fechaCulminacion) {
                    let fechaCulminacion;
                    const fecha = formData.fechaCulminacion;
                    
                    if (fecha instanceof Date) {
                        // Formato manual para evitar problemas de zona horaria
                        const year = fecha.getFullYear();
                        const month = String(fecha.getMonth() + 1).padStart(2, '0');
                        const day = String(fecha.getDate()).padStart(2, '0');
                        fechaCulminacion = `${year}-${month}-${day}`;
                    } else if (typeof fecha === 'string') {
                        // Si es string, asegurar formato YYYY-MM-DD
                        fechaCulminacion = fecha.split('T')[0];
                    } else {
                        // Cualquier otro caso, convertir a string seguro
                        fechaCulminacion = String(fecha).split('T')[0];
                    }
                    
                    reportePayload.fecha_estimacion_culminacion = fechaCulminacion;
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

                console.log("📝 Guardando nota:", { titulo, descripcion, notaId: formData.notaId });

                // Solo guardar nota si hay descripción (no vacía)
                if (descripcion && descripcion.trim() !== "") {
                    if (formData.notaId) {
                        // Actualizar nota existente
                        console.log("🔄 Actualizando nota existente:", formData.notaId);
                        await updateNotaReporte(formData.notaId, {
                            titulo: titulo,
                            descripcion: descripcion,
                        });
                    } else {
                        // Crear nueva nota ASOCIADA AL REPORTE
                        console.log("➕ Creando nueva nota para reporte:", reporte.id);
                        const nota = await createNotaReporte(reporte.id, {
                            titulo: titulo,
                            descripcion: descripcion,
                        });
                        // Guardar el ID de la nota para futuras actualizaciones
                        formData.notaId = nota.id;
                    }
                } else {
                    console.log("⚠️ Nota vacía, no se guarda");
                }

                // =========================
                // 🧮 3. ELIMINAR APUs EXISTENTES (si es edición)
                // =========================
                if (esEdicion) {
                    console.log("🗑️ Eliminando APUs existentes para recrearlos...");
                    const apusActuales = await getAPUsByReporte(reporte.id);
                    for (const apu of apusActuales) {
                        await deleteAPU(apu.id);
                    }
                    console.log("✅ APUs eliminados, se crearán los nuevos");
                }

                // =========================
                // 🧮 4. CREAR APUs NUEVOS
                // =========================
                for (const apu of formData.apus || []) {

                    let apuResponse;

                    // Siempre crear nuevo APU ( tanto para creación como edición )
                    apuResponse = await createAPU(reporte.id, {
                        ...apu.body,
                        reporte: reporte.id,
                    });

                    // =========================
                    // 📦 4. CREAR MATERIALES (después del APU)
                    // =========================
                    const materiales = apu.materiales || {};
                    const materialesObj = typeof materiales === 'object' && materiales !== null 
                        ? materiales 
                        : {};
                    const { stock_almacen = [], consumibles = [], epps = [] } = materialesObj;

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
                    // 🔧 5. HERRAMIENTAS (SOLO CREATE - nunca UPDATE porque se borraron al eliminar APUs)
                    // =========================
                    const herramientasArr = Array.isArray(apu.herramientas) ? apu.herramientas : [];
                    for (const herramienta of herramientasArr) {
                        // Solo enviar si tiene descripción válida Y cantidad > 0
                        if (!herramienta.descripcion || herramienta.descripcion.trim() === "") continue;
                        if (Number(herramienta.cantidad) <= 0) continue;
                        
                        const precio = Number(herramienta.depreciacion_bs_hora) || 0;
                        
                        // Siempre crear nuevo registro (los IDs antiguos ya no existen)
                        await createAPUHerramienta(apuResponse.id, {
                            apu: apuResponse.id,
                            descripcion: herramienta.descripcion,
                            cantidad: Number(herramienta.cantidad) || 1,
                            depreciacion_hora: precio,
                            precio_unitario: precio,
                            unidad: herramienta.unidad || "UND",
                        });
                    }

                    // =========================
                    // 👷 6. MANO DE OBRA (SOLO CREATE)
                    // =========================
                    const manoObraArr = Array.isArray(apu.mano_obra) ? apu.mano_obra : [];
                    for (const mo of manoObraArr) {
                        // Solo enviar si tiene descripción válida Y cantidad > 0
                        if (!mo.descripcion || mo.descripcion.trim() === "") continue;
                        if (Number(mo.cantidad) <= 0) continue;
                        
                        // Siempre crear nuevo registro
                        await createAPUManoObra(apuResponse.id, {
                            apu: apuResponse.id,
                            descripcion: mo.descripcion,
                            cantidad: Number(mo.cantidad) || 1,
                            precio_unitario: Number(mo.precio_unitario) || 0,
                            unidad: mo.unidad || "DIA",
                        });
                    }

                    // =========================
                    // 🚚 7. LOGÍSTICA (SOLO CREATE)
                    // =========================
                    const logisticaArr = Array.isArray(apu.logistica) ? apu.logistica : [];
                    for (const log of logisticaArr) {
                        // Solo enviar si tiene descripción válida Y cantidad > 0
                        if (!log.descripcion || log.descripcion.trim() === "") continue;
                        if (Number(log.cantidad) <= 0) continue;
                        
                        // Siempre crear nuevo registro
                        await createAPULogistica(apuResponse.id, {
                            apu: apuResponse.id,
                            descripcion: log.descripcion,
                            cantidad: Number(log.cantidad) || 1,
                            precio_unitario: Number(log.precio_unitario) || 0,
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
