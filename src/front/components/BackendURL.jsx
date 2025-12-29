import React from "react";

export const BackendURL = () => {

  if (import.meta.env.PROD) return null;

  return (
    <div className="mt-5 pt-5 w-50 mx-auto">
      <h2>Missing BACKEND_URL env variable</h2>
      <p>
        Estás en modo desarrollo. Revisa tu <code>.env</code> y define{" "}
        <code>VITE_BACKEND_URL</code> si quieres apuntar a un backend externo.
      </p>
    </div>
  );
};
