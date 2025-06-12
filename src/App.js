import React, { useRef, useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import jsPDF from "jspdf";
import AuthForm from "./AuthForm";
import ResetPassword from "./ResetPassword";
import ConfirmAccount from "./ConfirmAccount";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function MainApp() {
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const fileInputRef = useRef(null);

  // Verifica sesión de usuario
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  // Carga registros solo del usuario actual
  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  function handleClear() {
    setText("");
    setImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  }

  async function fetchData() {
    setLoading(true);
    const { data, error } = await supabase
      .from("registros")
      .select("*")
      .order("id", { ascending: false });
    if (!error) setRecords(data);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    let imageUrl = "";
    let imagePath = "";

    if (image) {
      const { data, error } = await supabase.storage
        .from("imagenes")
        .upload(`imagen-${Date.now()}.png`, image);

      if (!error) {
        imagePath = data.path;
        imageUrl = supabase.storage
          .from("imagenes")
          .getPublicUrl(data.path).data.publicUrl;
      } else {
        alert("Error subiendo la imagen.");
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase
      .from("registros")
      .insert([{ texto: text, imagen: imageUrl, imagen_path: imagePath, usuario_id: user.id }]);
    if (!error) {
      setText("");
      setImage(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
      fetchData();
    } else {
      alert("Error guardando el registro.");
    }
    setLoading(false);
  }

  async function handleDelete(id, imagenPath) {
    if (imagenPath) {
      await supabase.storage.from("imagenes").remove([imagenPath]);
    }
    await supabase.from("registros").delete().eq("id", id);
    fetchData();
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  }

  function generarPDF(record) {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Registro", 10, 20);
    doc.text(`Texto: ${record.texto}`, 10, 40);

    if (record.imagen) {
      const img = new window.Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const maxWidth = pageWidth - margin * 2;
        const maxHeight = pageHeight - 100;

        let width = img.width;
        let height = img.height;

        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        const ratio = Math.min(widthRatio, heightRatio);

        width *= ratio;
        height *= ratio;

        doc.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          margin,
          50,
          width,
          height
        );
        doc.save("registro.pdf");
      };
      img.src = record.imagen;
    } else {
      doc.save("registro.pdf");
    }
  }

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRecords([]);
  };

  if (!user) return <AuthForm onAuth={fetchData} />;
  
  return (
    <div className="p-4 max-w-xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-primary mb-4">Formulario</h1>
        <button onClick={handleLogout} className="bg-red-600 text-white px-3 py-1 rounded">Salir</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un texto"
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="w-full"
        />
        {previewUrl && (
          <img src={previewUrl} alt="Previsualización" className="w-32 h-auto mt-2" />
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="bg-gray-200 px-4 py-2 rounded"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={fetchData}
            className="bg-blue-200 px-4 py-2 rounded"
          >
            Refrescar
          </button>
        </div>
      </form>

      <h2 className="text-xl font-semibold mt-8 mb-2">Registros</h2>
      <ul className="space-y-2">
        {records.map((record) => (
          <li key={record.id} className="border p-2 rounded flex flex-col">
            <span>
              <strong>Texto:</strong> {record.texto}
            </span>
            {record.imagen && (
              <img src={record.imagen} alt="" className="w-32 mt-2" />
            )}
            <div className="flex gap-2 mt-2">
              <button
                className="bg-gray-200 px-2 py-1 rounded"
                onClick={() => generarPDF(record)}
              >
                Generar PDF
              </button>
              <button
                className="bg-red-200 px-2 py-1 rounded"
                onClick={() => handleDelete(record.id, record.imagen_path)}
              >
                Borrar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/confirm" element={<ConfirmAccount />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
