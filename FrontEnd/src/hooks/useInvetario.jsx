import { useState, useEffect, useCallback } from "react";
import {
  getEpp,
  getStock,
  getConsumibles,
  getTaza,
  getHerramientas,
  getEmpleados,
  getLogistica,
} from "../api/controllers/Inventario";

const controllerMap = {
  epp: getEpp,
  stock: getStock,
  consumibles: getConsumibles,
  taza: getTaza,
  herramientas: getHerramientas,
  empleados: getEmpleados,
  logistica: getLogistica,
};

export default function useInventario(tipo, search = "") {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /** ======================
   * Obtener datos del inventario
   * ====================== */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const controller = controllerMap[tipo];
      if (!controller)
        throw new Error(`Tipo de inventario "${tipo}" no válido`);

      // 🚀 Soporte para búsqueda (si el controlador lo acepta)
      const result = await controller(search);



      setData(result.results ? result.results : result);
    } catch (err) {
      setError(err.message || "Error al obtener datos");
    } finally {
      setLoading(false);
    }
  }, [tipo, search]);


  /** ======================
   * Ejecutar al montar o cuando cambia tipo o search
   * ====================== */
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  return { data, loading, error, refetch: fetchData };
}
