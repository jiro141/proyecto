import { usePresupuesto } from "../../../context/PresupuestoContext";
import { toast } from "react-toastify";
import ClienteCard from "../components/ClienteCard";
import DescripcionCard from "../components/DescripcionCard";
import CalendarioCard from "../components/CalendarioCard";
import ControlCard from "../components/ControlCard";
import NotaCard from "../components/NotaCard";

export default function Etapa1() {
  const { formData, updatePresupuestoField } = usePresupuesto();

  const handleClienteSelect = (cliente) => {
    updatePresupuestoField("cliente", cliente);
    toast.info(`🧾 Cliente seleccionado: ${cliente?.nombre}`, {
      position: "top-right",
      autoClose: 2000,
    });
  };

  const handleDescripcionChange = (descripcion) => {
    updatePresupuestoField("descripcion", descripcion);
  };

  const handleFechaChange = (fecha) => {
    updatePresupuestoField("fechaCulminacion", fecha);
  };

  const handleProductividadChange = (valor) => {
    updatePresupuestoField("porcentaje_productividad", valor / 100);
  };

  const handlePresupuestoChange = (valor) => {
    updatePresupuestoField("presupuesto_base", Number(valor) || 0);
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
        <NotaCard
          titulo={formData.titulo}
          descripcion={formData.notas}
          onTituloChange={(value) =>
            updatePresupuestoField("titulo", value)
          }
          onDescripcionChange={(value) =>
            updatePresupuestoField("notas", value)
          }
        />
      </div>

      <div className="col-start-3 row-start-1">
        <ControlCard />
      </div>

      <div className="col-start-3 row-start-2" />
    </div>
  );
}
