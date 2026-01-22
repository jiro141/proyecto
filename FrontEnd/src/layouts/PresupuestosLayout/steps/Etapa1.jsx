import { usePresupuesto } from "../../../context/PresupuestoContext";
import { toast } from "react-toastify";
import ClienteCard from "../components/ClienteCard";
import DescripcionCard from "../components/DescripcionCard";
import CalendarioCard from "../components/CalendarioCard";
import ControlCard from "../components/ControlCard";
import NotaCard from "../components/NotaCard";

export default function Etapa1() {
  const { formData, setFormData } = usePresupuesto();

  const handleClienteSelect = (cliente) => {
    setFormData((prev) => ({ ...prev, cliente }));
    toast.info(`🧾 Cliente seleccionado: ${cliente?.nombre}`, {
      position: "top-right",
      autoClose: 2000,
    });
  };

  const handleDescripcionChange = (descripcion) => {
    setFormData((prev) => ({ ...prev, descripcion }));
  };

  const handleFechaChange = (fecha) => {
    setFormData((prev) => ({ ...prev, fechaCulminacion: fecha }));
  };

  const handleProductividadChange = (valor) => {
    setFormData((prev) => ({
      ...prev,
      porcentaje_productividad: valor / 100,
    }));
  };

  const handlePresupuestoChange = (valor) => {
    setFormData((prev) => ({
      ...prev,
      presupuesto_base: Number(valor) || 0,
    }));
  };

  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-8">
      <div className="col-span-2 grid grid-cols-2 gap-6">
        <ClienteCard
          onClienteSelect={handleClienteSelect}
          defaultCliente={formData.cliente}
        />
        <DescripcionCard
          descripcion={formData.descripcion}
          onDescripcionChange={handleDescripcionChange}
        />
      </div>

      <div className="col-span-2 grid grid-cols-2 gap-6">
        <CalendarioCard
          fecha={formData.fechaCulminacion}
          onFechaChange={handleFechaChange}
        />
        {/* <NotaCard /> */}

      </div>

      <div className="col-start-3 row-start-1">
        <ControlCard />
      </div>

      <div className="col-start-3 row-start-2" />
    </div>
  );
}
