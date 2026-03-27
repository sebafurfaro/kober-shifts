import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID || 'nodoapp-490821';

// Iniciamos el cliente una sola vez para reutilizar conexiones
const client = new RecaptchaEnterpriseServiceClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

export async function verifyRecaptcha(token: string, action: string = 'LOGIN') {
  if (process.env.NODE_ENV === 'development' && !process.env.GOOGLE_PRIVATE_KEY) {
      console.warn("⚠️ Bypaseando reCAPTCHA en desarrollo porque no hay GOOGLE_PRIVATE_KEY configurada.");
      return { success: true, score: 0.9 };
  }

  const projectPath = client.projectPath(GOOGLE_PROJECT_ID);

  const request = {
    assessment: {
      event: {
        token: token,
        siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, 
        expectedAction: action 
      },
    },
    parent: projectPath,
  };

  try {
    const [response] = await client.createAssessment(request);

    if (!response.tokenProperties?.valid) {
      console.error(`Token inválido: ${response.tokenProperties?.invalidReason}`);
      return { success: false, reason: response.tokenProperties?.invalidReason };
    }

    const score = response.riskAnalysis?.score ?? 0;
    console.log(`Puntaje reCAPTCHA Enterprise: ${score}`);

    if (score < 0.5) {
      return { success: false, score, reason: 'SCORE_LOW' };
    }

    return { success: true, score };

  } catch (error) {
    console.error("Error comunicándose con reCAPTCHA Enterprise:", error);
    return { success: false, reason: "API_ERROR" };
  }
}
