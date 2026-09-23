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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ count: 0, totalPages: 1 });

  const fetchData = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);

      const controller = controllerMap[tipo];
      if (!controller)
        throw new Error(`Tipo de inventario "${tipo}" no válido`);

      const result = await controller(search, pageNum);

      // Backend DRF returns { count, next, previous, results }
      if (result.results) {
        setData(result.results);
        setPagination({
          count: result.count || 0,
          totalPages: Math.ceil((result.count || 0) / 20),
          pageSize: 20,
        });
      } else {
        setData(Array.isArray(result) ? result : []);
        setPagination({ count: Array.isArray(result) ? result.length : 0, totalPages: 1, pageSize: 20 });
      }
    } catch (err) {
      setError(err.message || "Error al obtener datos");
    } finally {
      setLoading(false);
    }
  }, [tipo, search]);

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [tipo, search]);

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const setPageAndFetch = (newPage) => {
    setPage(newPage);
  };

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(page),
    page,
    setPage: setPageAndFetch,
    pagination,
  };
}
