import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import useInventario from "../../../hooks/useInvetario";
import { createItem, updateItem } from "../../../api/controllers/Inventario";
import { usePresupuesto } from "../../../context/PresupuestoContext";

export const useInventarioTableLogic = ({
    tipo,
    externalData = [],
    departamentos = [],
    proveedores = [],
    ubicaciones = [],
    lugares = [],
    onCantidadChange,
    onTotalChange,
    refetchDepartamentos,
    refetchProveedores,
}) => {
    // ======== Estados internos ========
    const [query, setQuery] = useState("");
    const [isModalOpen, setModalOpen] = useState(false);
    const [isDeptModalOpen, setDeptModalOpen] = useState(false);
    const [isProvModalOpen, setProvModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);

    // ======== Contexto ========
    const {
        formData,
        currentAPUIndex,
        updateAPUMateriales,
    } = usePresupuesto();

    const apuActual = formData.apus?.[currentAPUIndex];

    // ======== Estados de inputs (inicializados UNA VEZ) ========
    const [cantidades, setCantidades] = useState(() => {
        const inicial = {};
        const materiales =
            tipo === "stock"
                ? apuActual?.materiales?.stock_almacen
                : tipo === "consumibles"
                ? apuActual?.materiales?.consumibles
                : tipo === "epps"
                ? apuActual?.materiales?.epps
                : [];

        materiales?.forEach((item) => {
            inicial[item.id] = Number(item.cantidad) || 0;
        });

        return inicial;
    });

    const [depreciaciones, setDepreciaciones] = useState(() => {
        const inicial = {};
        const materiales =
            tipo === "stock"
                ? apuActual?.materiales?.stock_almacen
                : tipo === "consumibles"
                ? apuActual?.materiales?.consumibles
                : tipo === "epps"
                ? apuActual?.materiales?.epps
                : [];

        materiales?.forEach((item) => {
            inicial[item.id] = Number(item.desp) || 0;
        });

        return inicial;
    });

    // ======== Hook Inventario ========
    const { data: fetchedData, loading, error, refetch } =
        useInventario(tipo, query);

    // ======== Data fusionada (SOLO para render) ========
    const data = useMemo(() => {
        const persisted = Array.isArray(externalData) ? externalData : [];
        const fetched = Array.isArray(fetchedData) ? fetchedData : [];

        if (!query && fetched.length === 0) return persisted;

        const merged = fetched.map((item) => {
            const saved = persisted.find((x) => x.id === item.id);
            return saved
                ? { ...item, cantidad: saved.cantidad || 0, desp: saved.desp || 0 }
                : { ...item, cantidad: 0, desp: 0 };
        });

        const extras = persisted.filter(
            (p) => !merged.some((m) => m.id === p.id)
        );

        return [...merged, ...extras];
    }, [fetchedData, externalData, query]);

    // ======== Util ========
    const calcularTotalCategoria = (cantidadesObj, despObj) => {
        if (!data) return 0;
        return data.reduce((acc, item) => {
            const cantidad = cantidadesObj[item.id] || 0;
            const desp = despObj[item.id] || 0;
            const precio = Number(
                item.mts_ml_m2 ?? item.utilidad_15 ?? item.costo ?? 0
            );
            return acc + cantidad * (1 + desp / 100) * precio;
        }, 0);
    };

    const SECTION_BY_TIPO = {
        stock: "stock_almacen",
        consumibles: "consumibles",
        epps: "epps",
    };

    // ======== Handlers ========
    const handleCantidadInputChange = (id, value) => {
        setCantidades((prev) => {
            const nuevo = Math.max(Number(value) || 0, 0);
            const actualizado = { ...prev, [id]: nuevo };

            onCantidadChange?.(id, nuevo);

            const totalCategoria = calcularTotalCategoria(
                actualizado,
                depreciaciones
            );

            const itemsActualizados = data
                .filter((item) => (actualizado[item.id] || 0) > 0)
                .map((item) => ({
                    id: item.id,
                    codigo: item.codigo,
                    descripcion: item.descripcion,
                    cantidad: actualizado[item.id],
                    desp: depreciaciones[item.id] || 0,
                    costo: Number(
                        item.mts_ml_m2 ??
                            item.utilidad_15 ??
                            item.costo ??
                            0
                    ),
                }));

            onTotalChange?.(tipo, totalCategoria, itemsActualizados);
            updateAPUMateriales(
                SECTION_BY_TIPO[tipo],
                itemsActualizados
            );

            return actualizado;
        });
    };

    const handleCantidadChange = (id, delta) => {
        setCantidades((prev) => {
            const actual = prev[id] || 0;
            const nuevo = Math.max(actual + delta, 0);
            const actualizado = { ...prev, [id]: nuevo };

            onCantidadChange?.(id, nuevo);

            const totalCategoria = calcularTotalCategoria(
                actualizado,
                depreciaciones
            );

            const itemsActualizados = data
                .filter((item) => (actualizado[item.id] || 0) > 0)
                .map((item) => ({
                    id: item.id,
                    codigo: item.codigo,
                    descripcion: item.descripcion,
                    cantidad: actualizado[item.id],
                    desp: depreciaciones[item.id] || 0,
                    costo: Number(
                        item.mts_ml_m2 ??
                            item.utilidad_15 ??
                            item.costo ??
                            0
                    ),
                }));

            onTotalChange?.(tipo, totalCategoria, itemsActualizados);
            updateAPUMateriales(
                SECTION_BY_TIPO[tipo],
                itemsActualizados
            );

            return actualizado;
        });
    };

    const handleDepreciacionChange = (id, val) => {
        setDepreciaciones((prev) => {
            const actualizado = { ...prev, [id]: Number(val) || 0 };

            const totalCategoria = calcularTotalCategoria(
                cantidades,
                actualizado
            );

            const itemsActualizados = data
                .filter((item) => (cantidades[item.id] || 0) > 0)
                .map((item) => ({
                    id: item.id,
                    codigo: item.codigo,
                    descripcion: item.descripcion,
                    cantidad: cantidades[item.id] || 0,
                    desp: actualizado[item.id] || 0,
                    costo: Number(
                        item.mts_ml_m2 ??
                            item.utilidad_15 ??
                            item.costo ??
                            0
                    ),
                }));

            onTotalChange?.(tipo, totalCategoria, itemsActualizados);
            updateAPUMateriales(
                SECTION_BY_TIPO[tipo],
                itemsActualizados
            );

            return actualizado;
        });
    };

    // ======== CRUD ========
    const handleRowClick = (item) => {
        setEditItem(item);
        setModalOpen(true);
    };

    const handleSubmit = async (formData) => {
        try {
            if (editItem?.id) {
                await updateItem(tipo, editItem.id, formData);
                toast.success(`${tipo} actualizado con éxito`);
            } else {
                await createItem(tipo, formData);
                toast.success(`${tipo} creado con éxito`);
            }
            setModalOpen(false);
            setEditItem(null);
            refetch();
        } catch (err) {
            toast.error(`Error al guardar ${tipo}`);
        }
    };

    // ======== Return ========
    return {
        query,
        setQuery,
        data,
        cantidades,
        depreciaciones,
        handleCantidadChange,
        handleCantidadInputChange,
        handleDepreciacionChange,
        handleRowClick,
        isModalOpen,
        setModalOpen,
        editItem,
        handleSubmit,
        loading,
        error,
        refetch,
    };
};
