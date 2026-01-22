import { FaTools, FaHammer, FaWrench, FaPeopleCarry, FaTruck } from "react-icons/fa";

const buttons = [
    { key: "stock", icon: FaTools, label: "Ver Inventario de Ferretería" },
    { key: "consumibles", icon: FaHammer, label: "Ver Inventario de Consumibles" },
    { key: "herramientas", icon: FaWrench, label: "Ver Herramientas" },
    { key: "manoObra", icon: FaPeopleCarry, label: "Ver Mano de Obra" },
    { key: "logistica", icon: FaTruck, label: "Ver Logística" },
];

export default function Etapa2ActionButtons({ setOpenModal }) {
    return (
        <div className="col-span-2 flex flex-col gap-4">
            {buttons.map(({ key, icon: Icon, label }) => (
                <button
                    key={key}
                    onClick={() => setOpenModal(key)}
                    className="flex items-center justify-center gap-2 bg-[#0B2C4D] hover:bg-[#143D68] text-white font-semibold py-3 px-5 rounded-lg shadow transition-all"
                >
                    <Icon size={18} className="text-white" /> {label}
                </button>
            ))}
        </div>
    );
}
