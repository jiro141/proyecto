import { useState } from "react";
import { toast } from "react-toastify";
import {
  getReporteDetalle,
  getNotasByReporte,
} from "../../../api/controllers/Presupuesto";
import { usePresupuesto } from "../../../context/PresupuestoContext";
import { useNavigate } from "react-router-dom";

export const useReporteActions = () => {
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const { hydratePresupuesto } = usePresupuesto();
  const navigate = useNavigate();

  // Cargar detalle del reporte
  const loadReporteDetalle = async (row, setModalOpen) => {
    setLoadingDetalle(true);
    setSelectedReporte(null);
    setModalOpen(true);
    try {
      const detalle = await getReporteDetalle(row.id);
      setSelectedReporte(detalle);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar los datos del reporte");
    } finally {
      setLoadingDetalle(false);
    }
  };

  // Preparar datos para editar
  const prepareEditData = async (reporte) => {
    try {
      // Cargar notas del reporte
      let notaData = { titulo: "Nota", notas: "", notaId: null };
      try {
        const notas = await getNotasByReporte(reporte.id);
        
        // La respuesta tiene .results (paginação)
        const notasArray = notas?.results || notas;
        
        if (notasArray && notasArray.length > 0) {
          const primeraNota = notasArray[0];
          notaData = {
            titulo: primeraNota.titulo || "Nota",
            notas: primeraNota.descripcion || "",
            notaId: primeraNota.id,
          };
        }
      } catch (error) {
        console.error("Error al cargar notas:", error);
      }

      const adaptedData = {
        id: reporte.id,
        n_presupuesto: reporte.n_presupuesto, // ← Guardar número de presupuesto
        orden_servicio: reporte.orden_servicio || "", // ← Orden de servicio
        cliente: {
          id: reporte.cliente,
          nombre: reporte.cliente_nombre,
        },
        titulo: notaData.titulo,
        descripcion: reporte.descripcion,
        notas: notaData.notas,
        notaId: notaData.notaId,
        fechaCulminacion: new Date(),
        presupuesto_base: Number(reporte.total_reporte),
        presupuesto_estimado: Number(reporte.total_reporte),
        porcentaje_productividad: 1,
        apus: (reporte.apus || []).map((apu) => ({
          id: apu.id,
          body: {
            descripcion: apu.descripcion || "",
            rendimiento: Number(apu.rendimiento) || 1,
            unidad: apu.unidad || "UND",
            cantidad: Number(apu.cantidad) || 1,
            depreciacion: Number(apu.depreciacion) || 0,
            presupuesto_base: Number(apu.total_apu) || 0,
            porcentaje_desp: 0,
          },
          materiales: {
            stock_almacen: (apu.materiales || [])
              .filter((m) => m.stock)
              .map((m) => ({
                id: m.stock.id,
                codigo: m.stock.codigo,
                descripcion: m.descripcion,
                cantidad: Number(m.cantidad),
                costo: Number(m.precio_unitario),
                desp: Number(m.desperdicio),
              })),
            consumibles: (apu.materiales || [])
              .filter((m) => m.consumible)
              .map((m) => ({
                id: m.consumible.id,
                descripcion: m.descripcion,
                cantidad: Number(m.cantidad),
                costo: Number(m.precio_unitario),
                desp: Number(m.desperdicio), // ✅ Agregar desperdicio para consumibles
              })),
            epps: [],
          },
          // ✅ Solo cargar registros con cantidad > 0 (usar campos correctos)
          mano_obra: (apu.manos_obra || []).filter(mo => Number(mo.cantidad) > 0).map((mo) => ({
            id: mo.id,
            descripcion: mo.descripcion || "",
            cantidad: Number(mo.cantidad) || 0,
            precio_unitario: Number(mo.precio_unitario) || 0,  // ✅ Usar precio_unitario
            unidad: mo.unidad || "",
          })),
          // ✅ Solo cargar registros con cantidad > 0
          // El backend usa "depreciacion_hora", mapear a "depreciacion_bs_hora" para el frontend
          herramientas: (apu.herramientas || []).filter(h => Number(h.cantidad) > 0).map((h) => ({
            id: h.id,
            descripcion: h.descripcion || "",
            cantidad: Number(h.cantidad) || 0,
            // Mapear depreciacion_hora (backend) -> depreciacion_bs_hora (frontend)
            depreciacion_bs_hora: Number(h.depreciacion_hora || h.depreciacion_bs_hora || 0),
            unidad: h.unidad || "",
          })),
          // ✅ Solo cargar registros con cantidad > 0
          logistica: (apu.logisticas || []).filter(l => Number(l.cantidad) > 0).map((l) => ({
            id: l.id,
            descripcion: l.descripcion || "",
            cantidad: Number(l.cantidad) || 0,
            precio_unitario: Number(l.precio_unitario || 0),
            unidad: l.unidad || "",
          })),
        })),
      };

      // ✅ Limpiar cualquier dato anterior antes de cargar edición
      localStorage.removeItem("presupuesto_edicion");
      localStorage.removeItem("presupuesto_draft");
      
      console.log("📦 Datos adaptados para edición:", JSON.stringify(adaptedData, null, 2));
      
      // Guardar en localStorage para persistencia
      localStorage.setItem("presupuesto_edicion", JSON.stringify(adaptedData));
      hydratePresupuesto(adaptedData);
      navigate("/informes/Crear");
    } catch (error) {
      console.error("Error al obtener detalles del reporte:", error);
      toast.error("Error al cargar los datos del presupuesto");
    }
  };

  // Preparar datos para Excel
  const prepareExcelData = (detalle) => {
    return {
      id: detalle.id,
      cliente: {
        id: detalle.cliente,
        nombre: detalle.cliente_nombre,
      },
      descripcion: detalle.descripcion,
      apus: (detalle.apus || []).map((apu) => ({
        id: apu.id,
        body: {
          descripcion: apu.descripcion || "",
          rendimiento: Number(apu.rendimiento) || 1,
          unidad: apu.unidad || "UND",
          cantidad: Number(apu.cantidad) || 1,
          depreciacion: Number(apu.depreciacion) || 0,
          presupuesto_base: Number(apu.presupuesto_base) || 0,
        },
        materiales: {
          stock_almacen: (apu.materiales || [])
            .filter((m) => m.stock)
            .map((m) => ({
              codigo: m.stock.codigo,
              descripcion: m.descripcion,
              unidad: m.stock.unidad,
              cantidad: Number(m.cantidad),
              costo: Number(m.precio_unitario),
              desp: Number(m.desperdicio),
            })),
          consumibles: (apu.materiales || [])
            .filter((m) => m.consumible)
            .map((m) => ({
              descripcion: m.descripcion,
              cantidad: Number(m.cantidad),
              costo: Number(m.precio_unitario),
              desp: Number(m.desperdicio),
            })),
          epps: [],
        },
        herramientas: (apu.herramientas || []).map((h) => ({
          descripcion: h.descripcion,
          unidad: h.unidad,
          cantidad: Number(h.cantidad),
          costo: Number(h.precio_unitario),
        })),
        mano_obra: (apu.manos_obra || []).map((m) => ({
          descripcion: m.descripcion,
          unidad: m.unidad,
          cantidad: Number(m.cantidad),
          precio_unitario: Number(m.precio_unitario),
        })),
        logistica: (apu.logisticas || []).map((l) => ({
          descripcion: l.descripcion,
          unidad: l.unidad,
          cantidad: Number(l.cantidad),
          precio_unitario: Number(l.precio_unitario),
        })),
      })),
    };
  };

  // Preparar datos para PDF
  const preparePDFData = async (detalle) => {
    // Cargar notas del reporte
    let notaData = { titulo: "Nota", notas: "" };
    try {
      const notas = await getNotasByReporte(detalle.id);
      console.log("Notas response:", notas);
      
      // La respuesta tiene .results (paginação)
      const notasArray = notas?.results || notas;
      
      if (notasArray && notasArray.length > 0) {
        const primeraNota = notasArray[0];
        notaData = {
          titulo: primeraNota.titulo || "Nota",
          notas: primeraNota.descripcion || "",
        };
      }
    } catch (error) {
      console.error("Error al cargar notas para PDF:", error);
    }

    return {
      descripcion: detalle.descripcion,
      presupuesto_estimado: Number(detalle.total_reporte),
      cliente: {
        nombre: detalle.cliente_nombre,
      },
      apus: (detalle.apus || []).map((apu) => ({
        body: {
          descripcion: apu.descripcion,
          unidad: apu.unidad,
          cantidad: Number(apu.cantidad),
          presupuesto_base: Number(apu.presupuesto_base),
        },
      })),
      titulo: notaData.titulo,
      notas: notaData.notas,
      orden_servicio: detalle.orden_servicio || "",
    };
  };

  return {
    selectedReporte,
    setSelectedReporte,
    loadingDetalle,
    loadReporteDetalle,
    prepareEditData,
    prepareExcelData,
    preparePDFData,
  };
};

export default useReporteActions;