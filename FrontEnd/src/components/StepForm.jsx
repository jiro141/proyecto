import React, { useState, useEffect } from "react";

const StepForm = ({ steps, onSubmit, initialValues = {} }) => {

  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialValues);

  // Sincroniza formData si cambian los valores iniciales (por edición)
  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const step = steps[currentStep];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleFinalSubmit} className="space-y-6">
      <div
        className={`grid gap-4 ${
          step.fields.length > 3 ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        {step.fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>

            {field.type === "select" ? (
              <select
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required={field.required}
              >
                <option value="">-------</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || "text"}
                name={field.name}
                value={formData[field.name] ?? ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required={field.required}
              />
            )}
          </div>
        ))}
      </div>

      {/* BOTONES DE CONTROL */}
      <div className="flex items-center justify-between pt-4 gap-4">
        {step.actions?.map((action, index) => (
          <button
            key={index}
            type="button"
            onClick={action.onClick}
            className="bg-[#0b2c4d] hover:bg-[#143d65] text-white font-semibold px-6 py-2 rounded transition duration-200"
          >
            {action.label}
          </button>
        ))}

        {currentStep > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            Atrás
          </button>
        )}

        <div className="ml-auto">
          {!isLastStep ? (
            <button
              type="button"
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              className="bg-[#e53935] hover:bg-[#c2302d] text-white font-semibold px-6 py-2 rounded transition duration-200"
            >
              Enviar
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default StepForm;
