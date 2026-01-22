import { useEffect, useState } from "react";
import AuthApi from "../api/AuthApi";

const useLugaresConsumo = () => {
  const [lugares, setLugares] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLugares = async () => {
    try {
      const res = await AuthApi.get("/inventario/lugares/");
      setLugares(res.data.results);
    } catch (err) {
      console.error("Error cargando lugares de consumo", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLugares();
  }, []);

  return { lugares, loading, refetch: fetchLugares };
};

export default useLugaresConsumo;
