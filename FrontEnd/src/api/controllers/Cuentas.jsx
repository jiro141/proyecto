import AuthApi from "../AuthApi";

export const getCuentasCobrar = async () => {
  const response = await AuthApi.get("/reportes/cuentas-cobrar/");
  return response.data;
};

export const getReportes = async () => {
  const response = await AuthApi.get("/reportes/");
  return response.data;
};

export const getReporteAbonos = async (reporteId) => {
  const response = await AuthApi.get(`/reportes/${reporteId}/abonos/`);
  return response.data;
};

export const getAbonos = async (fecha_desde = null, fecha_hasta = null) => {
  const params = new URLSearchParams();
  if (fecha_desde) params.append("fecha_desde", fecha_desde);
  if (fecha_hasta) params.append("fecha_hasta", fecha_hasta);
  const query = params.toString();
  const response = await AuthApi.get(`/cuentas/abonos/${query ? `?${query}` : ""}`);
  return response.data;
};

export const getResumenCuentas = async (fecha_desde = null, fecha_hasta = null) => {
  // Usar endpoint existente y agrupar en frontend
  const abonos = await getAbonos(fecha_desde, fecha_hasta);
  const abonosList = abonos.results || abonos;
  
  // Agrupar por reporte
  const agrupado = {};
  let totalAbonado = 0;
  
  abonosList.forEach((abono) => {
    const reporteId = abono.reporte;
    if (!agrupado[reporteId]) {
      agrupado[reporteId] = {
        reporte__id: reporteId,
        reporte__n_presupuesto: abono.n_presupuesto,
        reporte__descripcion: abono.descripcion_reporte,
        reporte__cliente__nombre: abono.cliente_nombre || "—",
        reporte__total_reporte: abono.monto_total_reporte,
        total_abonado: 0,
        cantidad_abonos: 0,
      };
    }
    agrupado[reporteId].total_abonado += parseFloat(abono.monto || 0);
    agrupado[reporteId].cantidad_abonos += 1;
    totalAbonado += parseFloat(abono.monto || 0);
  });
  
  const detalle = Object.values(agrupado);
  const totalFacturado = detalle.reduce((sum, r) => sum + parseFloat(r.reporte__total_reporte || 0), 0);
  
  return {
    detalle,
    totales: {
      total_facturado: totalFacturado,
      total_abonado: totalAbonado,
      total_pendiente: totalFacturado - totalAbonado,
    }
  };
};

export const createAbono = async (payload) => {
  const response = await AuthApi.post("/cuentas/abonos/", payload);
  return response.data;
};

export const updateAbono = async (id, payload) => {
  const response = await AuthApi.put(`/cuentas/abonos/${id}/`, payload);
  return response.data;
};

export const deleteAbono = async (id) => {
  const response = await AuthApi.delete(`/cuentas/abonos/${id}/`);
  return response.data;
};
