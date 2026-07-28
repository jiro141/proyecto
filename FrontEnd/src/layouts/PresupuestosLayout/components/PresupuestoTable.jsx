import { useState, useEffect } from "react";
import { FaPlus, FaMinus } from "react-icons/fa";
import TableHeader from "./TableHeader";
import { toast } from "react-toastify";
import Modal from "../../../components/Modal";
import {
  createHerramienta,
  updateHerramienta,
  createEmpleado,
  updateEmpleado,
  createLogistica,
  updateLogistica,
} from "../../../api/controllers/Inventario";

export default function PresupuestoTable({
    titulo,
    tipo,
    columnas,
    presupuestoData,
    setPresupuestoData,
    dataSource,
    loading,
    formFields,
    onRefetch,
    totalEmpleadosMO = 0, // 👥 para logística: empleados desde Mano de Obra
}) {
    const catalogItems = dataSource || [];
    
    const selectedItems = Array.isArray(presupuestoData?.[tipo]) ? presupuestoData[tipo] : [];
    
    const selectedMap = {};
    if (Array.isArray(selectedItems)) {
        selectedItems.forEach(item => {
            selectedMap[item.id] = item;
        });
    }

    // 👥 Para logística: días y empleados editables por item
    const esLogisticaConMO = tipo === "logistica" && Number(totalEmpleadosMO) > 0;
    const [diasLogistica, setDiasLogistica] = useState({});
    const [empleadosLogistica, setEmpleadosLogistica] = useState({});

    // Inicializar días y empleados desde la cantidad guardada en el contexto
    useEffect(() => {
        if (esLogisticaConMO) {
            const mo = Number(totalEmpleadosMO);
            setDiasLogistica((prev) => {
                const nuevos = { ...prev };
                selectedItems.forEach((item) => {
                    if (nuevos[item.id] === undefined) {
                        const emp = Number(item.empleados || mo);
                        nuevos[item.id] = emp > 0 ? Number(item.cantidad) / emp : 0;
                    }
                });
                return nuevos;
            });
            setEmpleadosLogistica((prev) => {
                const nuevos = { ...prev };
                selectedItems.forEach((item) => {
                    if (nuevos[item.id] === undefined) {
                        nuevos[item.id] = Number(item.empleados || mo);
                    }
                });
                return nuevos;
            });
        }
    }, [esLogisticaConMO, totalEmpleadosMO]);

    const getCantidadVisual = (item) => {
        if (esLogisticaConMO) {
            const selected = selectedMap[item.id];
            if (!selected) return 0;
            const emp = empleadosLogistica[item.id] ?? Number(selected.empleados || totalEmpleadosMO);
            return diasLogistica[item.id] !== undefined
                ? diasLogistica[item.id]
                : (emp > 0 ? Number(selected.cantidad) / emp : 0);
        }
        const selected = selectedMap[item.id];
        return selected ? selected.cantidad : 0;
    };
    
    const displayItems = catalogItems.map(item => {
        const selected = selectedMap[item.id];
        if (selected) {
            if (esLogisticaConMO) {
                return { ...item, cantidad: getCantidadVisual(item) };
            }
            return { ...item, cantidad: selected.cantidad };
        }
        return item;
    });
    
    const [isModalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({});

    const isItemSelected = (item) => Number(item.cantidad || 0) > 0;

    const getPrecio = (item) => {
        if (tipo === "herramientas") {
            return item.depreciacion_bs_hora || 0;
        }
        return item.precio_unitario || 0;
    };

    const handleCantidadChange = (id, val) => {
        const nuevoValor = Math.max(Number(val), 0);
        
        // Si es logística con MO: el input edita DÍAS, guardamos empleados × días
        if (esLogisticaConMO) {
            const emp = empleadosLogistica[id] ?? Number(totalEmpleadosMO);
            const dias = nuevoValor;
            setDiasLogistica(prev => ({ ...prev, [id]: dias }));
            const cantidadEfectiva = emp * dias;

            const itemsActualizados = catalogItems.map(item => {
                if (item.id === id) {
                    return {
                        ...item,
                        cantidad: cantidadEfectiva,
                        empleados: emp,
                    };
                }
                const selected = selectedMap[item.id];
                if (selected) {
                    return {
                        ...item,
                        cantidad: selected.cantidad,
                        empleados: selected.empleados,
                    };
                }
                return item;
            }).filter(item => Number(item.cantidad) > 0);

            if (setPresupuestoData) {
                setPresupuestoData((prev) => ({ ...prev, [tipo]: itemsActualizados }));
            }
            return;
        }

        // Comportamiento original para los demás tipos
        const updatedItems = displayItems.map((r) =>
            r.id === id ? { ...r, cantidad: nuevoValor } : r
        );
        
        const itemsActualizados = catalogItems.map(item => {
            const updated = updatedItems.find(u => u.id === item.id);
            if (updated) {
                return { ...item, cantidad: updated.cantidad };
            }
            return item;
        }).filter(item => Number(item.cantidad) > 0);
        
        if (setPresupuestoData) {
            setPresupuestoData((prev) => ({ ...prev, [tipo]: itemsActualizados }));
        }
    };

    const handleCantidadStep = (id, delta) => {
        const currentItem = displayItems.find(r => r.id === id);
        const currentCantidad = currentItem?.cantidad || 0;
        const nuevoValor = Math.max(currentCantidad + delta, 0);

        // Si es logística con MO, step suma/resta 1 día
        if (esLogisticaConMO) {
            const emp = empleadosLogistica[id] ?? Number(totalEmpleadosMO);
            const dias = nuevoValor;
            setDiasLogistica(prev => ({ ...prev, [id]: dias }));
            const cantidadEfectiva = emp * dias;

            const itemsActualizados = catalogItems.map(item => {
                if (item.id === id) {
                    return {
                        ...item,
                        cantidad: cantidadEfectiva,
                        empleados: emp,
                    };
                }
                const selected = selectedMap[item.id];
                if (selected) {
                    return {
                        ...item,
                        cantidad: selected.cantidad,
                        empleados: selected.empleados,
                    };
                }
                return item;
            }).filter(item => Number(item.cantidad) > 0);

            if (setPresupuestoData) {
                setPresupuestoData((prev) => ({ ...prev, [tipo]: itemsActualizados }));
            }
            return;
        }

        // Comportamiento original
        const updatedItems = displayItems.map((r) =>
            r.id === id ? { ...r, cantidad: nuevoValor } : r
        );
        
        const itemsActualizados = catalogItems.map(item => {
            const updated = updatedItems.find(u => u.id === item.id);
            if (updated) {
                return { ...item, cantidad: updated.cantidad };
            }
            return item;
        }).filter(item => Number(item.cantidad) > 0);
        
        if (setPresupuestoData) {
            setPresupuestoData((prev) => ({ ...prev, [tipo]: itemsActualizados }));
        }
    };

    const handleRowClick = (e, item) => {
        e.stopPropagation();
        
        const selectedItem = selectedMap[item.id];
        
        if (selectedItem) {
            setEditItem({ ...item, ...selectedItem });
            setFormData({ ...item, ...selectedItem });
            setModalOpen(true);
        } else {
            // Si es logística con MO, al seleccionar: 1 día = empleados × 1
            if (esLogisticaConMO) {
                const mo = Number(totalEmpleadosMO);
                const diasInicial = 1;
                setDiasLogistica(prev => ({ ...prev, [item.id]: diasInicial }));
                setEmpleadosLogistica(prev => ({ ...prev, [item.id]: mo }));
                const cantidadEfectiva = mo * diasInicial;

                const itemsFiltrados = [
                    ...catalogItems
                        .filter(i => selectedMap[i.id])
                        .map(i => ({
                            ...i,
                            cantidad: selectedMap[i.id].cantidad,
                            empleados: selectedMap[i.id].empleados,
                        })),
                    { ...item, cantidad: cantidadEfectiva, empleados: mo },
                ].filter(i => Number(i.cantidad) > 0);

                if (setPresupuestoData) {
                    setPresupuestoData((prev) => ({ ...prev, [tipo]: itemsFiltrados }));
                }
                toast.success("Registro agregado al APU");
                return;
            }

            const itemsFiltrados = [
                ...catalogItems
                    .filter(i => selectedMap[i.id])
                    .map(i => ({ ...i, cantidad: selectedMap[i.id].cantidad })),
                { ...item, cantidad: 1 },
            ].filter(i => Number(i.cantidad) > 0);
            
            if (setPresupuestoData) {
                setPresupuestoData((prev) => ({ ...prev, [tipo]: itemsFiltrados }));
            }
            toast.success("Registro agregado al APU");
        }
    };

    const handleEmpleadosChange = (id, val) => {
        const nuevoValor = Math.max(Number(val), 0);

        if (esLogisticaConMO) {
            const emp = nuevoValor;
            setEmpleadosLogistica(prev => ({ ...prev, [id]: emp }));

            // Obtener los días visuales actuales para este item
            const selected = selectedMap[id];
            const dias = diasLogistica[id] !== undefined
                ? diasLogistica[id]
                : (selected
                    ? (emp > 0 ? Number(selected.cantidad) / emp : 0)
                    : 0);

            const cantidadEfectiva = emp * dias;

            const itemsActualizados = catalogItems.map(item => {
                if (item.id === id) {
                    return {
                        ...item,
                        cantidad: cantidadEfectiva,
                        empleados: emp,
                    };
                }
                const sel = selectedMap[item.id];
                if (sel) {
                    return {
                        ...item,
                        cantidad: sel.cantidad,
                        empleados: sel.empleados,
                    };
                }
                return item;
            }).filter(item => Number(item.cantidad) > 0);

            if (setPresupuestoData) {
                setPresupuestoData((prev) => ({ ...prev, [tipo]: itemsActualizados }));
            }
        }
    };

    const handleAddClick = () => {
        setEditItem(null);
        setFormData({});
        setModalOpen(true);
    };

    const handleFormChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async () => {
        try {
            const data = {
                descripcion: formData.descripcion,
                unidad: formData.unidad || "und",
            };

            if (tipo === "herramientas") {
                data.depreciacion_bs_hora = parseFloat(formData.depreciacion_bs_hora) || 0;
            } else if (tipo === "mano_obra") {
                data.precio_unitario = parseFloat(formData.precio_unitario) || 0;
            } else if (tipo === "logistica") {
                data.precio_unitario = parseFloat(formData.precio_unitario) || 0;
            }

            if (editItem?.id && editItem.id > 0) {
                if (tipo === "herramientas") {
                    await updateHerramienta(editItem.id, data);
                } else if (tipo === "mano_obra") {
                    await updateEmpleado(editItem.id, data);
                } else if (tipo === "logistica") {
                    await updateLogistica(editItem.id, data);
                }
                toast.success("Registro actualizado");
            } else {
                if (tipo === "herramientas") {
                    await createHerramienta(data);
                } else if (tipo === "mano_obra") {
                    await createEmpleado(data);
                } else if (tipo === "logistica") {
                    await createLogistica(data);
                }
                toast.success("Registro creado");
            }

            setModalOpen(false);
            setEditItem(null);
            setFormData({});
            if (onRefetch) onRefetch();
        } catch (error) {
            console.error("Error guardando:", error);
            toast.error("Error al guardar");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full mb-2"></div>
                <p className="text-sm">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col h-full max-h-[calc(90vh-8rem)] min-h-[calc(65vh-8rem)]">
            <TableHeader query={""} setQuery={() => { }} />

            <div className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                <table className="w-full text-left border-collapse min-w-[520px]">
                    <thead className="sticky top-0 bg-white z-10">
                        <tr className="text-gray-500 text-xs uppercase border-b">
                            {columnas.map((col) => (
                                <th key={col.key} className="pb-2 px-2 text-center">
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayItems.map((item) => (
                            <tr 
                                key={item.id} 
                                className={`
                                    border-b text-sm transition-colors
                                    ${isItemSelected(item) 
                                        ? "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500" 
                                        : "hover:bg-gray-50"}
                                `}
                            >
                                {columnas.map((col) => {
                                    switch (col.key) {
                                        case "descripcion":
                                            return (
                                                <td
                                                    key={col.key}
                                                    className="px-2 py-2 text-[#0B2C4D] font-semibold text-left cursor-pointer hover:underline"
                                                    onClick={(e) => handleRowClick(e, item)}
                                                >
                                                    {item.descripcion}
                                                </td>
                                            );

                                        case "unidad":
                                            return (
                                                <td key={col.key} className="text-center">
                                                    {item.unidad}
                                                </td>
                                            );

                                        case "cantidad":
                                            return (
                                                <td key={col.key} className="text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleCantidadStep(item.id, -1)}
                                                            className="p-1 border rounded hover:bg-gray-100"
                                                        >
                                                            <FaMinus size={12} />
                                                        </button>

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="any"
                                                            value={item.cantidad}
                                                            onChange={(e) =>
                                                                handleCantidadChange(item.id, parseFloat(e.target.value) || 0)
                                                            }
                                                            className="w-16 border rounded text-center"
                                                        />

                                                        <button
                                                            onClick={() => handleCantidadStep(item.id, 1)}
                                                            className="p-1 border rounded hover:bg-gray-100"
                                                        >
                                                            <FaPlus size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            );

                                        case "empleados":
                                            return (
                                                <td key={col.key} className="text-center">
                                                    {esLogisticaConMO ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={empleadosLogistica[item.id] ?? Number(totalEmpleadosMO)}
                                                            onChange={(e) =>
                                                                handleEmpleadosChange(item.id, parseFloat(e.target.value) || 0)
                                                            }
                                                            className="w-16 border rounded text-center font-bold text-blue-600"
                                                        />
                                                    ) : "-"}
                                                </td>
                                            );

                                        case "precio_unitario":
                                        case "depreciacion_bs_hora":
                                            return (
                                                <td key={col.key} className="text-center">
                                                    ${Number(getPrecio(item)).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            );

                                        case "total":
                                            const valorTotal = (() => {
                                                const cant = esLogisticaConMO 
                                                    ? Number(empleadosLogistica[item.id] ?? totalEmpleadosMO) * item.cantidad 
                                                    : item.cantidad;
                                                return Math.round(cant * Number(getPrecio(item)) * 100) / 100;
                                            })();
                                            return (
                                                <td key={col.key} className="text-center">
                                                    ${valorTotal.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            );

                                        default:
                                            return <td key={col.key} className="text-center">-</td>;
                                    }
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleAddClick}
                    className="px-4 py-2 bg-[#0B2C4D] text-white rounded-lg hover:bg-[#15385C] transition"
                >
                    + Agregar Registro
                </button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => { setModalOpen(false); setEditItem(null); setFormData({}); }}
                title={editItem?.id && editItem.id > 0 ? `Editar ${titulo}` : `Agregar ${titulo}`}
                width="max-w-md"
            >
                {formFields && formFields.length > 0 ? (
                    <div className="space-y-4">
                        {formFields.map((field) => (
                            <div key={field.name}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {field.label}
                                </label>
                                <input
                                    type={field.type || "text"}
                                    value={formData[field.name] || ""}
                                    onChange={(e) => handleFormChange(field.name, e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    required={field.required}
                                />
                            </div>
                        ))}
                        <div className="flex justify-end gap-2 pt-4">
                            <button
                                onClick={() => { setModalOpen(false); setEditItem(null); setFormData({}); }}
                                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleFormSubmit}
                                className="bg-[#e53935] hover:bg-[#c2302d] text-white px-4 py-2 rounded"
                            >
                                {editItem?.id && editItem.id > 0 ? "Actualizar" : "Crear"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-gray-500">No hay campos configurados</p>
                )}
            </Modal>
        </div>
    );
}