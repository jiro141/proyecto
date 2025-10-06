import React from "react";
import useInventario from "../hooks/useInvetario";
import Tables from "../components/Tables";
import useMovimientos from "../hooks/useMovimientos";
const columns = {
  epp: [
    { key: "name", label: "Nombre" },
    { key: "monto", label: "Monto" },
  ],
  consumibles: [
    { key: "name", label: "Nombre" },
    { key: "modelo", label: "Modelo" },
    { key: "monto", label: "Monto" },
  ],
  stock: [
    { key: "name", label: "Nombre" },
    { key: "modelo", label: "Modelo" },
    { key: "monto", label: "Monto" },
  ],
};

export default function InventarioHome() {
  const { data: eppData, loading: eppLoading } = useInventario("epp");
  const { data: consumibleData, loading: consumibleLoading } =
    useInventario("consumibles");
  const { data: stockData, loading: stockLoading } = useInventario("stock");
  const { movimientos, loading, refetch: fetchMovimientos } = useMovimientos();

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6">
      <div className="w-full md:w-1/3">
        <Tables
          title="EPP"
          columns={columns.epp}
          data={eppData}
          loading={eppLoading}
        />
      </div>
      <div className="w-full md:w-1/3">
        <Tables
          title="Consumibles"
          columns={columns.consumibles}
          data={consumibleData}
          loading={consumibleLoading}
        />
      </div>
      <div className="w-full md:w-1/3">
        <Tables
          title="Ferreteria"
          columns={columns.stock}
          data={stockData}
          loading={stockLoading}
        />
      </div>
    </div>
  );
}
