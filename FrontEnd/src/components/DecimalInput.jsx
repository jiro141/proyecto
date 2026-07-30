import { useState, useEffect } from "react";

export default function DecimalInput({ value, onChange, className = "", ...props }) {
  const [raw, setRaw] = useState(() => String(value ?? ""));

  useEffect(() => {
    setRaw(String(value ?? ""));
  }, [value]);

  const handleChange = (e) => {
    const rawVal = e.target.value;
    if (/^\d*[.,]?\d*$/.test(rawVal) || rawVal === "") {
      setRaw(rawVal);
      const normalized = rawVal.replace(",", ".");
      const numVal = rawVal === "" || rawVal === "." || rawVal === "," ? 0 : parseFloat(normalized) || 0;
      onChange?.(numVal);
    }
  };

  const handleBlur = () => {
    setRaw(String(value ?? ""));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={raw}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      {...props}
    />
  );
}
