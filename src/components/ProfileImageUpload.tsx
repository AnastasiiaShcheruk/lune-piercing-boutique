"use client";

import { ChangeEvent, useEffect, useState } from "react";

function compressImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const maxSize = 800;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Не вдалося обробити фото"));
          return;
        }

        context.drawImage(image, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };

      image.onerror = () => reject(new Error("Не вдалося завантажити фото"));
      image.src = String(reader.result);
    };

    reader.onerror = () => reject(new Error("Не вдалося прочитати файл"));
    reader.readAsDataURL(file);
  });
}

export default function ProfileImageUpload({
  name,
  defaultValue,
  alt
}: {
  name: string;
  defaultValue: string;
  alt: string;
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

    if (file.size > 6 * 1024 * 1024) {
      setError("Фото занадто велике. Максимум 6 МБ");
      return;
    }

    try {
      const compressed = await compressImage(file);
      setValue(compressed);
      setFileName(file.name);
      setError("");
    } catch {
      setError("Не вдалося додати фото");
    }
  }

  function resetPhoto() {
    setValue("/logo-pic.png");
    setFileName("");
    setError("");
  }

  return (
    <div className="profile-image-upload">
      <input type="hidden" name={name} value={value} />

      <div className="profile-upload-preview">
        <img src={value || "/logo-pic.png"} alt={alt} />
      </div>

      <div className="profile-upload-actions">
        <label className="profile-file-button">
          <input type="file" accept="image/*" onChange={handleFile} />
          <span>Обрати фото з пристрою</span>
        </label>

        <button type="button" className="profile-photo-reset" onClick={resetPhoto}>
          Скинути фото
        </button>
      </div>

      {fileName && <p className="profile-file-name">{fileName}</p>}
      {error && <p className="profile-file-error">{error}</p>}
      <p className="profile-file-hint">Фото автоматично стискається та зберігається у профілі.</p>
    </div>
  );
}