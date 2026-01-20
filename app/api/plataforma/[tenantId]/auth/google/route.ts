import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/googleOAuth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const { searchParams } = new URL(req.url);
    const callbackUrl = searchParams.get("callbackUrl") || `/plataforma/${tenantId}/panel`;

    // Store tenantId and callbackUrl in the state
    const stateObj = { tenantId, callbackUrl };
    const state = Buffer.from(JSON.stringify(stateObj)).toString("base64");

    const url = getGoogleAuthUrl(state);
    return NextResponse.redirect(url);
}
