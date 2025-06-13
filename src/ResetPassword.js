import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function ResetPassword() {
  const location = useLocation();
  const params = new URLSearchParams(location.hash.replace("#", "?"));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Opción: puedes agregar una validación si no hay token y el usuario no está autenticado
  // if (!access_token && !supabase.auth.user()) {
  //   return (
  //     <div className="max-w-xs mx-auto mt-12 p-6 bg-white rounded shadow">
  //       <h2 className="text-xl font-bold mb-4 text-center">Restablecer contraseña</h2>
  //       <p className="text-center text-red-600">Enlace de recuperación inválido o expirado.</p>
  //     </div>
  //   );
  // }

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);

    // Importante: autenticar sesión si hay tokens
    if (access_token && refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (sessionError) {
        setLoading(false);
        setMessage("Error de autenticación: " + sessionError.message);
        return;
      }
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setMessage("Error: " + error.message);
    else setMessage("¡Contraseña cambiada! Ya puedes iniciar sesión.");
  };

  return (
    <div className="max-w-xs mx-auto mt-12 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-center">Restablecer contraseña</h2>
      <form onSubmit={handleReset} className="space-y-4">
        <input
          className="w-full p-2 border rounded"
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          className="w-full p-2 border rounded"
          type="password"
          placeholder="Confirmar contraseña"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
          disabled={loading}
        >
          {loading ? "Cambiando..." : "Cambiar contraseña"}
        </button>
      </form>
      {message && <div className="mt-4 text-center text-red-600">{message}</div>}
    </div>
  );
}
