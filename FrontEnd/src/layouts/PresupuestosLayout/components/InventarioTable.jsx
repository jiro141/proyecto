import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import Modal from "../../../components/Modal";
import StepForm from "../../../components/StepForm";
import BounceLoader from "react-spinners/BounceLoader";
import { useInventarioTableContainer } from "../hooks/useInventarioTableContainer";
import { getItemById } from "../../../api/controllers/Inventario";

export default function InventarioTable(props) {
  const tipo = props.tipo;
  const {
    logic,
    sortedData,
    tituloMap,
    formStep,
    editItem,
    isModalOpen,
    isDeptModalOpen,
    isProvModalOpen,
    setModalOpen,
    setDeptModalOpen,
    setProvModalOpen,
    setEditItem,
    handleSubmit,
    handleNewDept,
    handleNewProveedor,
  } = useInventarioTableContainer(props);

  return (
    <>
      <div className="relative flex flex-col h-full">
        <TableHeader query={logic.query} setQuery={logic.setQuery} />

        {logic.loading ? (
          <div className="flex justify-center items-center w-full h-full">
            <BounceLoader color="#0b2c4d" size={80} />
          </div>
        ) : logic.error ? (
          <p className="text-center py-6 text-red-500">
            Error al cargar datos
          </p>
        ) : (
          <div className="overflow-y-auto max-h-[40vh]">
            <table className="w-full text-left min-w-[520px]">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-xs text-gray-500 border-b">
                  <th className="pb-2 px-2">Descripción</th>
                  <th className="pb-2 px-2">Unidad</th>
                  <th className="pb-2 px-2 text-center">Cantidad</th>
                  <th className="pb-2 px-2 text-center">Desp</th>
                  {tipo !== "EPP" && (
                    <th className="pb-2 px-2 text-center">
                      Precio Unit.
                    </th>
                  )}
                  <th className="pb-2 px-2 text-center">Total</th>
                </tr>
              </thead>

              <tbody>
                {sortedData.length ? (
                  sortedData.map((item) => {
                    const cantidad = logic.cantidades[item.id] || 0;

                    return (
                      <TableRow
                        key={item.id}
                        item={item}
                        tipo={tipo}
                        cantidad={cantidad}
                        desp={logic.depreciaciones[item.id] || 0}
                        isSelected={cantidad > 0}
                        onCantidadChange={logic.handleCantidadChange}
                        handleCantidadInputChange={logic.handleCantidadInputChange}
                        onDepreciacionChange={logic.handleDepreciacionChange}
                        onDescripcionClick={async () => {
                          // Cargar datos frescos del backend por ID
                          console.log("Editando item:", item.id, "tipo:", tipo);
                          try {
                            const freshItem = await getItemById(tipo, item.id);
                            // Normalizar campos relacionados
                            const normalizedItem = { ...freshItem };
                            if (normalizedItem.proveedor && typeof normalizedItem.proveedor === 'object') {
                              normalizedItem.proveedor = normalizedItem.proveedor.id || normalizedItem.proveedor.name || normalizedItem.proveedor;
                            }
                            if (normalizedItem.departamento && typeof normalizedItem.departamento === 'object') {
                              normalizedItem.departamento = normalizedItem.departamento.id || normalizedItem.departamento.nombre || normalizedItem.departamento;
                            }
                            if (normalizedItem.ubicacion && typeof normalizedItem.ubicacion === 'object') {
                              normalizedItem.ubicacion = normalizedItem.ubicacion.id || normalizedItem.ubicacion.nombre || normalizedItem.ubicacion;
                            }
                            if (normalizedItem.consumo && typeof normalizedItem.consumo === 'object') {
                              normalizedItem.consumo = normalizedItem.consumo.id || normalizedItem.consumo.nombre || normalizedItem.consumo;
                            }
                            setEditItem(normalizedItem);
                            setModalOpen(true);
                          } catch (err) {
                            console.error("Error al cargar item:", err);
                          }
                        }}
                      />
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={tipo !== "EPP" ? 6 : 5}
                      className="text-center py-4 text-gray-500 italic"
                    >
                      No hay productos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setEditItem(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-[#0B2C4D] text-white rounded-lg hover:bg-[#15385C] transition"
          >
            + Agregar {tituloMap[tipo] ?? "Item"}
          </button>
        </div>
      </div>

      {/* ================= MODALES ================= */}

      {/* Crear / Editar Item */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditItem(null);
        }}
        title={
          editItem
            ? `Editar ${tituloMap[tipo]}`
            : `Agregar ${tituloMap[tipo]}`
        }
        width="max-w-2xl"
      >
        <StepForm
          key={editItem ? `edit-${editItem.id}` : "new"}
          steps={formStep}
          onSubmit={handleSubmit}
          initialValues={editItem || {}}
        />
      </Modal>

      {/* Nuevo Departamento */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title="Nuevo Departamento"
      >
        <StepForm
          steps={[
            {
              fields: [
                {
                  name: "name",
                  label: "Nombre del Departamento",
                  required: true,
                },
              ],
            },
          ]}
          onSubmit={handleNewDept}
          initialValues={{}}
        />
      </Modal>

      {/* Nuevo Proveedor */}
      <Modal
        isOpen={isProvModalOpen}
        onClose={() => setProvModalOpen(false)}
        title="Nuevo Proveedor"
      >
        <StepForm
          steps={[
            {
              fields: [
                { name: "name", label: "Nombre", required: true },
                { name: "direccion", label: "Dirección", required: true },
                { name: "telefono", label: "Teléfono", required: true },
                { name: "encargado", label: "Encargado" },
              ],
            },
          ]}
          onSubmit={handleNewProveedor}
          initialValues={{}}
        />
      </Modal>
    </>
  );
}
