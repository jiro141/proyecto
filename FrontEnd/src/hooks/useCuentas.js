import { useEffect, useState, useCallback } from "react";
import { getCuentasCobrar, createAbono, deleteAbono } from "../api/controllers/Cuentas";

export default function useCuentas() {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getCuentasCobrar();
      setReportes(Array.isArray(result) ? result : result.results || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addAbono = async (payload) => {
    await createAbono(payload);
    await fetchData();
  };

  const removeAbono = async (id) => {
    await deleteAbono(id);
    await fetchData();
  };

  return { reportes, loading, error, refetch: fetchData, addAbono, removeAbono };
}
