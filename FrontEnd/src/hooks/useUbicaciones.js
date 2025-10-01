import { useEffect, useState } from "react";
import AuthApi from "../api/AuthApi";

const useUbicaciones = () => {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUbicaciones = async () => {
    try {
      const res = await AuthApi.get("/inventario/ubicaciones/");
      setUbicaciones(res.data);
    } catch (err) {
      console.error("Error cargando ubicaciones", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUbicaciones();
  }, []);

  return { ubicaciones, loading, refetch: fetchUbicaciones };
};

export default useUbicaciones;
