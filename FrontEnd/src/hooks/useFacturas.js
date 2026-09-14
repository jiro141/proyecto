import { useCallback, useEffect, useState } from "react";
import { getFacturas } from "../api/controllers/Facturas";

export default function useFacturas(search = "") {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ count: 0, totalPages: 1 });

  const fetchFacturas = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const data = await getFacturas(search, null, pageNum);
      // Backend DRF returns { count, next, previous, results }
      if (data.results) {
        setFacturas(data.results);
        setPagination({
          count: data.count || 0,
          totalPages: Math.ceil((data.count || 0) / 20),
        });
      } else {
        setFacturas(Array.isArray(data) ? data : []);
        setPagination({ count: Array.isArray(data) ? data.length : 0, totalPages: 1 });
      }
    } catch (err) {
      console.error("❌ Error fetching facturas:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setPage(1);
    fetchFacturas(1);
  }, [search]);

  useEffect(() => {
    fetchFacturas(page);
  }, [page]);

  const setPageAndFetch = (newPage) => {
    setPage(newPage);
  };

  return {
    facturas,
    loading,
    error,
    refetch: () => fetchFacturas(page),
    page,
    setPage: setPageAndFetch,
    pagination,
  };
}
