import React from "react";
import { HiX } from "react-icons/hi";

const Alert = ({ type = "info", message, onClose }) => {
  const alertClasses = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    success: "bg-green-50 text-green-800 border-green-200",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
    error: "bg-red-50 text-red-800 border-red-200",
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
