"use client";

import { useState, useEffect, useMemo } from "react";
import { Box, Button, Container, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { Visibility, VisibilityOff, Google, CheckCircle, Cancel } from "@mui/icons-material";

function ValidationItem({ isValid, text }: { isValid: boolean; text: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {isValid ? (
        <CheckCircle color="success" sx={{ fontSize: 16 }} />
      ) : (
        <Cancel color="action" sx={{ fontSize: 16, opacity: 0.5 }} />
      )}
      <Typography
        variant="caption"
        color={isValid ? "success.main" : "text.secondary"}
        sx={{ transition: "color 0.2s" }}
      >
        {text}
      </Typography>
    </Stack>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);

  const validations = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!Object.values(validations).every(Boolean)) {
      setError("La contraseña no cumple con los requisitos de seguridad.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? "Error");
        return;
      }
      router.push(`/plataforma/${tenantId}/panel`);
    } finally {
      setLoading(false);
    }
  }

  const handleShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  const handleMouseUpPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8 }}>
        <Stack spacing={2} component="form" onSubmit={onSubmit}>
          <Typography variant="h5" fontWeight={700}>
            Crear cuenta
          </Typography>
          <TextField label="Nombre y apellido" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <TextField
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            error={isPasswordTouched && !Object.values(validations).every(Boolean)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    onMouseUp={handleMouseUpPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            onBlur={() => setIsPasswordTouched(true)}
          />

          {/* Password Requirements */}
          <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
              Requisitos de la contraseña:
            </Typography>
            <Stack spacing={0.5}>
              <ValidationItem isValid={validations.minLength} text="Mínimo 8 caracteres" />
              <ValidationItem isValid={validations.hasUpperCase} text="Al menos una mayúscula" />
              <ValidationItem isValid={validations.hasNumber} text="Al menos un número" />
              <ValidationItem isValid={validations.hasSpecialChar} text="Al menos un carácter especial (@$!%*?&)" />
            </Stack>
          </Box>

          {error ? (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          ) : null}
          <Button type="submit" variant="contained" disabled={loading || (isPasswordTouched && !Object.values(validations).every(Boolean))}>
            Registrarme
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
            <Typography variant="caption" sx={{ px: 2, color: 'text.secondary' }}>O</Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
          </Box>

          <Button
            variant="outlined"
            startIcon={<Google />}
            onClick={() => window.location.href = `/api/plataforma/${tenantId}/auth/google`}
            disabled={loading}
            fullWidth
            sx={{
              textTransform: "none",
              borderColor: "#ddd",
              color: "#555",
              "&:hover": {
                borderColor: "#ccc",
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            Registrarse con Google
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}


