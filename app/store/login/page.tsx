"use client";

import { useState, useEffect } from "react";
import { Box, Button, Container, Stack, TextField, Typography, Paper } from "@mui/material";
import { useRouter } from "next/navigation";

export default function StoreLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/store/tenants");
        if (res.ok) {
          router.push("/store/tenants");
        }
      } catch {
        // Not logged in, stay on login page
      }
    };
    checkSession();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/store/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Important: include cookies
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? "Error al iniciar sesión");
        return;
      }
      // Wait a bit to ensure cookie is set before redirecting
      await new Promise(resolve => setTimeout(resolve, 100));
      // Use window.location instead of router.push to ensure full page reload
      // This ensures cookies are properly available
      window.location.href = "/store/tenants";
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "grey.100",
      }}
    >
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Stack spacing={3} component="form" onSubmit={onSubmit}>
            <Typography variant="h5" fontWeight={700} textAlign="center">
              Store - Gestión de Tenants
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Acceso restringido
            </Typography>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              fullWidth
            />
            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              fullWidth
            />
            {error ? (
              <Typography color="error" variant="body2" textAlign="center">
                {error}
              </Typography>
            ) : null}
            <Button type="submit" variant="contained" disabled={loading} fullWidth>
              {loading ? "Iniciando sesión..." : "Entrar"}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
