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
}) {
    const catalogItems = dataSource || [];
    
    const selectedItems = Array.isArray(presupuestoData?.[tipo]) ? presupuestoData[tipo] : [];
    
    const selectedMap = {};
    if (Array.isArray(selectedItems)) {
        selectedItems.forEach(item => {
            selectedMap[item.id] = item;
        });
    }
    
    const displayItems = catalogItems.map(item => {
        const selected = selectedMap[item.id];
        if (selected) {
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
        const nuevaCantidad = Math.max(Number(val), 0);
        
        const updatedItems = displayItems.map((r) =>
            r.id === id ? { ...r, cantidad: nuevaCantidad } : r
        );
        
        const cantidadMap = {};
        updatedItems.forEach(item => {
            cantidadMap[item.id] = item.cantidad;
        });
        
        const itemsActualizados = catalogItems.map(item => {
            if (cantidadMap[item.id] !== undefined) {
                return { ...item, cantidad: cantidadMap[item.id] };
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
        
        const updatedItems = displayItems.map((r) =>
            r.id === id ? { ...r, cantidad: Math.max(currentCantidad + delta, 0) } : r
        );
        
        const cantidadMap = {};
        updatedItems.forEach(item => {
            cantidadMap[item.id] = item.cantidad;
        });
        
        const itemsActualizados = catalogItems.map(item => {
            if (cantidadMap[item.id] !== undefined) {
                return { ...item, cantidad: cantidadMap[item.id] };
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
            const updatedItems = displayItems.map((r) =>
                r.id === item.id ? { ...r, cantidad: 1 } : r
            );
            
            const cantidadMap = {};
            updatedItems.forEach(i => {
                cantidadMap[i.id] = i.cantidad;
            });
            
            const itemsFiltrados = catalogItems.map(item => {
                if (cantidadMap[item.id] !== undefined) {
                    return { ...item, cantidad: cantidadMap[item.id] };
                }
                return item;
            }).filter(i => Number(i.cantidad) > 0);
            
            if (setPresupuestoData) {
                setPresupuestoData((prev) => ({ ...prev, [tipo]: itemsFiltrados }));
            }
            toast.success("Registro agregado al APU");
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
                                <td 
                                    className="px-2 py-2 text-[#0B2C4D] font-semibold text-left cursor-pointer hover:underline"
                                    onClick={(e) => handleRowClick(e, item)}
                                >
                                    {item.descripcion}
                                </td>
                                <td className="text-center">{item.unidad}</td>
                                <td className="text-center">
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
                                <td className="text-center">
                                    ${Number(getPrecio(item)).toFixed(2)}
                                </td>
                                <td className="text-center">
                                    ${(item.cantidad * Number(getPrecio(item))).toFixed(2)}
                                </td>
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