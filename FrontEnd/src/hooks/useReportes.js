import { useEffect, useState } from "react";
import { getReporte } from "../api/controllers/Presupuesto";

export default function useReportes(search = "") {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /** ======================
   * Cargar Reportes
   * ====================== */
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getReporte(search);
      setReportes(result.results);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  /** ======================
   * Ejecutar al montar o cuando cambia `search`
   * ====================== */
  useEffect(() => {
    fetchData();
  }, [search]);

  return { reportes, loading, error, refetch: fetchData };
}
