import { toast } from "react-toastify";
import {
    createReporte,
    createAPU,
    createAPUMaterial,
    createAPUHerramienta,
    createAPUManoObra,
    createAPULogistica,
} from "../../../api/controllers/Presupuesto";


export default function useReportesActions() {
    // 🧾 Crear reporte base
    const crearReporte = async (clienteId, descripcion) => {
        const payload = {
            cliente: clienteId,
            descripcion: descripcion || "Nuevo presupuesto",
        };
        return await createReporte(payload);
    };

    // ⚙️ Crear APU vinculado al reporte
    const crearAPUParaReporte = async (reporteId, body = {}) => {
        console.log(body, 'data');

        const payload = {
            rendimiento: body.rendimiento || 1,
            descripcion: body.descripcion || "Sin descripción",
            unidad: body.unidad || "UND",
            cantidad: body.cantidad || 1,
            depreciacion: body.depreciacion || 0,
            presupuesto_base: body.presupuesto_base || 0,
        };
        return await createAPU(reporteId, payload);
    };

    // 🧱 Agregar materiales (stock o consumibles)
    const agregarMaterialesAPU = async (apuId, materiales = {}) => {
        // Recorremos las categorías de materiales
        for (const [tipo, lista] of Object.entries(materiales)) {
            if (!Array.isArray(lista)) continue;

            for (const item of lista) {
                const cantidad = Number(item.cantidad || 0);
                const desperdicio = Number(item.desp || 0);

                const payload = { apu: apuId, cantidad, desperdicio };

                // Asignamos el campo correcto según el tipo
                if (tipo === "stock_almacen") {
                    payload.stock_id = item.stock_id || item.id;
                } else if (tipo === "consumibles") {
                    payload.consumible_id = item.consumible_id || item.id;
                } else {
                    console.warn(`⚠️ Tipo de material no reconocido: ${tipo}, se omite.`);
                    continue;
                }

                try {
                    await createAPUMaterial(apuId, payload);

                } catch (err) {
                    console.error(`❌ Error agregando material a APU ${apuId}:`, err);
                }
            }
        }
    };


    // ⚒️ Agregar herramientas
    const agregarHerramientasAPU = async (apuId, herramientas = [], index) => {
        for (const h of herramientas) {
            const payload = {
                apu: apuId,
                descripcion: h.descripcion || "Herramienta",
                unidad: h.unidad || "UND",
                cantidad: Number(h.cantidad || 0),
                depreciacion_hora: Number(h.depreciacion_hora || 0),
                precio_unitario: Number(h.precio_unitario || h.costo || 0),
            };
            try {
                await createAPUHerramienta(apuId, payload);
            } catch (error) {
                throw new Error(`Error al agregar herramienta en APU #${index + 1}`);
            }
        }
    };

    // 👷 Agregar mano de obra
    const agregarManoObraAPU = async (apuId, manoObra = [], index) => {
        for (const m of manoObra) {
            const payload = {
                apu: apuId,
                descripcion: m.descripcion || "Trabajador",
                unidad: m.unidad || "UND",
                cantidad: Number(m.cantidad || 0),
                precio_unitario: Number(m.precio_unitario || m.costo || 0),
            };
            try {
                await createAPUManoObra(apuId, payload);
            } catch (error) {
                throw new Error(`Error al agregar mano de obra en APU #${index + 1}`);
            }
        }
    };

    // 🚚 Agregar logística
    const agregarLogisticaAPU = async (apuId, logistica = [], index) => {
        for (const l of logistica) {
            const payload = {
                apu: apuId,
                descripcion: l.descripcion || "Servicio logístico",
                unidad: l.unidad || "UND",
                cantidad: Number(l.cantidad || 0),
                precio_unitario: Number(l.precio_unitario || l.costo || 0),
            };
            try {
                await createAPULogistica(apuId, payload);
            } catch (error) {
                throw new Error(`Error al agregar logística en APU #${index + 1}`);
            }
        }
    };

    // 🚀 Flujo completo
    const crearPresupuestoCompleto = async ({ formData, refetchReportes }) => {
        if (!formData?.cliente) {
            toast.error("Debe seleccionar un cliente antes de guardar.");
            return;
        }

        // ✅ Toast Promise (único)
        await toast.promise(
            (async () => {
                // 1️⃣ Crear reporte
                let reporte;
                try {
                    reporte = await crearReporte(formData.cliente.id, formData.descripcion);
                } catch {
                    throw new Error("Error al crear el reporte");
                }
                if (!reporte?.id) throw new Error("Error al crear el reporte");
                // 2️⃣ Crear cada APU
                for (const [index, apu] of formData.apus.entries()) {
                    let apuCreado;
                    try {

                        apuCreado = await crearAPUParaReporte(reporte.id, apu.body);

                    } catch (error) {
                        console.error("❌ Error en APU #", index + 1, error.response?.data || error);
                        throw new Error(`Error al crear APU #${index + 1}`);
                    }

                    if (!apuCreado?.id) continue;

                    // 3️⃣ Agregar secciones
                    try {
                        await agregarMaterialesAPU(apuCreado.id, apu.materiales);
                        await agregarHerramientasAPU(apuCreado.id, apu.herramientas, index);
                        await agregarManoObraAPU(apuCreado.id, apu.mano_obra, index);
                        await agregarLogisticaAPU(apuCreado.id, apu.logistica, index);
                    } catch (err) {
                        throw err; // deja pasar el error detallado
                    }
                }

                refetchReportes?.();
            })(),
            {
                pending: "📤 Enviando presupuesto completo...",
                success: "✅ Presupuesto creado correctamente",
                error: {
                    render({ data }) {
                        // data contiene el error lanzado (Error object)
                        return data?.message || "❌ Error al crear presupuesto";
                    },
                },
            }
        );
    };

    return {
        crearPresupuestoCompleto,
    };
}
