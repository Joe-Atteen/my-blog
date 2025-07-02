import { NextResponse } from "next/server";

export async function GET() {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.supabase.co https://*.supabase.in;
    font-src 'self' data:;
    connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL} https://api.userapi.com;
    frame-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  return new NextResponse(JSON.stringify({ nonce }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Security-Policy": cspHeader,
    },
  });
}
