"use client";

import { ChangeEvent, useEffect, useState } from "react";

function compressImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const maxSize = 1200;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Не вдалося обробити зображення"));
          return;
        }

        context.drawImage(image, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        resolve(dataUrl);
      };

      image.onerror = () => reject(new Error("Не вдалося завантажити зображення"));
      image.src = String(reader.result);
    };

    reader.onerror = () => reject(new Error("Не вдалося прочитати файл"));
    reader.readAsDataURL(file);
  });
}

export default function AdminImageUpload({
  name,
  defaultValue = ""
}: {
  name: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue || "/logo-pic.png");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(defaultValue || "/logo-pic.png");
    setFileName("");
    setError("");
  }, [defaultValue]);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Обери файл зображення");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Зображення занадто велике. Максимум 8 МБ");
      return;
    }

    try {
      const compressed = await compressImage(file);
      setValue(compressed);
      setFileName(file.name);
      setError("");
    } catch {
      setError("Не вдалося додати зображення");
    }
  }

  return (
    <div className="admin-image-upload">
      <input type="hidden" name={name} value={value} />

      <div className="admin-image-preview">
        <img src={value || "/logo-pic.png"} alt="Попередній перегляд товару" />
      </div>

      <label className="admin-file-button">
        <input type="file" accept="image/*" onChange={handleFile} />
        <span>Обрати зображення з пристрою</span>
      </label>

      {fileName && <p className="admin-file-name">{fileName}</p>}
      {error && <p className="admin-file-error">{error}</p>}
    </div>
  );
}