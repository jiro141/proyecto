import { useEffect, useState, useCallback } from "react";
import { getClientes } from "../api/controllers/Clientes";

export default function useClientes(search = "") {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ count: 0, totalPages: 1 });

  const fetchData = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const result = await getClientes(search, pageNum);
      // Backend DRF returns { count, next, previous, results }
      if (result.results) {
        setClientes(result.results);
        setPagination({
          count: result.count || 0,
          totalPages: Math.ceil((result.count || 0) / 20),
        });
      } else {
        // Fallback si el backend retorna array directo
        setClientes(Array.isArray(result) ? result : []);
        setPagination({ count: Array.isArray(result) ? result.length : 0, totalPages: 1 });
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [search]);

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const setPageAndFetch = (newPage) => {
    setPage(newPage);
  };

  return {
    clientes,
    loading,
    error,
    refetch: () => fetchData(page),
    page,
    setPage: setPageAndFetch,
    pagination,
  };
}
