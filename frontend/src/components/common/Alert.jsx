import React from "react";
import { HiX } from "react-icons/hi";

const Alert = ({ type = "info", message, onClose }) => {
  const alertClasses = {
    info: "bg-sky-50 text-sky-800 border-sky-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    error: "bg-rose-50 text-rose-800 border-rose-200",
  };

  return (
    <div
      className={`flex items-center justify-between p-4 mb-4 border rounded-lg ${alertClasses[type]}`}
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-gray-500 hover:text-gray-700"
        >
          <HiX className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Alert;
