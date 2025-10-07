import { useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";

export default function CalendarioCard({ fecha, onFechaChange }) {
  const today = fecha ? new Date(fecha) : new Date();

  const [day, setDay] = useState(today.getDate());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const years = Array.from({ length: 6 }, (_, i) => today.getFullYear() + i);

  const handleChange = (newDay, newMonth, newYear) => {
    const date = new Date(newYear, newMonth - 1, newDay);
    onFechaChange?.(date);
  };

  return (
    <div
      className="relative bg-white shadow-md rounded-lg p-4 pt-10 overflow-visible transition-all duration-200 flex flex-col"
      style={{
        minHeight: "200px",
        maxHeight: "200px",
      }}
    >
      {/* Icono flotante */}
      <div
        className="absolute -top-4 left-5 w-12 h-12 flex items-center justify-center rounded-lg shadow-md"
        style={{ backgroundColor: "#0B2C4D", color: "white" }}
      >
        <FaCalendarAlt size={20} />
      </div>

      {/* Contenido */}
      <div className="flex flex-col justify-start flex-grow">
        <p className="text-sm text-gray-500 mb-3">
          Fecha estimada de culminación
        </p>

        <div className="flex gap-3 justify-center items-center flex-grow">
          {/* Día */}
          <select
            value={day}
            onChange={(e) => {
              const newDay = Number(e.target.value);
              setDay(newDay);
              handleChange(newDay, month, year);
            }}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-20"
          >
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Mes */}
          <select
            value={month}
            onChange={(e) => {
              const newMonth = Number(e.target.value);
              setMonth(newMonth);
              handleChange(day, newMonth, year);
            }}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-32"
          >
            {months.map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>

          {/* Año */}
          <select
            value={year}
            onChange={(e) => {
              const newYear = Number(e.target.value);
              setYear(newYear);
              handleChange(day, month, newYear);
            }}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-24"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
