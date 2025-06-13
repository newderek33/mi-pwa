import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function ConfirmAccount() {
  const location = useLocation();
  const [message, setMessage] = useState("Verificando...");

  useEffect(() => {
    // Lee el hash de la URL y crea un objeto con los parámetros
    const params = new URLSearchParams(location.hash.replace("#", "?"));
    const error = params.get("error");
    const errorDescription = params.get("error_description");
    const type = params.get("type");

    if (error) {
      setMessage("Error al confirmar tu correo: " + (errorDescription || error));
    } else if (type === "signup") {
      setMessage("¡Tu correo ha sido confirmado! Ya puedes iniciar sesión.");
    } else {
      setMessage("Confirmación procesada. Ya puedes iniciar sesión.");
    }
  }, [location]);

  return (
    <div className="max-w-xs mx-auto mt-12 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-center">Confirmación de registro</h2>
      <div className="text-center mt-4 text-green-700">{message}</div>
    </div>
  );
}
