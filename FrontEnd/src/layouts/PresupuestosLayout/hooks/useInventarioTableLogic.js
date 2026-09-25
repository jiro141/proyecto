import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import useInventario from "../../../hooks/useInvetario";
import { createItem, updateItem } from "../../../api/controllers/Inventario";
import { usePresupuesto } from "../../../context/PresupuestoContext";
import { notifyError } from "../../../api/apiErrors";

const round2 = (n) => Math.round(n * 100) / 100;

// Precio de un material con y sin el 15% de utilidad del inventario.
// - Items del catálogo de ferretería traen utilidad_15 → se calcula desde costo base.
// - Items persistidos en el APU ya traen ambos precios resueltos.
export const getPreciosMaterial = (item) => {
    if (item.utilidad_15 !== undefined) {
        const costo = Number(item.costo) || 0;
        const factor = Number(item.factor_conversion) || 0;
        return {
            conUtilidad: Number(item.mts_ml_m2 ?? item.utilidad_15 ?? item.costo ?? 0),
            sinUtilidad: factor > 0 ? round2(costo / factor) : costo,
        };
    }
    const precio = Number(item.costo ?? 0);
    return {
        conUtilidad: Number(item.precio_con_utilidad ?? precio),
        sinUtilidad: Number(item.precio_sin_utilidad ?? precio),
    };
};

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

    // Solo ferretería (stock) lleva el 15% de utilidad desde el inventario
    const [sinUtilidad, setSinUtilidad] = useState(() => {
        const inicial = {};
        if (tipo !== "stock") return inicial;

        apuActual?.materiales?.stock_almacen?.forEach((item) => {
            if (item.sin_utilidad) inicial[item.id] = true;
        });

        return inicial;
    });

    // ======== Hook Inventario ========
    const { data: fetchedData, loading, error, refetch, page, setPage, pagination } =
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
    const getPrecio = (item, sinUtilObj = sinUtilidad) => {
        const precios = getPreciosMaterial(item);
        return sinUtilObj[item.id] ? precios.sinUtilidad : precios.conUtilidad;
    };

    const calcularTotalCategoria = (cantidadesObj, despObj, sinUtilObj) => {
        if (!data) return 0;
        return data.reduce((acc, item) => {
            const cantidad = cantidadesObj[item.id] || 0;
            const desp = despObj[item.id] || 0;
            const precio = getPrecio(item, sinUtilObj);
            return acc + cantidad * (1 + desp / 100) * precio;
        }, 0);
    };

    const SECTION_BY_TIPO = {
        stock: "stock_almacen",
        consumibles: "consumibles",
        epps: "epps",
    };

    // Sincroniza total + items seleccionados con el padre y el contexto del APU
    const sincronizarMateriales = (cantidadesObj, despObj, sinUtilObj) => {
        const totalCategoria = calcularTotalCategoria(
            cantidadesObj,
            despObj,
            sinUtilObj
        );

        const itemsActualizados = data
            .filter((item) => (cantidadesObj[item.id] || 0) > 0)
            .map((item) => {
                const precios = getPreciosMaterial(item);
                return {
                    id: item.id,
                    codigo: item.codigo,
                    descripcion: item.descripcion,
                    cantidad: cantidadesObj[item.id],
                    desp: despObj[item.id] || 0,
                    costo: getPrecio(item, sinUtilObj),
                    sin_utilidad: !!sinUtilObj[item.id],
                    precio_con_utilidad: precios.conUtilidad,
                    precio_sin_utilidad: precios.sinUtilidad,
                };
            });

        onTotalChange?.(tipo, totalCategoria, itemsActualizados);
        updateAPUMateriales(SECTION_BY_TIPO[tipo], itemsActualizados);
    };

    // ======== Handlers ========
    const handleCantidadInputChange = (id, value) => {
        setCantidades((prev) => {
            const nuevo = Math.max(Number(value) || 0, 0);
            const actualizado = { ...prev, [id]: nuevo };

            onCantidadChange?.(id, nuevo);
            sincronizarMateriales(actualizado, depreciaciones, sinUtilidad);

            return actualizado;
        });
    };

    const handleCantidadChange = (id, delta) => {
        setCantidades((prev) => {
            const actual = prev[id] || 0;
            const nuevo = Math.max(actual + delta, 0);
            const actualizado = { ...prev, [id]: nuevo };

            onCantidadChange?.(id, nuevo);
            sincronizarMateriales(actualizado, depreciaciones, sinUtilidad);

            return actualizado;
        });
    };

    const handleDepreciacionChange = (id, val) => {
        setDepreciaciones((prev) => {
            const actualizado = { ...prev, [id]: Number(val) || 0 };

            sincronizarMateriales(cantidades, actualizado, sinUtilidad);

            return actualizado;
        });
    };

    const handleToggleUtilidad = (id) => {
        setSinUtilidad((prev) => {
            const actualizado = { ...prev, [id]: !prev[id] };

            sincronizarMateriales(cantidades, depreciaciones, actualizado);

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
            notifyError(err, `Error al guardar ${tipo}`);
        }
    };

    // ======== Return ========
    return {
        query,
        setQuery,
        data,
        cantidades,
        depreciaciones,
        sinUtilidad,
        getPrecio,
        handleCantidadChange,
        handleCantidadInputChange,
        handleDepreciacionChange,
        handleToggleUtilidad,
        handleRowClick,
        isModalOpen,
        setModalOpen,
        editItem,
        handleSubmit,
        loading,
        error,
        refetch,
        page,
        setPage,
        pagination,
    };
};
