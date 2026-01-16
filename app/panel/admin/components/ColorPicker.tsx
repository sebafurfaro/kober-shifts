"use client";

import * as React from "react";
import { Box, Typography } from "@mui/material";

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
  "#2196f3", // Azul Material-UI (color por defecto)
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
    <Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          p: 1.5,
          border: "1px solid",
          borderColor: error ? "error.main" : "divider",
          borderRadius: 1,
          backgroundColor: "background.paper",
        }}
      >
        {COLOR_PALETTE.map((color) => (
          <Box
            key={color}
            onClick={() => handleColorClick(color)}
            sx={{
              width: "30px",
              aspectRatio: "1",
              borderRadius: "2px",
              backgroundColor: color,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
              border: value === color ? "3px solid" : "2px solid",
              borderColor: value === color ? "primary.main" : "transparent",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: disabled ? "none" : "scale(1.1)",
                boxShadow: disabled ? "none" : `0 2px 8px ${color}40`,
              },
            }}
          />
        ))}
      </Box>
      {value && (
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            display: "block",
            textAlign: "center",
            color: "text.secondary",
            fontFamily: "monospace",
          }}
        >
          {value.toUpperCase()}
        </Typography>
      )}
    </Box>
  );
}
