import { randomUUID } from "node:crypto";

type TelemetryPostBody = {
  message: string;
  author?: string;
};

export async function GET(request: Request) {
  const headers = request.headers;

  return Response.json({
    status: "Online & Healthy",
    environment: process.env.VERCEL_ENV || "development",
    region: process.env.VERCEL_REGION || "local-machine",
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    headers: {
      "x-vercel-ip-country":
        headers.get("x-vercel-ip-country") ?? "BR (Localhost Fallback)",
      "x-vercel-ip-city": headers.get("x-vercel-ip-city")
        ? decodeURIComponent(headers.get("x-vercel-ip-city")!)
        : "Porto Alegre (Dev)",
      "x-vercel-ip-timezone":
        headers.get("x-vercel-ip-timezone") ?? "America/Sao_Paulo (Dev)",
      "x-vercel-id": headers.get("x-vercel-id") ?? "dev1::gru1-12345",
      "x-forwarded-for": headers.get("x-forwarded-for") ?? "127.0.0.1",
    },
  });
}

export async function POST(request: Request) {
  const startedAt = performance.now();

  let body: TelemetryPostBody;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Corpo da requisição inválido: envie um JSON válido." },
      { status: 400 },
    );
  }

  if (typeof body?.message !== "string" || body.message.trim() === "") {
    return Response.json(
      { error: "O campo 'message' é obrigatório e deve ser uma string." },
      { status: 400 },
    );
  }

  const message = body.message;
  const author =
    typeof body.author === "string" && body.author.trim() !== ""
      ? body.author.trim()
      : "Anônimo";

  return Response.json(
    {
      success: true,
      info: "Payload processado com sucesso por uma Serverless Function na Vercel.",
      executionId: `exec_${randomUUID()}`,
      author,
      processing: {
        originalMessage: message,
        transformedMessage: message.toUpperCase(),
        payloadSizeBytes: new TextEncoder().encode(message).length,
        wordCount: message.trim().split(/\s+/).filter(Boolean).length,
        characterCount: [...message].length,
        processingTimeMs: Number((performance.now() - startedAt).toFixed(3)),
      },
      environment: process.env.VERCEL_ENV || "development",
      region: process.env.VERCEL_REGION || "local-machine",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
