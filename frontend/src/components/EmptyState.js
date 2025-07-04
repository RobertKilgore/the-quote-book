import React from "react";

export default function EmptyState({ title, message }) {
  return (
    <div className="flex justify-center items-center h-96">
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-blue-600 mb-4">{title}</h2>
        <p className="text-xl text-gray-700">{message}</p>
      </div>
    </div>
  );
}