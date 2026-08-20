/**
 * Helpers compartidos del módulo de Facturación.
 */

/** Formatea una fecha ISO (YYYY-MM-DD o datetime) a DD/MM/AAAA */
export const formatFecha = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${date.getFullYear()}`;
};

/** Convierte DD/MM/AAAA → YYYY-MM-DD para el backend */
export const toISODate = (fechaDDMMAAAA) => {
  const [dd, mm, yyyy] = fechaDDMMAAAA.split("/");
  return `${yyyy}-${mm}-${dd}`;
};

/** Valida que un string sea una fecha válida en formato DD/MM/AAAA */
export const esFechaValida = (str) => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(str || "")) return false;
  const [dd, mm, yyyy] = str.split("/").map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  return (
    date.getFullYear() === yyyy &&
    date.getMonth() === mm - 1 &&
    date.getDate() === dd
  );
};

/** Máscara de entrada DD/MM/AAAA (solo dígitos y barras automáticas) */
export const enmascararFecha = (value) => {
  const digits = (value || "").replace(/\D/g, "").slice(0, 8);
  let out = digits;
  if (digits.length > 4) {
    out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  } else if (digits.length > 2) {
    out = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return out;
};

/** Formatea un número como moneda con símbolo según la moneda */
export const formatMoneda = (value, moneda = "USD") => {
  const num = Number(value || 0);
  const formatted = num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return moneda === "BS" ? `Bs ${formatted}` : `$${formatted}`;
};

/** Redondea a 2 decimales */
export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Badge de estado de factura */
export const EstadoBadge = ({ estado }) => {
  const isEmitida = estado === "EMITIDA";
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
        isEmitida ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {isEmitida ? "Emitida" : "Anulada"}
    </span>
  );
};