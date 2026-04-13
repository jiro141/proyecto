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
  const params = new URLSearchParams();
  if (fecha_desde) params.append("fecha_desde", fecha_desde);
  if (fecha_hasta) params.append("fecha_hasta", fecha_hasta);
  const query = params.toString();
  const response = await AuthApi.get(`/cuentas/abonos/resumen/${query ? `?${query}` : ""}`);
  return response.data;
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
