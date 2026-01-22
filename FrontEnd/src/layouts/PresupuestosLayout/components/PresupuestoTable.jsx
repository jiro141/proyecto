import { useEffect } from "react";
import { FaPlus, FaMinus } from "react-icons/fa";
import TableHeader from "./TableHeader";
import { toast } from "react-toastify";

export default function PresupuestoTable({
    titulo,
    tipo,
    columnas,
    presupuestoData,
    setPresupuestoData
}) {
    const rows = presupuestoData[tipo] || [];

    const handleCantidadChange = (id, val) => {
        const actualizados = rows.map((r) =>
            r.id === id ? { ...r, cantidad: Math.max(Number(val), 0) } : r
        );
        setPresupuestoData((prev) => ({ ...prev, [tipo]: actualizados }));
    };

    const handleCantidadStep = (id, delta) => {
        const actualizados = rows.map((r) =>
            r.id === id ? { ...r, cantidad: Math.max(r.cantidad + delta, 0) } : r
        );
        setPresupuestoData((prev) => ({ ...prev, [tipo]: actualizados }));
    };

    const handleSubmit = (data, editItem) => {
        if (editItem) {
            const actualizados = rows.map((r) =>
                r.id === editItem.id ? { ...r, ...data } : r
            );
            setPresupuestoData((prev) => ({ ...prev, [tipo]: actualizados }));
            toast.success("Registro actualizado");
        } else {
            const nuevo = { id: Date.now(), cantidad: 0, ...data };
            setPresupuestoData((prev) => ({
                ...prev,
                [tipo]: [...rows, nuevo],
            }));
            toast.success("Registro agregado");
        }
    };

    useEffect(() => {
        const total = rows.reduce((acc, r) => acc + r.cantidad * r.costo, 0);
        setPresupuestoData((prev) => ({
            ...prev,
            [`${tipo}_total`]: total,
        }));
    }, [rows]);

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
                        {rows.map((item) => (
                            <tr key={item.id} className="border-b hover:bg-gray-50 text-sm">
                                <td className="px-2 py-2 text-[#0B2C4D] font-semibold text-left">
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
                                            step="any" // ← permite ingresar decimales
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
                                    ${item.costo.toFixed(2)}
                                </td>
                                <td className="text-center">
                                    ${(item.cantidad * item.costo).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    onClick={() =>
                        handleSubmit(
                            {
                                descripcion: "Nuevo registro",
                                unidad: "Día",
                                costo: 0,
                            },
                            null
                        )
                    }
                    className="px-4 py-2 bg-[#0B2C4D] text-white rounded-lg hover:bg-[#15385C] transition"
                >
                    + Agregar Registro
                </button>
            </div>
        </div>
    );
}
