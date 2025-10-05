import React, { useState } from "react";
import { FaHardHat, FaTools, FaBox, FaHammer } from "react-icons/fa";
import Modal from "../../components/Modal";
import StepForm from "../../components/StepForm";
import Accordion from "../../components/Accordion";
import { createItem } from "../../api/controllers/Inventario";
import { toast } from "react-toastify";

export default function ArticulosProveedor({ proveedor, refetch }) {
  // Estados modales
  const [isEppModal, setEppModal] = useState(false);
  const [isStockModal, setStockModal] = useState(false);
  const [isConsumoModal, setConsumoModal] = useState(false);

  // Renderizar botones si el proveedor es nuevo (sin ID)
  if (!proveedor?.id) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <h2 className="text-center font-semibold text-gray-700 mb-2">
          Crear nuevos artículos
        </h2>

        <button
          onClick={() => setEppModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center justify-center gap-2"
        >
          <FaHardHat /> Crear EPP
        </button>

        <button
          onClick={() => setStockModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded flex items-center justify-center gap-2"
        >
          <FaTools /> Crear Stock
        </button>

        <button
          onClick={() => setConsumoModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded flex items-center justify-center gap-2"
        >
          <FaBox /> Crear Consumible
        </button>

        {/* Modales para agregar en memoria */}
        <Modal
          isOpen={isEppModal}
          onClose={() => setEppModal(false)}
          title="Agregar EPP"
        >
          <StepForm
            steps={[
              {
                fields: [
                  { name: "name", label: "Nombre", required: true },
                  {
                    name: "unidades",
                    label: "Unidades",
                    type: "number",
                    required: true,
                  },
                  {
                    name: "monto",
                    label: "Monto",
                    type: "number",
                    required: true,
                  },
                ],
              },
            ]}
            onSubmit={(data) => {
              toast.info("EPP agregado localmente");
              setEppModal(false);
              // Aquí podrías usar un callback prop para acumular datos locales
            }}
          />
        </Modal>

        <Modal
          isOpen={isStockModal}
          onClose={() => setStockModal(false)}
          title="Agregar Stock"
        >
          <StepForm
            steps={[
              {
                fields: [
                  { name: "name", label: "Nombre", required: true },
                  { name: "modelo", label: "Modelo", required: true },
                  {
                    name: "unidades",
                    label: "Unidades",
                    type: "number",
                    required: true,
                  },
                  {
                    name: "monto",
                    label: "Monto",
                    type: "number",
                    required: true,
                  },
                ],
              },
            ]}
            onSubmit={(data) => {
              toast.info("Stock agregado localmente");
              setStockModal(false);
            }}
          />
        </Modal>

        <Modal
          isOpen={isConsumoModal}
          onClose={() => setConsumoModal(false)}
          title="Agregar Consumible"
        >
          <StepForm
            steps={[
              {
                fields: [
                  { name: "name", label: "Nombre", required: true },
                  { name: "modelo", label: "Modelo", required: true },
                  {
                    name: "unidades",
                    label: "Unidades",
                    type: "number",
                    required: true,
                  },
                  {
                    name: "monto",
                    label: "Monto",
                    type: "number",
                    required: true,
                  },
                ],
              },
            ]}
            onSubmit={(data) => {
              toast.info("Consumible agregado localmente");
              setConsumoModal(false);
            }}
          />
        </Modal>
      </div>
    );
  }

  // Renderizar acordeones si el proveedor ya existe (modo edición)
  // Renderizar acordeones si el proveedor ya existe (modo edición)
  return (
    <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
      {/* EPPs */}
      {proveedor.epps?.length > 0 && (
        <Accordion
          title={`EPP (${proveedor.epps.length})`}
          icon={FaHardHat}
          data={proveedor.epps}
          filterKeys={["name"]}
          defaultOpen
        >
          {(filtered) => (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2">Nombre</th>

                  <th className="text-left p-2">Monto</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((epp) => (
                  <tr key={epp.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{epp.name}</td>

                    <td className="p-2">$ {epp.monto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Accordion>
      )}
      {/* STOCK */}
      {proveedor.stocks?.length > 0 && (
        <Accordion
          title={`Ferretería (${proveedor.stocks.length})`}
          icon={FaTools}
          data={proveedor.stocks}
          filterKeys={["name", "modelo"]}
        >
          {(filtered) => (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2">Nombre</th>
                  <th className="text-left p-2">Modelo</th>
                  <th className="text-left p-2">Monto</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((st) => (
                  <tr key={st.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{st.name}</td>
                    <td className="p-2">{st.modelo}</td>
                    <td className="p-2">$ {st.monto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Accordion>
      )}

      {/* CONSUMIBLES */}
      {proveedor.consumibles?.length > 0 && (
        <Accordion
          title={`Consumibles (${proveedor.consumibles.length})`}
          icon={FaHammer}
          data={proveedor.consumibles}
          filterKeys={["name", "modelo"]}
        >
          {(filtered) => (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2">Nombre</th>
                  <th className="text-left p-2">Modelo</th>
                  <th className="text-left p-2">Monto</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{c.name}</td>
                    <td className="p-2">{c.modelo}</td>
                    <td className="p-2">$ {c.monto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Accordion>
      )}

      {/* SIN DATOS */}
      {!proveedor.epps?.length &&
        !proveedor.stocks?.length &&
        !proveedor.consumibles?.length && (
          <p className="text-gray-500 italic text-center">
            Este proveedor no tiene artículos asociados.
          </p>
        )}
    </div>
  );
}
