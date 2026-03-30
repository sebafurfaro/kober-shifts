import { useState } from 'react';

interface UseMercadoPagoOptions {
  tenantId: string;
}

interface PaymentParams {
  appointmentId: string;
  amount: number;
  purpose?: 'deposit' | 'full';
  description?: string;
  isSandbox?: boolean;
}

export function useMercadoPago({ tenantId }: UseMercadoPagoOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payAppointment = async ({
    appointmentId,
    amount,
    purpose = 'full',
    description,
    isSandbox = false,
  }: PaymentParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/plataforma/${tenantId}/payments/mercadopago/preference`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointmentId,
            amount,
            purpose,
            description,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar el pago con Mercado Pago');
      }

      const initPoint = isSandbox ? data.sandboxInitPoint : data.initPoint;

      if (!initPoint) {
        throw new Error('No se recibió el link de pago de Mercado Pago');
      }

      // Redirigir al usuario al flujo de Mercado Pago (Sandbox o Producción)
      window.location.href = initPoint;
    } catch (err: any) {
      console.error('Error en useMercadoPago:', err);
      setError(err.message);
      throw err; // Propagar para que el componente también pueda reaccionar (ej: toast)
    } finally {
      setLoading(false);
    }
  };

  return {
    payAppointment,
    loading,
    error,
  };
}
