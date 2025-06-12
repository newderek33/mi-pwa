import React, { useEffect, useState } from "react";

export default function ConfirmAccount() {
  const [message, setMessage] = useState("Verificando...");

  useEffect(() => {
    setTimeout(() => {
      setMessage("¡Tu correo ha sido confirmado! Ya puedes iniciar sesión.");
    }, 2000);
  }, []);

  return (
    <div className="max-w-xs mx-auto mt-12 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-center">Confirmación de registro</h2>
      <div className="text-center mt-4 text-green-700">{message}</div>
    </div>
  );
}
