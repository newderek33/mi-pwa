import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import jsPDF from "jspdf";


const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);


function App() {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [records, setRecords] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data, error } = await supabase.from("registros").select("*");
    if (!error) setRecords(data);
  }

async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  let imageUrl = "";
  if (image) {
    const { data, error } = await supabase.storage
      .from("imagenes")
      .upload(`imagen-${Date.now()}.png`, image);
    if (!error) {
      imageUrl = supabase.storage
        .from("imagenes")
        .getPublicUrl(data.path).data.publicUrl;
    }
  }

  const { error } = await supabase
    .from("registros")
    .insert([{ texto: text, imagen: imageUrl }]);

  if (!error) {
    setText("");
    setImage(null);
    setPreview(null);
    fetchData();
  }

  setLoading(false);
}



function generarPDF(record) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Registro", 10, 20);
  doc.text(`Texto: ${record.texto}`, 10, 40);

  if (record.imagen) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const maxWidth = 180; // mm
      const maxHeight = 250; // mm
      const imgWidth = img.width;
      const imgHeight = img.height;

      // Calcular proporciones
      let width = maxWidth;
      let height = (imgHeight / imgWidth) * width;

      if (height > maxHeight) {
        height = maxHeight;
        width = (imgWidth / imgHeight) * height;
      }

      doc.addImage(img, "PNG", 10, 50, width, height);
      doc.save("registro.pdf");
    };
    img.src = record.imagen;
  } else {
    doc.save("registro.pdf");
  }
}



async function handleDelete(id) {
  const { error } = await supabase.from("registros").delete().eq("id", id);
  if (!error) {
    fetchData(); // actualiza la lista después de borrar
  } else {
    console.error("Error al borrar el registro:", error);
  }
}


function limpiarFormulario() {
  setText("");
  setImage(null);
  document.getElementById("file-input").value = ""; // Limpia el input file
}


return (
  <div className="p-4 max-w-xl mx-auto font-sans">
    <h1 className="text-2xl font-bold text-primary mb-4">Formulario</h1>

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
        onChange={(e) => {
          const file = e.target.files[0];
          setImage(file);
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target.result);
            reader.readAsDataURL(file);
          } else {
            setPreview(null);
          }
        }}
        className="w-full"
      />

      {preview && (
        <img src={preview} alt="Previsualización" className="w-32 mt-2 rounded" />
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${
            loading ? 'bg-gray-400' : 'bg-primary hover:bg-primary-dark'
          }`}
        >
          {loading ? "Guardando registro..." : "Guardar"}
        </button>

        <button
          type="button"
          onClick={() => {
            setText("");
            setImage(null);
            setPreview(null);
          }}
          className="bg-red-300 text-white px-4 py-2 rounded"
        >
          Limpiar
        </button>

        <button
          type="button"
          onClick={fetchData}
          className="bg-blue-300 text-white px-4 py-2 rounded"
        >
          Refrescar
        </button>
      </div>
    </form>

    <h2 className="text-xl font-semibold mt-8 mb-2">Registros</h2>
    <ul className="space-y-2">
      {records.map((record) => (
        <li key={record.id} className="border p-2 rounded flex flex-col">
          <span><strong>Texto:</strong> {record.texto}</span>
          {record.imagen && (
            <img src={record.imagen} alt="" className="w-32 mt-2 rounded" />
          )}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => generarPDF(record)}
              className="bg-gray-200 px-2 py-1 rounded"
            >
              Generar PDF
            </button>
            <button
              onClick={() => borrarRegistro(record.id)}
              className="bg-red-200 px-2 py-1 rounded"
            >
              Borrar
            </button>
          </div>
        </li>
      ))}
    </ul>
  </div>
);


export default App;
