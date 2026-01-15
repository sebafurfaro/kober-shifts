
"use client";

import { useState, useEffect } from "react";
import { Box, Button, Container, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useSession, signOut } from "next-auth/react";

export default function CompleteRegistrationPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            // If not pending, they shouldn't be here
            if (!(session?.user as any).isPending) {
                router.push("/panel");
            }
        }
    }, [status, session, router]);

    if (status === "loading") return null;

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
            const res = await fetch("/api/auth/complete-registration", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (!res.ok) {
                const json = (await res.json().catch(() => ({}))) as { error?: string };
                setError(json.error ?? "Error al actualizar contraseña");
                return;
            }

            // Force sign out so they have to login again with new password (as requested)
            // "Una vez registrado, el usuario debera ser redireccionado al login"
            await signOut({ redirect: false });
            router.push("/login");

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
                        Hola {session?.user?.name}, para finalizar tu registro por favor crea una contraseña.
                    </Typography>

                    <TextField
                        label="Contraseña"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
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
