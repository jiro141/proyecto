import { useEffect, useState, useCallback } from "react";
import { getProveedoresSearch } from "../api/controllers/Inventario";

export default function useProveedores(search = "") {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ count: 0, totalPages: 1 });

  const fetchData = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const result = await getProveedoresSearch(search, pageNum);
      // Backend DRF returns { count, next, previous, results }
      if (result.results) {
        setProveedores(result.results);
        setPagination({
          count: result.count || 0,
          totalPages: Math.ceil((result.count || 0) / 20),
        });
      } else {
        setProveedores(Array.isArray(result) ? result : []);
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
    proveedores,
    loading,
    error,
    refetch: () => fetchData(page),
    page,
    setPage: setPageAndFetch,
    pagination,
  };
}
