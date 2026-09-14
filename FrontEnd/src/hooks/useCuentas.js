import { useEffect, useState, useCallback } from "react";
import { getCuentasCobrar, createAbono, deleteAbono } from "../api/controllers/Cuentas";

export default function useCuentas() {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ count: 0, totalPages: 1 });

  const fetchData = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const result = await getCuentasCobrar(pageNum);
      // Backend DRF returns { count, next, previous, results }
      if (result.results) {
        setReportes(result.results);
        setPagination({
          count: result.count || 0,
          totalPages: Math.ceil((result.count || 0) / 20),
        });
      } else {
        setReportes(Array.isArray(result) ? result : []);
        setPagination({ count: Array.isArray(result) ? result.length : 0, totalPages: 1 });
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const setPageAndFetch = (newPage) => {
    setPage(newPage);
  };

  const addAbono = async (payload) => {
    await createAbono(payload);
    await fetchData(page);
  };

  const removeAbono = async (id) => {
    await deleteAbono(id);
    await fetchData(page);
  };

  return {
    reportes,
    loading,
    error,
    refetch: () => fetchData(page),
    page,
    setPage: setPageAndFetch,
    pagination,
    addAbono,
    removeAbono,
  };
}
