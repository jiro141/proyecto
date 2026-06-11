import { useState } from "react";
import { usePresupuesto } from "../../../context/PresupuestoContext";
import { toast } from "react-toastify";
import Modal from "../../../components/Modal";
import ClienteCard from "../components/ClienteCard";
import DescripcionCard from "../components/DescripcionCard";
import CalendarioCard from "../components/CalendarioCard";
import ControlCard from "../components/ControlCard";
import OrdenServicioCard from "../components/OrdenServicioCard";
import InfoNotaCard from "../components/InfoNotaCard";

export default function Etapa1() {
  const { formData, updatePresupuestoField } = usePresupuesto();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTitulo, setEditTitulo] = useState("");
  const [editNotas, setEditNotas] = useState("");
  const [editValidez, setEditValidez] = useState("");
  const [editFormaPago, setEditFormaPago] = useState("");
  const [editTerminos, setEditTerminos] = useState("");

  const abrirModal = () => {
    setEditTitulo(formData.titulo || "Nota");
    setEditNotas(formData.notas || "");
    setEditValidez(formData.validez_oferta || "5 DÍAS");
    setEditFormaPago(formData.forma_pago || "60% ANTICIPO  40% A SU ENTREGA");
    setEditTerminos(formData.terminos_condiciones || "LOS PRECIOS NO INCLUYEN IVA; LO QUE NO ENCUENTRE EN EL PRESENTE PRESUPUESTO SERÁ PRESUPUESTADO POR APARTE.");
    setModalOpen(true);
  };

  const guardarModal = () => {
    updatePresupuestoField("titulo", editTitulo.trim() === "" ? "Nota" : editTitulo);
    updatePresupuestoField("notas", editNotas);
    updatePresupuestoField("validez_oferta", editValidez);
    updatePresupuestoField("forma_pago", editFormaPago);
    updatePresupuestoField("terminos_condiciones", editTerminos);
    toast.success("Información guardada");
    setModalOpen(false);
  };

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
    <>
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
          <InfoNotaCard onAbrirModal={abrirModal} />
        </div>

        <div className="col-start-3 row-start-1">
          <ControlCard />
        </div>

        <div className="col-start-3 row-start-2">
          <OrdenServicioCard />
        </div>
      </div>

      {/* MODAL EDITAR INFO */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Editar información del presupuesto"
        width="max-w-2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título de la nota
            </label>
            <input
              type="text"
              value={editTitulo}
              onChange={(e) => setEditTitulo(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nota
            </label>
            <textarea
              value={editNotas}
              onChange={(e) => setEditNotas(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Validez de la oferta
            </label>
            <textarea
              value={editValidez}
              onChange={(e) => setEditValidez(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forma de pago
            </label>
            <textarea
              value={editFormaPago}
              onChange={(e) => setEditFormaPago(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Términos y condiciones
            </label>
            <textarea
              value={editTerminos}
              onChange={(e) => setEditTerminos(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={guardarModal}
              className="px-4 py-2 bg-[#0b2c4d] text-white rounded hover:bg-[#143d65] text-sm font-medium"
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
