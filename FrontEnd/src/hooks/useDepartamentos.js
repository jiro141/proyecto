import { useEffect, useState } from "react";
import AuthApi from "../api/AuthApi";

const useDepartamentos = () => {
  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDepartamentos = async () => {
    try {
      const res = await AuthApi.get("/inventario/departamentos/");
      setDepartamentos(res.data);
    } catch (err) {
      console.error("Error cargando departamentos:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartamentos();
  }, []);

  return {
    departamentos,
    loading,
    error,
    refetch: fetchDepartamentos,
  };
};

export default useDepartamentos;