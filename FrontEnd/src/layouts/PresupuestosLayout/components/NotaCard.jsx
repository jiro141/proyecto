import { FaRegFileAlt } from "react-icons/fa";
export default function NotaCard({
    titulo = "Nota",
    descripcion = "",
    onTituloChange = () => { },
    onDescripcionChange = () => { },
}) {
    return (
        <div
            className="relative bg-white shadow-md rounded-lg p-4 pt-10 overflow-visible transition-all duration-200"
            style={{
                minHeight: "200px",
                maxHeight: "200px",
            }}
        >
            {/* Icono flotante */}
            <div
                className="absolute -top-4 left-5 w-12 h-12 flex items-center justify-center rounded-lg z-[5] shadow-md"
                style={{ backgroundColor: "#0B2C4D", color: "white" }}
            >
                <FaRegFileAlt size={20} />
            </div>

            {/* Contenido */}
            <div className="pt-2 h-full flex flex-col">
                <p className="text-sm text-gray-500">Agregar nota</p>

                {/* Título */}
                <input
                    type="text"
                    value={titulo}
                    onChange={(e) => {
                        const value = e.target.value;
                        onTituloChange(value.trim() === "" ? "Nota" : value);
                    }}
                    placeholder="Título de la nota..."
                    className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 text-sm"
                />

                {/* Descripción */}
                <textarea
                    value={descripcion}
                    onChange={(e) => onDescripcionChange(e.target.value)}
                    placeholder="Descripción de la nota..."
                    className="mt-2 w-full flex-grow border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 text-sm"
                    style={{
                        minHeight: "70px",
                        maxHeight: "70px",
                    }}
                />
            </div>
        </div>
    );
}
