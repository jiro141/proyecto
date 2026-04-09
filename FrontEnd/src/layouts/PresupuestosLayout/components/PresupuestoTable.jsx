import { useState, useEffect } from "react";
import { FaPlus, FaMinus, FaEdit } from "react-icons/fa";
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
    const rows = dataSource || presupuestoData?.[tipo] || [];
    const [localData, setLocalData] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({});

    // ✅ Helper para verificar si un item está seleccionado (cantidad > 0)
    const isItemSelected = (item) => Number(item.cantidad || 0) > 0;

    useEffect(() => {
        setLocalData(rows);
    }, [rows]);

    const handleCantidadChange = (id, val) => {
        const actualizados = localData.map((r) =>
            r.id === id ? { ...r, cantidad: Math.max(Number(val), 0) } : r
        );
        setLocalData(actualizados);
        if (setPresupuestoData) {
            setPresupuestoData((prev) => ({ ...prev, [tipo]: actualizados }));
        }
    };

    const handleCantidadStep = (id, delta) => {
        const actualizados = localData.map((r) =>
            r.id === id ? { ...r, cantidad: Math.max(r.cantidad + delta, 0) } : r
        );
        setLocalData(actualizados);
        if (setPresupuestoData) {
            setPresupuestoData((prev) => ({ ...prev, [tipo]: actualizados }));
        }
    };

    const handleCantidadClick = (e) => {
        e.stopPropagation();
    };

    const handleAddClick = () => {
        setEditItem(null);
        setFormData({});
        setModalOpen(true);
    };

    const handleRowClick = (e, item) => {
        e.stopPropagation();
        if (item.id && item.id > 0) {
            const actualizados = rows.map((r) =>
                r.id === item.id ? { ...r, cantidad: r.cantidad || 1 } : r
            );
            if (setPresupuestoData) {
                setPresupuestoData((prev) => ({ ...prev, [tipo]: actualizados }));
            }
            toast.success("Registro agregado al APU");
        } else {
            setEditItem(item);
            setFormData(item);
            setModalOpen(true);
        }
    };

    const handleFormChange = (fieldName, value) => {
        setFormData((prev) => ({ ...prev, [fieldName]: value }));
    };

    const handleFormSubmit = async () => {
        try {
            let response;
            
            if (tipo === "herramientas") {
                if (editItem && editItem.id) {
                    response = await updateHerramienta(editItem.id, formData);
                    toast.success("Herramienta actualizada");
                } else {
                    response = await createHerramienta(formData);
                    toast.success("Herramienta creada");
                }
            } else if (tipo === "mano_obra") {
                if (editItem && editItem.id) {
                    response = await updateEmpleado(editItem.id, formData);
                    toast.success("Empleado actualizado");
                } else {
                    response = await createEmpleado(formData);
                    toast.success("Empleado creado");
                }
            } else if (tipo === "logistica") {
                if (editItem && editItem.id) {
                    response = await updateLogistica(editItem.id, formData);
                    toast.success("Logística actualizada");
                } else {
                    response = await createLogistica(formData);
                    toast.success("Logística creada");
                }
            }

            if (response) {
                if (editItem && editItem.id) {
                    const actualizados = rows.map((r) =>
                        r.id === editItem.id ? { ...r, ...formData } : r
                    );
                    if (setPresupuestoData) {
                        setPresupuestoData((prev) => ({ ...prev, [tipo]: actualizados }));
                    }
                } else {
                    // ✅ Agregar con cantidad = 1 (como stock y consumibles)
                    const nuevo = { id: response.id || Date.now(), cantidad: 1, ...formData };
                    if (setPresupuestoData) {
                        setPresupuestoData((prev) => ({
                            ...prev,
                            [tipo]: [...rows, nuevo],
                        }));
                    }
                }
                if (onRefetch) onRefetch();
            }
        } catch (error) {
            console.error("Error al guardar:", error);
            toast.error("Error al guardar en el backend");
        }
        setModalOpen(false);
        setEditItem(null);
    };

    useEffect(() => {
        if (!presupuestoData || !setPresupuestoData) return;
        const total = localData.reduce((acc, r) => {
            const precio = getPrecio(r);
            return acc + (Number(r.cantidad) || 0) * precio;
        }, 0);
        setPresupuestoData((prev) => ({
            ...prev,
            [`${tipo}_total`]: total,
        }));
    }, [localData]);

    // Obtener el campo de precio según el tipo
    const getPrecio = (item) => {
        // Para herramientas usar depreciacion_bs_hora
        // Para mano_obra y logistica usar precio_unitario
        let val = 0;
        if (tipo === "herramientas") {
            val = item.depreciacion_bs_hora || 0;
        } else if (tipo === "mano_obra" || tipo === "logistica") {
            val = item.precio_unitario || 0;
        } else {
            val = item.costo || item.precio_unitario || 0;
        }
        return Number(val) || 0;
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
                        {localData.map((item) => (
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
                                <td className="text-center" onClick={(e) => handleCantidadClick(e)}>
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
                                                handleCantidadChange(item.id, parseFloat(e.target.value))
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
                onClose={() => { setModalOpen(false); setEditItem(null); }}
                title={editItem ? `Editar ${titulo}` : `Agregar ${titulo}`}
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
                                onClick={() => { setModalOpen(false); setEditItem(null); }}
                                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleFormSubmit}
                                className="bg-[#e53935] hover:bg-[#c2302d] text-white px-4 py-2 rounded"
                            >
                                {editItem ? "Actualizar" : "Crear"}
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
