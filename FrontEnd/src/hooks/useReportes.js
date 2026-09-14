import { useEffect, useState, useCallback } from "react";
import { getReportes } from "../api/controllers/Presupuesto";

export default function useReportes(search = "", clienteId = null) {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ count: 0, totalPages: 1 });

  const fetchReportes = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const data = await getReportes(search, clienteId, pageNum);
      // Backend DRF returns { count, next, previous, results }
      if (data.results) {
        setReportes(data.results);
        setPagination({
          count: data.count || 0,
          totalPages: Math.ceil((data.count || 0) / 20),
        });
      } else {
        setReportes(Array.isArray(data) ? data : []);
        setPagination({ count: Array.isArray(data) ? data.length : 0, totalPages: 1 });
      }
    } catch (err) {
      console.error("❌ Error fetching:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [search, clienteId]);

  useEffect(() => {
    setPage(1);
    fetchReportes(1);
  }, [search, clienteId]);

  useEffect(() => {
    fetchReportes(page);
  }, [page]);

  const setPageAndFetch = (newPage) => {
    setPage(newPage);
  };

  return {
    reportes,
    loading,
    error,
    refetch: () => fetchReportes(page),
    page,
    setPage: setPageAndFetch,
    pagination,
  };
}
