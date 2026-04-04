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

export const getAbonos = async () => {
  const response = await AuthApi.get("/cuentas/abonos/");
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
