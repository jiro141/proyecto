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
    handleTotalChange,
    departamentos = [],
    proveedores = [],
    ubicaciones = [],
    lugares = [],
    refetchDepartamentos,
    refetchProveedores,
}) {
    const { formData, currentAPUIndex, updateAPUSection } = usePresupuesto();
    const apuActual = formData.apus?.[currentAPUIndex] || {};

    // ======================================
    // 🔧 Guardar secciones tipo tabla (herramientas, mano_obra, logistica)
    // ======================================
    const handlePresupuestoTableChange = (section, updater) => {
        setPresupuestoData((prev) => {
            const newData = typeof updater === "function" ? updater(prev) : updater;
            const items = newData[section] || [];
            updateAPUSection(section, items);
            return newData;
        });
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
            >
                <PresupuestoTable
                    titulo="Costo de Herramientas"
                    tipo="herramientas"
                    columnas={[
                        { key: "descripcion", label: "Descripción" },
                        { key: "unidad", label: "Unidad" },
                        { key: "cantidad", label: "Cantidad" },
                        { key: "costo", label: "Depreciación (BS/Hora)" },
                        { key: "total", label: "Total" },
                    ]}
                    presupuestoData={presupuestoData}
                    setPresupuestoData={(updater) =>
                        handlePresupuestoTableChange("herramientas", updater)
                    }
                />
            </Modal>

            {/* === MANO DE OBRA === */}
            <Modal
                title="Mano de Obra"
                isOpen={openModal === "manoObra"}
                onClose={() => setOpenModal(null)}
                width="max-w-4xl"
            >
                <PresupuestoTable
                    titulo="Mano de Obra"
                    tipo="mano_obra"
                    columnas={[
                        { key: "descripcion", label: "Descripción" },
                        { key: "unidad", label: "Unidad" },
                        { key: "cantidad", label: "Cantidad" },
                        { key: "costo", label: "Precio Unitario" },
                        { key: "total", label: "Total" },
                    ]}
                    presupuestoData={presupuestoData}
                    setPresupuestoData={(updater) =>
                        handlePresupuestoTableChange("mano_obra", updater)
                    }
                />
            </Modal>

            {/* === LOGÍSTICA === */}
            <Modal
                title="Logística"
                isOpen={openModal === "logistica"}
                onClose={() => setOpenModal(null)}
                width="max-w-3xl"
            >
                <PresupuestoTable
                    titulo="Logística"
                    tipo="logistica"
                    columnas={[
                        { key: "descripcion", label: "Descripción" },
                        { key: "unidad", label: "Unidad" },
                        { key: "cantidad", label: "Cantidad" },
                        { key: "costo", label: "Precio Unitario" },
                        { key: "total", label: "Total" },
                    ]}
                    presupuestoData={presupuestoData}
                    setPresupuestoData={(updater) =>
                        handlePresupuestoTableChange("logistica", updater)
                    }
                />
            </Modal>
        </>
    );
}
