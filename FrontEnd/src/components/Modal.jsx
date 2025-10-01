import React from "react";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg relative">
        
        {/* Encabezado con fondo azul y texto blanco */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#0b2c4d] rounded-t-lg">
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
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
