import Modal from "../../../components/Modal";
import InventarioTable from "./InventarioTable";
import PresupuestoTable from "./PresupuestoTable";
import { usePresupuesto } from "../../../context/PresupuestoContext";

export default function Etapa2Modals({
    openModal,
    setOpenModal,
    stock,
    consumibles,
    loadingStock,
    loadingCons,
    errorStock,
    errorCons,
    refetchStock,
    refetchCons,
    onStockInsuficiente,
    presupuestoData,
    setPresupuestoData,
    departamentos = [],
    proveedores = [],
    ubicaciones = [],
    lugares = [],
    refetchDepartamentos,
    refetchProveedores,
    herramientas: herramientasDelHook,
    manoObra: manoObraDelHook,
    logistica: logisticaDelHook,
    loadingHerramientas,
    loadingEmpleados,
    loadingLogistica,
    refetchHerramientas,
    refetchEmpleados,
    refetchLogistica,
    formData, // ✅ Datos del contexto del presupuesto
}) {
    const { formData: contextoFormData, currentAPUIndex, updateAPUSection } = usePresupuesto();
    const apuActual = contextoFormData.apus?.[currentAPUIndex] || {};

    // ======================================
    // 🔧 Sincronización para herramientas/mano_obra/logistica
    // ======================================
    const handlePresupuestoTableChange = (section, updater) => {
        setPresupuestoData((prev) => {
            const newData = typeof updater === "function" ? updater(prev) : updater;
            // ✅ Guardar TODOS los items en el contexto (como materiales)
            const items = newData[section] || [];
            updateAPUSection(section, items);
            return newData;
        });
    };

    // ======================================
    // 🧠 Función para renderizar modales de herramientas/mano de obra/logística
    // Igual que stock/consumibles
    // ======================================
    const renderPresupuestoTableModal = ({
        tipo,
        tipoLabel,
        data, // catálogo completo
        loading,
        columnas,
        formFields,
        onRefetch,
    }) => {
        // ✅ Obtener los items ya seleccionados del APU actual
        const selectedData = apuActual[tipo] || [];

        // ✅ Callback que sincroniza datos como stock/consumibles
        const handlePresupuestoChangeLocal = (updatedItems) => {
            // Actualizar presupuestoData local
            setPresupuestoData((prev) => ({
                ...prev,
                [tipo]: updatedItems,
            }));

            // También actualizar el contexto del APU
            updateAPUSection(tipo, updatedItems);
        };

        if (loading)
            return (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full mb-2"></div>
                    <p className="text-sm">Cargando {tipoLabel}...</p>
                </div>
            );

        return (
            <PresupuestoTable
                titulo={tipoLabel}
                tipo={tipo}
                columnas={columnas}
                // ✅ Pasar catálogo completo + datos seleccionados
                dataSource={data}
                presupuestoData={{
                    herramientas: apuActual.herramientas || [],
                    mano_obra: apuActual.mano_obra || [],
                    logistica: apuActual.logistica || [],
                }}
                loading={loading}
                setPresupuestoData={handlePresupuestoChangeLocal}
                formFields={formFields}
                onRefetch={onRefetch}
            />
        );
    };

    // ======================================
    // 🧠 Función auxiliar de render
    // ======================================
    const renderInventarioContent = ({
        tipo,
        data,
        loading,
        error,
        refetch,
    }) => {
        const materiales = apuActual.materiales || {};

        // ✅ Determinar externalData según el tipo
        const externalData =
            tipo === "stock"
                ? materiales.stock_almacen || []
                : tipo === "consumibles"
                    ? materiales.consumibles || []
                    : [];

        // ✅ Callback que sincroniza datos del presupuesto y parent
        const handleTotalChangeLocal = (tipo, total, itemsActualizados) => {
            if (typeof handleTotalChange === "function") {
                handleTotalChange(tipo, total, itemsActualizados);
            }

            // Mantiene sincronizado el presupuestoData local
            setPresupuestoData((prev) => ({
                ...prev,
                [tipo]: itemsActualizados,
            }));

            // También actualiza el contexto del APU
            updateAPUSection("materiales", {
                ...apuActual.materiales,
                [tipo === "stock" ? "stock_almacen" : "consumibles"]: itemsActualizados,
            });
        };


        if (loading)
            return (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full mb-2"></div>
                    <p className="text-sm">Cargando {tipo}...</p>
                </div>
            );

        if (error)
            return (
                <div className="text-center text-red-500 py-8">
                    <p className="mb-2 text-sm">{error}</p>
                    <button
                        onClick={refetch}
                        className="text-sm text-blue-600 underline hover:opacity-80"
                    >
                        Reintentar
                    </button>
                </div>
            );

        // ✅ Pasar externalData como prop correcta
        return (
            <InventarioTable
                tipo={tipo}
                externalData={externalData} // ✅ clave
                departamentos={departamentos}
                proveedores={proveedores}
                ubicaciones={ubicaciones}
                lugares={lugares}
                refetchDepartamentos={refetchDepartamentos}
                refetchProveedores={refetchProveedores}
                onTotalChange={handleTotalChangeLocal}
                onStockInsuficiente={(producto) => onStockInsuficiente(tipo, producto)}
                refetch={refetch}
            />
        );
    };

    // ======================================
    // 🧩 Render principal
    // ======================================
    return (
        <>
            {/* === STOCK / FERRETERÍA === */}
            <Modal
                title="Inventario de Ferretería"
                isOpen={openModal === "stock"}
                onClose={() => setOpenModal(null)}
                width="max-w-5xl"
                height={"h-3/4"}
            >
                <div className="max-h-[80vh] overflow-y-auto p-4">
                    {renderInventarioContent({
                        tipo: "stock",
                        data: stock,
                        loading: loadingStock,
                        error: errorStock,
                        refetch: refetchStock,
                    })}
                </div>
            </Modal>

            {/* === CONSUMIBLES === */}
            <Modal
                title="Inventario de Consumibles"
                isOpen={openModal === "consumibles"}
                onClose={() => setOpenModal(null)}
                width="max-w-5xl"
                height={"h-3/4"}
            >
                <div className="max-h-[80vh] overflow-y-auto p-4">
                    {renderInventarioContent({
                        tipo: "consumibles",
                        data: consumibles,
                        loading: loadingCons,
                        error: errorCons,
                        refetch: refetchCons,
                    })}
                </div>
            </Modal>

            {/* === HERRAMIENTAS === */}
            <Modal
                title="Herramientas"
                isOpen={openModal === "herramientas"}
                onClose={() => setOpenModal(null)}
                width="max-w-4xl"
                height={"h-3/4"}
            >
                <div className="max-h-[80vh] overflow-y-auto p-4">
                    {renderPresupuestoTableModal({
                        tipo: "herramientas",
                        tipoLabel: "Herramientas",
                        data: herramientasDelHook,
                        loading: loadingHerramientas,
                        columnas: [
                            { key: "descripcion", label: "Descripción" },
                            { key: "unidad", label: "Unidad" },
                            { key: "cantidad", label: "Cantidad" },
                            { key: "depreciacion_bs_hora", label: "Depreciación (BS/Hora)" },
                            { key: "total", label: "Total" },
                        ],
                        formFields: [
                            { name: "descripcion", label: "Descripción", required: true },
                            { name: "unidad", label: "Unidad", required: true },
                            { name: "depreciacion_bs_hora", label: "Depreciación (BS/Hora)", type: "number" },
                        ],
                        onRefetch: refetchHerramientas,
                    })}
                </div>
            </Modal>

            {/* === MANO DE OBRA === */}
            <Modal
                title="Mano de Obra"
                isOpen={openModal === "manoObra"}
                onClose={() => setOpenModal(null)}
                width="max-w-4xl"
                height={"h-3/4"}
            >
                <div className="max-h-[80vh] overflow-y-auto p-4">
                    {renderPresupuestoTableModal({
                        tipo: "mano_obra",
                        tipoLabel: "Mano de Obra",
                        data: manoObraDelHook,
                        loading: loadingEmpleados,
                        columnas: [
                            { key: "descripcion", label: "Descripción" },
                            { key: "unidad", label: "Unidad" },
                            { key: "cantidad", label: "Cantidad" },
                            { key: "precio_unitario", label: "Precio Unitario" },
                            { key: "total", label: "Total" },
                        ],
                        formFields: [
                            { name: "descripcion", label: "Descripción", required: true },
                            { name: "unidad", label: "Unidad", required: true },
                            { name: "precio_unitario", label: "Precio Unitario", type: "number" },
                        ],
                        onRefetch: refetchEmpleados,
                    })}
                </div>
            </Modal>

            {/* === LOGÍSTICA === */}
            <Modal
                title="Logística"
                isOpen={openModal === "logistica"}
                onClose={() => setOpenModal(null)}
                width="max-w-3xl"
                height={"h-3/4"}
            >
                <div className="max-h-[80vh] overflow-y-auto p-4">
                    {renderPresupuestoTableModal({
                        tipo: "logistica",
                        tipoLabel: "Logística",
                        data: logisticaDelHook,
                        loading: loadingLogistica,
                        columnas: [
                            { key: "descripcion", label: "Descripción" },
                            { key: "unidad", label: "Unidad" },
                            { key: "cantidad", label: "Cantidad" },
                            { key: "precio_unitario", label: "Precio Unitario" },
                            { key: "total", label: "Total" },
                        ],
                        formFields: [
                            { name: "descripcion", label: "Descripción", required: true },
                            { name: "unidad", label: "Unidad", required: true },
                            { name: "precio_unitario", label: "Precio Unitario", type: "number" },
                        ],
                        onRefetch: refetchLogistica,
                    })}
                </div>
            </Modal>
        </>
    );
}
