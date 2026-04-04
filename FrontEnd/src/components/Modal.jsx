import React, { useState, useEffect } from "react";

let modalCounter = 50;

const Modal = ({ isOpen, onClose, title, children, width, height }) => {
  const [zIndex, setZIndex] = useState(50);

  useEffect(() => {
    if (isOpen) {
      modalCounter += 10;
      setZIndex(modalCounter);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalWidth = width ? width : "max-w-lg";
  const modalHeight = height ? height : "";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex }}>
      <div
        className={`bg-white w-full ${modalWidth} ${modalHeight} rounded-lg shadow-lg relative flex flex-col`}
      >
        {/* Encabezado */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#0b2c4d] rounded-t-lg flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-3xl font-bold leading-none transition transform hover:scale-110"
            aria-label="Cerrar modal"
          >
            &times;
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
