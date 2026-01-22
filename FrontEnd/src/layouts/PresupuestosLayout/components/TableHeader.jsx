import { FaSearch } from "react-icons/fa";
;
export default function TableHeader({ titulo, icon, query, setQuery, etapa }) {
  const final = etapa >= 0 ? true : false;

  console.log(etapa, 'final?');

  const title = titulo === "Resumen de Costos" ? true : false;
  return (
    <div className=" items-center justify-between mb-4">
      {title && (<div className="flex items-center">
        {
          !final && (<div
            className="absolute -top-5 left-5 w-12 h-12 flex items-center justify-center rounded-lg shadow-md"
            style={{ backgroundColor: "#0B2C4D", color: "white" }}
          >
            {icon}
          </div>)
        }
        <h2 className="text-lg font-bold text-gray-800">{titulo}</h2>
      </div>)}

      {!title && (
        <div className="flex justify-end mb-4">
          <FaSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={14}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar producto..."
            className="pl-8 pr-3 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C4D]"
          />
        </div>)}
    </div>
  );
}
