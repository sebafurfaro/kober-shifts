"use client";

import { useState, useEffect } from "react";
import { Box, Button, Container, IconButton, InputAdornment, Stack, TextField, Typography, CircularProgress } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function CompleteRegistrationPage() {
    const router = useRouter();
    const params = useParams();
    const tenantId = params.tenantId as string;

    const [user, setUser] = useState<{ name: string; isPending: boolean } | null>(null);
    const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function checkSession() {
            try {
                const res = await fetch(`/api/plataforma/${tenantId}/auth/me`);
                if (!res.ok) {
                    setStatus("unauthenticated");
                    router.push(`/plataforma/${tenantId}/login`);
                    return;
                }
                const data = await res.json();
                if (!data.isPending) {
                    setStatus("authenticated");
                    router.push(`/plataforma/${tenantId}/panel`);
                    return;
                }
                setUser(data);
                setStatus("authenticated");
            } catch (err) {
                setStatus("unauthenticated");
                router.push(`/plataforma/${tenantId}/login`);
            }
        }
        checkSession();
    }, [tenantId, router]);

    if (status === "loading" || !user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/plataforma/${tenantId}/auth/complete-registration`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (!res.ok) {
                const json = (await res.json().catch(() => ({}))) as { error?: string };
                setError(json.error ?? "Error al actualizar contraseña");
                return;
            }

            // After complete registration, logout to force fresh login with new password
            await fetch(`/api/plataforma/${tenantId}/auth/logout`, { method: "POST" });
            router.push(`/plataforma/${tenantId}/login?message=registration_complete`);

        } catch (err) {
            setError("Ocurrió un error inesperado");
        } finally {
            setLoading(false);
        }
    }

    const handleShowPassword = () => setShowPassword((show) => !show);

    return (
        <Container maxWidth="sm">
            <Box sx={{ py: 8 }}>
                <Stack spacing={2} component="form" onSubmit={onSubmit}>
                    <Typography variant="h5" fontWeight={700}>
                        Completar Registro
                    </Typography>
                    <Typography variant="body1">
                        Hola {user.name}, para finalizar tu registro por favor crea una contraseña.
                    </Typography>

                    <TextField
                        label="Contraseña"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        autoComplete="new-password"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleShowPassword} edge="end">
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        label="Confirmar Contraseña"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        autoComplete="new-password"
                    />

                    {error ? (
                        <Typography color="error" variant="body2">
                            {error}
                        </Typography>
                    ) : null}

                    <Button type="submit" variant="contained" disabled={loading}>
                        Finalizar Registro
                    </Button>
                </Stack>
            </Box>
        </Container>
    );
}
