import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function AuthForm({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [view, setView] = useState("login"); // login | signup | reset
  const [resetMsg, setResetMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) setErrorMsg(error.message);
    else if (onAuth) onAuth();
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    if (error) setErrorMsg(error.message);
    else setErrorMsg("Revisa tu email para confirmar la cuenta.");
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResetMsg("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (error) setResetMsg("Error: " + error.message);
    else setResetMsg("Si el correo existe, recibirás un enlace para recuperar tu contraseña.");
  };

  return (
    <div className="max-w-xs mx-auto mt-12 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-center">
        {view === "login" && "Iniciar sesión"}
        {view === "signup" && "Crear cuenta"}
        {view === "reset" && "Recuperar contraseña"}
      </h2>
      {(view === "login" || view === "signup") && (
        <form onSubmit={view === "login" ? handleLogin : handleSignup} className="space-y-4">
          <input
            className="w-full p-2 border rounded"
            type="email"
            placeholder="Correo"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <input
              className="w-full p-2 border rounded"
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-2 top-2 text-xs text-blue-600"
              tabIndex={-1}
            >
              {showPassword ? "Ocultar" : "Ver"}
            </button>
          </div>
          {errorMsg && <div className="text-red-600 text-sm">{errorMsg}</div>}
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded"
            disabled={loading}
          >
            {loading ? "Procesando..." : view === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>
      )}

      {view === "reset" && (
        <form onSubmit={handleReset} className="space-y-4">
          <input
            className="w-full p-2 border rounded"
            type="email"
            placeholder="Correo"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar enlace de recuperación"}
          </button>
          {resetMsg && <div className="text-green-600 text-sm">{resetMsg}</div>}
        </form>
      )}

      <div className="mt-4 text-center space-y-2">
        {view === "login" && (
          <>
            <button
              className="text-blue-600 text-xs"
              type="button"
              onClick={() => setView("signup")}
            >
              ¿No tienes cuenta? Regístrate
            </button>
            <br />
            <button
              className="text-blue-600 text-xs"
              type="button"
              onClick={() => setView("reset")}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </>
        )}
        {view === "signup" && (
          <>
            <button
              className="text-blue-600 text-xs"
              type="button"
              onClick={() => setView("login")}
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </>
        )}
        {view === "reset" && (
          <>
            <button
              className="text-blue-600 text-xs"
              type="button"
              onClick={() => setView("login")}
            >
              Volver al inicio de sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
}
