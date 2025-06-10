import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import jsPDF from "jspdf";

const supabase = createClient('https://hiahkvlgtvirlshxmqep.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpYWhrdmxndHZpcmxzaHhtcWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMzI5NjQsImV4cCI6MjA2NDYwODk2NH0.nelAKJvgXnmA5PO2-N48SE1pM9vaU-yYJGJVTNrIho4');

function App() {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data, error } = await supabase.from("registros").select("*");
    if (!error) setRecords(data);
  }

  async function handleSubmit(e) {
  e.preventDefault();

  let imageUrl = "";
  if (image) {
    const { data, error } = await supabase.storage
      .from("imagenes")
      .upload(`imagen-${Date.now()}.png`, image);

    if (!error) {
      imageUrl = supabase.storage.from("imagenes").getPublicUrl(data.path).data.publicUrl;
    }
  }

  const { error } = await supabase.from("registros").insert([
    { texto: text, imagen: imageUrl }
  ]);

  if (!error) {
    setText("");
    setImage(null);
    document.getElementById("file-input").value = ""; // <-- esto limpia el campo file
    fetchData();
  }
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
        doc.addImage(img, "PNG", 10, 50, 50, 50);
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
        id="file-input"
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        className="w-full"
      />
      <div className="flex gap-2">
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded">
          Guardar
        </button>
        <button
          type="button"
          onClick={limpiarFormulario}
          className="bg-gray-300 text-black px-4 py-2 rounded"
        >
          Limpiar
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
              className="bg-red-400 text-white px-2 py-1 rounded"
              onClick={() => handleDelete(record.id)}
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

export default App;