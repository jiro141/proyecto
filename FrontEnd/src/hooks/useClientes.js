import { useEffect, useState } from "react";
import { getClientes } from "../api/controllers/Clientes";

export default function useClientes(search = "") {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /** ======================
   * Cargar clientes
   * ====================== */
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getClientes(search);
      setClientes(result.results);
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

  return { clientes, loading, error, refetch: fetchData };
}
