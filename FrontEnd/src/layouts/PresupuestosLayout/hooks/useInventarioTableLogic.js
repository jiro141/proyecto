import { useState, useEffect, useMemo } from "react";
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
    const [cantidades, setCantidades] = useState({});
    const [depreciaciones, setDepreciaciones] = useState({});
    const [isModalOpen, setModalOpen] = useState(false);
    const [isDeptModalOpen, setDeptModalOpen] = useState(false);
    const [isProvModalOpen, setProvModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);

    // ======== Hook de Inventario (búsqueda) ========
    const { data: fetchedData, loading, error, refetch } = useInventario(tipo, query);

    // ======== Contexto de Presupuesto ========
    const { formData, currentAPUIndex, updateAPUSection } = usePresupuesto();

    // ======== Fusión inteligente ========
    const data = useMemo(() => {
        const persisted = Array.isArray(externalData) ? externalData : [];
        const fetched = Array.isArray(fetchedData) ? fetchedData : [];

        // Si no hay búsqueda activa y fetchedData está vacío,
        // devolvemos directamente los datos persistidos
        if (!query && fetched.length === 0) return persisted;

        // 🔹 Combina fetched + persisted (manteniendo cantidades y desp)
        const merged = fetched.map((item) => {
            const saved = persisted.find((x) => x.id === item.id);
            return saved
                ? { ...item, cantidad: saved.cantidad || 0, desp: saved.desp || 0 }
                : { ...item, cantidad: 0, desp: 0 };
        });

        // 🔹 Añadimos los persistidos que no están en la búsqueda actual
        const extras = persisted.filter((p) => !merged.some((m) => m.id === p.id));

        // 🔹 Si no hay fetched y tampoco query, devolvemos persistidos
        if (merged.length === 0 && extras.length > 0 && !query) {
            return extras;
        }

        return [...merged, ...extras];
    }, [fetchedData, externalData, query]);

    // ======== Inicializar cantidades y depreciaciones ========
    useEffect(() => {
        if (!data || !Array.isArray(data)) return;

        const cantidadesIniciales = {};
        const depreciacionesIniciales = {};

        data.forEach((item) => {
            if (item.cantidad && Number(item.cantidad) > 0)
                cantidadesIniciales[item.id] = Number(item.cantidad);
            if (item.desp && Number(item.desp) > 0)
                depreciacionesIniciales[item.id] = Number(item.desp);
        });

        setCantidades(cantidadesIniciales);
        setDepreciaciones(depreciacionesIniciales);
    }, [data]);

    // ======== Sincronización con contexto ========
    const updatePresupuestoMateriales = (tipo, items) => {
        const apuActual = formData.apus?.[currentAPUIndex] || {};
        const materiales = apuActual.materiales || {};

        const target =
            tipo === "stock"
                ? "stock_almacen"
                : tipo === "consumibles"
                    ? "consumibles"
                    : null;

        if (!target) return;

        const nuevosMateriales = { ...materiales, [target]: items };
        updateAPUSection("materiales", nuevosMateriales);
    };

    // ======== Calcular total ========
    const calcularTotalCategoria = (cantidadesObj, despObj) => {
        if (!data) return 0;
        return data.reduce((acc, item) => {
            const cantidad = cantidadesObj[item.id] || 0;
            const desp = despObj[item.id] || 0;
            const precio = Number(item.mts_ml_m2 ?? item.utilidad_15 ?? item.costo ?? 0);
            return acc + cantidad * (1 + desp / 100) * precio;
        }, 0);
    };

    // ======== Manejadores ========
    const handleCantidadChange = (id, delta) => {
        setCantidades((prev) => {
            const actual = prev[id] || 0;
            const nuevo = Math.max(actual + delta, 0);
            const actualizado = { ...prev, [id]: nuevo };

            onCantidadChange?.(id, nuevo);
            const totalCategoria = calcularTotalCategoria(actualizado, depreciaciones);

            const itemsActualizados = data
                .filter((item) => (actualizado[item.id] || 0) > 0)
                .map((item) => ({
                    id: item.id,
                    codigo: item.codigo,
                    descripcion: item.descripcion,
                    cantidad: actualizado[item.id] || 0,
                    desp: depreciaciones[item.id] || 0,
                    costo: Number(item.mts_ml_m2 ?? item.utilidad_15 ?? item.costo ?? 0),
                }));

            onTotalChange?.(tipo, totalCategoria, itemsActualizados);
            updatePresupuestoMateriales(tipo, itemsActualizados);

            return actualizado;
        });
    };

    const handleDepreciacionChange = (id, val) => {
        setDepreciaciones((prev) => {
            const actualizado = { ...prev, [id]: Number(val) || 0 };
            const totalCategoria = calcularTotalCategoria(cantidades, actualizado);

            const itemsActualizados = data
                .filter((item) => (cantidades[item.id] || 0) > 0)
                .map((item) => ({
                    id: item.id,
                    codigo: item.codigo,
                    descripcion: item.descripcion,
                    cantidad: cantidades[item.id] || 0,
                    desp: actualizado[item.id] || 0,
                    costo: Number(item.mts_ml_m2 ?? item.utilidad_15 ?? item.costo ?? 0),
                }));

            onTotalChange?.(tipo, totalCategoria, itemsActualizados);
            updatePresupuestoMateriales(tipo, itemsActualizados);

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
            if (editItem && editItem.id) {
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
            console.error("Error al guardar:", err);
            toast.error(`Error al guardar ${tipo}`);
        }
    };

    const handleNewDept = async (formData) => {
        try {
            await createItem("departamento", formData);
            toast.success("Departamento creado");
            refetchDepartamentos?.();
            setDeptModalOpen(false);
        } catch {
            toast.error("Error al crear departamento");
        }
    };

    const handleNewProveedor = async (formData) => {
        try {
            await createItem("proveedores", formData);
            toast.success("Proveedor creado exitosamente");
            refetchProveedores?.();
            setProvModalOpen(false);
            refetch();
        } catch (err) {
            console.error("Error al crear proveedor:", err);
            toast.error("Error al crear proveedor");
        }
    };

    // ======== Retorno ========
    return {
        query,
        setQuery,
        data,
        cantidades,
        depreciaciones,
        handleCantidadChange,
        handleDepreciacionChange,
        handleRowClick,
        isModalOpen,
        setModalOpen,
        editItem,
        handleSubmit,
        isDeptModalOpen,
        setDeptModalOpen,
        handleNewDept,
        isProvModalOpen,
        setProvModalOpen,
        handleNewProveedor,
        loading,
        error,
        refetch,
    };
};
