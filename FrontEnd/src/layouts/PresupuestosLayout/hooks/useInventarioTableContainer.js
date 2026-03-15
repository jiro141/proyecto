import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { createItem, updateItem } from "../../../api/controllers/Inventario";

import useDepartamentos from "../../../hooks/useDepartamentos";
import useUbicaciones from "../../../hooks/useUbicaciones";
import useLugaresConsumo from "../../../hooks/useLugaresConsumo";
import useProveedores from "../../../hooks/useProveedores";

import { useInventarioTableLogic } from "./useInventarioTableLogic";

export function useInventarioTableContainer(props) {
    const { externalData, tipo, ubicaciones, lugares } = props;

    // === HOOKS BASE ===
    const { departamentos, refetch: refetchDepartamentos } = useDepartamentos();
    const { proveedores, refetch: refetchProveedores } = useProveedores();

    const logic = useInventarioTableLogic({
        tipo,
        externalData,
        departamentos,
        proveedores,
        ubicaciones,
        lugares,
        onCantidadChange: props.onCantidadChange,
        onTotalChange: props.onTotalChange,
        refetchDepartamentos,
        refetchProveedores,
    });

    // === MODALES ===
    const [editItem, setEditItem] = useState(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const [isDeptModalOpen, setDeptModalOpen] = useState(false);
    const [isProvModalOpen, setProvModalOpen] = useState(false);

    const tituloMap = {
        stock: "Ferretería",
        EPP: "E.P.P.",
        consumibles: "Consumible",
    };

    // === FORMULARIOS ===
    const formStep =
        tipo === "stock"
            ? [
                {
                    columns: 3,
                    fields: [
                        { name: "codigo", label: "Código", required: true },
                        { name: "descripcion", label: "Descripción", required: true },
                        {
                            name: "proveedor",
                            label: "Proveedor",
                            type: "select",
                            required: true,
                            fetchOnSearch: true,
                            fetchHook: useProveedores,
                            hookKey: "proveedores",
                        },
                        {
                            name: "departamento",
                            label: "Departamento",
                            type: "select",
                            required: true,
                            fetchOnSearch: true,
                            fetchHook: useDepartamentos,
                            hookKey: "departamentos",
                        },
                        { name: "pza", label: "Pieza", required: true },
                        { name: "costo_dolares", label: "Costo en dólares" },
                        { name: "costo_pesos", label: "Costo en pesos" },
                        { name: "envio", label: "Envío o Flete" },
                        { name: "factor_conversion", label: "Relación MTS ML M2" },
                        { name: "costo", label: "Costo", type: "number", disabled: true },
                        {
                            name: "utilidad_15",
                            label: "%15 de Utilidad",
                            type: "number",
                            disabled: true,
                        },
                        { name: "mts_ml_m2", label: "MTS ML M2", disabled: true },
                    ],
                    actions: [
                        { label: "Nuevo Departamento", onClick: () => setDeptModalOpen(true) },
                        { label: "Nuevo Proveedor", onClick: () => setProvModalOpen(true) },
                    ],
                },
            ]
            : [
                {
                    actions: [
                        { label: "Nuevo Departamento", onClick: () => setDeptModalOpen(true) },
                        { label: "Nuevo Proveedor", onClick: () => setProvModalOpen(true) },
                    ],
                    fields: [
                        { name: "codigo", label: "Código", required: true },
                        { name: "descripcion", label: "Descripción", required: true },
                        {
                            name: "departamento",
                            label: "Departamento",
                            type: "select",
                            required: true,
                            fetchOnSearch: true,
                            fetchHook: useDepartamentos,
                            hookKey: "departamentos",
                        },
                        {
                            name: "proveedor",
                            label: "Proveedor",
                            type: "select",
                            required: true,
                            fetchOnSearch: true,
                            fetchHook: useProveedores,
                            hookKey: "proveedores",
                        },
                        {
                            name: "ubicacion",
                            label: "Ubicación",
                            type: "select",
                            required: true,
                            fetchHook: useUbicaciones,
                            hookKey: "ubicaciones",
                        },
                        {
                            name: "consumo",
                            label: "Lugar de Consumo",
                            type: "select",
                            required: true,
                            fetchHook: useLugaresConsumo,
                            hookKey: "lugares",
                        },
                        { name: "unidad", label: "Pieza", required: true },
                        { name: "costo", label: "Costo", type: "number", required: true },
                    ],
                },
            ];

    // ================= ORDENAMIENTO (CLAVE) =================
    const sortedData = useMemo(() => {
        if (!logic.data) return [];

        return [...logic.data].sort((a, b) => {
            const cantA = logic.cantidades[a.id] || 0;
            const cantB = logic.cantidades[b.id] || 0;

            // seleccionados primero
            if (cantA > 0 && cantB === 0) return -1;
            if (cantA === 0 && cantB > 0) return 1;
            return 0;
        });
    }, [logic.data, logic.cantidades]);
    // === CRUD ===
    const handleSubmit = async (formData) => {
        try {
            if (editItem?.id) {
                await updateItem(tipo, editItem.id, formData);
                toast.success(`${tituloMap[tipo]} actualizado exitosamente`);
            } else {
                await createItem(tipo, formData);
                toast.success(`${tituloMap[tipo]} creado exitosamente`);
            }
            setModalOpen(false);
            setEditItem(null);
            logic.refetch();
        } catch {
            toast.error(`Error al guardar ${tituloMap[tipo]}`);
        }
    };

    const handleNewDept = async (formData) => {
        await createItem("departamentos", formData);
        toast.success("Departamento creado");
        refetchDepartamentos();
        setDeptModalOpen(false);
    };

    const handleNewProveedor = async (formData) => {
        await createItem("proveedores", formData);
        toast.success("Proveedor creado");
        refetchProveedores();
        setProvModalOpen(false);
    };

    return {
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
    };
}
