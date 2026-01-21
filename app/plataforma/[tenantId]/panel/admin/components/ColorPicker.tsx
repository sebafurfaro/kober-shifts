"use client";

import * as React from "react";

// 36 colores predefinidos organizados en una paleta variada
const COLOR_PALETTE = [
  "#ff6b6b", // Rojo coral
  "#ee5a6f", // Rosa
  "#c44569", // Magenta
  "#a55eea", // Púrpura claro
  "#8854d0", // Púrpura
  "#6c5ce7", // Índigo
  "#4834d4", // Azul índigo oscuro
  "#3742fa", // Azul real
  "#5352ed", // Azul violeta
  "#5f27cd", // Púrpura oscuro
  "#341f97", // Púrpura muy oscuro
  "#00d2d3", // Cian
  "#54a0ff", // Azul cielo
  "#2196f3", // Azul (color por defecto)
  "#1e90ff", // Azul dodger
  "#0abde3", // Azul turquesa
  "#00a8ff", // Azul brillante
  "#0097e6", // Azul eléctrico
  "#0984e3", // Azul medio
  "#74b9ff", // Azul claro
  "#a29bfe", // Lavanda
  "#fd79a8", // Rosa claro
  "#fdcb6e", // Amarillo dorado
  "#e17055", // Naranja rojizo
  "#d63031", // Rojo
  "#e84393", // Rosa magenta
  "#00b894", // Verde esmeralda
  "#00cec9", // Turquesa
  "#55efc4", // Verde menta
  "#81ecec", // Cian claro
  "#fab1a0", // Melocotón
  "#ffeaa7", // Amarillo claro
  "#f39c12", // Naranja
  "#e67e22", // Naranja oscuro
  "#d35400", // Naranja rojizo oscuro
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function ColorPicker({ value, onChange, disabled = false, error = false }: ColorPickerProps) {
  const handleColorClick = (color: string) => {
    if (!disabled) {
      onChange(color);
    }
  };

  return (
    <div>
      <div
        className={`flex flex-wrap gap-3 p-3 border rounded-lg bg-white ${
          error ? "border-danger" : "border-gray-300"
        }`}
      >
        {COLOR_PALETTE.map((color) => (
          <div
            key={color}
            onClick={() => handleColorClick(color)}
            className={`w-[30px] aspect-square rounded-sm transition-all duration-200 ${
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer opacity-100 hover:scale-110"
            } ${
              value === color
                ? "border-[3px] border-primary"
                : "border-2 border-transparent"
            }`}
            style={{
              backgroundColor: color,
              boxShadow: !disabled && value === color ? `0 2px 8px ${color}40` : "none",
            }}
          />
        ))}
      </div>
      {value && (
        <p className="mt-2 text-xs text-center text-gray-500 font-mono">
          {value.toUpperCase()}
        </p>
      )}
    </div>
  );
}
