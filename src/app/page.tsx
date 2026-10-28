"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

type TelemetryResponse = {
  status: string;
  environment: string;
  region: string;
  timestamp: string;
  nodeVersion: string;
  headers: {
    "x-vercel-ip-country": string;
    "x-vercel-ip-city": string;
    "x-vercel-ip-timezone": string;
    "x-vercel-id": string;
    "x-forwarded-for": string;
  };
};

const ENVIRONMENT_LABELS: Record<string, { label: string; className: string }> = {
  production: {
    label: "Production",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  },
  preview: {
    label: "Preview",
    className: "border-sky-500/40 bg-sky-500/10 text-sky-400",
  },
  development: {
    label: "Development",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  },
};

async function requestTelemetry() {
  const startedAt = performance.now();
  const response = await fetch("/api/telemetry", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Falha na requisição: HTTP ${response.status}`);
  }
  const data: TelemetryResponse = await response.json();
  return { data, latency: Math.round(performance.now() - startedAt) };
}

export default function Home() {
  const [telemetry, setTelemetry] = useState<TelemetryResponse | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [getLoading, setGetLoading] = useState(true);
  const [getError, setGetError] = useState<string | null>(null);

  const [message, setMessage] = useState("Olá turma de Fullstack!");
  const [author, setAuthor] = useState("");
  const [postResponse, setPostResponse] = useState<unknown>(null);
  const [postLoading, setPostLoading] = useState(false);
  const [postLatency, setPostLatency] = useState<number | null>(null);

  function applyTelemetryResult(promise: ReturnType<typeof requestTelemetry>) {
    return promise
      .then(({ data, latency }) => {
        setTelemetry(data);
        setLatency(latency);
        setGetError(null);
      })
      .catch((error: unknown) => {
        setGetError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => setGetLoading(false));
  }

  useEffect(() => {
    applyTelemetryResult(requestTelemetry());
  }, []);

  function handleRefetch() {
    setGetLoading(true);
    applyTelemetryResult(requestTelemetry());
  }

  async function handlePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPostLoading(true);
    const startedAt = performance.now();
    try {
      const response = await fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, author: author || undefined }),
      });
      setPostResponse(await response.json());
      setPostLatency(Math.round(performance.now() - startedAt));
    } catch (error) {
      setPostResponse({
        error: error instanceof Error ? error.message : String(error),
      });
      setPostLatency(null);
    } finally {
      setPostLoading(false);
    }
  }

  const environment =
    ENVIRONMENT_LABELS[telemetry?.environment ?? "development"] ??
    ENVIRONMENT_LABELS.development;

  return (
    <div className="flex min-h-screen flex-col bg-black text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-black/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <VercelLogo className="h-5 w-5 text-white" />
            <span className="text-zinc-700">/</span>
            <h1 className="text-sm font-semibold tracking-tight text-white sm:text-base">
              Vercel Fullstack Demo
            </h1>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs ${environment.className}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {telemetry ? environment.label : "Detectando..."}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
        {/* Hero */}
        <section className="border-b border-zinc-800 py-16 sm:py-20">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-zinc-500">
            Next.js App Router · Serverless Functions · Edge Network
          </p>
          <h2 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Um único repositório.
            <br />
            <span className="text-zinc-500">Frontend e Backend juntos.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Este projeto hospeda tanto o <strong className="text-zinc-200">Frontend React</strong>{" "}
            (<code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-sm text-zinc-300">src/app/page.tsx</code>)
            quanto a <strong className="text-zinc-200">API Serverless em Node.js</strong>{" "}
            (<code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-sm text-zinc-300">src/app/api/telemetry/route.ts</code>).
            A cada <code className="font-mono text-sm text-zinc-300">git push</code>, a Vercel compila e
            publica os dois automaticamente.
          </p>
        </section>

        {/* GET Demo */}
        <section className="py-12">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionLabel method="GET" path="/api/telemetry" />
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Telemetria em tempo real
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                Dados lidos dos headers injetados pela Edge Network da Vercel em cada requisição.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {latency !== null && !getLoading && (
                <span className="font-mono text-sm text-zinc-400">
                  Latência: <span className="text-emerald-400">{latency} ms</span>
                </span>
              )}
              <button
                type="button"
                onClick={handleRefetch}
                disabled={getLoading}
                className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshIcon className={`h-4 w-4 ${getLoading ? "animate-spin" : ""}`} />
                {getLoading ? "Requisitando..." : "Disparar Nova Requisição GET"}
              </button>
            </div>
          </div>

          {getError && (
            <div className="mb-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {getError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <Card title="Serverless Status" icon={<ServerIcon className="h-4 w-4" />}>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  {telemetry && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex h-2.5 w-2.5 rounded-full ${telemetry ? "bg-emerald-500" : "bg-zinc-600"}`}
                  />
                </span>
                <span className="text-lg font-semibold text-white">
                  {telemetry?.status ?? "Aguardando..."}
                </span>
              </div>
              <DataRow label="Node.js" value={telemetry?.nodeVersion} />
              <DataRow
                label="Timestamp"
                value={telemetry ? new Date(telemetry.timestamp).toLocaleTimeString("pt-BR") : undefined}
              />
            </Card>

            <Card title="Edge Network · Geolocalização" icon={<GlobeIcon className="h-4 w-4" />}>
              <DataRow label="x-vercel-ip-country" value={telemetry?.headers["x-vercel-ip-country"]} />
              <DataRow label="x-vercel-ip-city" value={telemetry?.headers["x-vercel-ip-city"]} />
              <DataRow label="x-vercel-ip-timezone" value={telemetry?.headers["x-vercel-ip-timezone"]} />
            </Card>

            <Card title="Infraestrutura" icon={<CpuIcon className="h-4 w-4" />}>
              <DataRow label="x-vercel-id" value={telemetry?.headers["x-vercel-id"]} />
              <DataRow label="VERCEL_REGION" value={telemetry?.region} />
              <DataRow label="x-forwarded-for" value={telemetry?.headers["x-forwarded-for"]} />
            </Card>
          </div>

          <JsonViewer
            title="Resposta bruta da Serverless Function"
            data={telemetry}
            loading={getLoading && !telemetry}
          />
        </section>

        {/* POST Demo */}
        <section className="border-t border-zinc-800 py-12">
          <SectionLabel method="POST" path="/api/telemetry" />
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Testador de Payload Serverless
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            Envie uma mensagem: a função calcula o tamanho em bytes, conta as palavras, transforma o
            texto em maiúsculas e gera um ID de execução.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <form
              onSubmit={handlePost}
              className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-5"
            >
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Mensagem
                </span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  required
                  className="resize-none rounded-md border border-zinc-800 bg-black px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-500"
                  placeholder="Digite uma mensagem de teste..."
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Autor (opcional)
                </span>
                <input
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                  className="rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-500"
                  placeholder="Seu nome"
                />
              </label>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={postLoading || message.trim() === ""}
                  className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SendIcon className="h-4 w-4" />
                  {postLoading ? "Enviando..." : "Enviar POST para Serverless"}
                </button>
                {postLatency !== null && !postLoading && (
                  <span className="font-mono text-sm text-zinc-400">
                    Latência: <span className="text-emerald-400">{postLatency} ms</span>
                  </span>
                )}
              </div>
            </form>

            <JsonViewer
              title="Resposta do POST /api/telemetry"
              data={postResponse}
              loading={postLoading}
              emptyText="Envie uma mensagem para ver a resposta da função."
              className="mt-0"
            />
          </div>
        </section>

        {/* Footer cards */}
        <section className="grid gap-4 border-t border-zinc-800 py-12 md:grid-cols-3">
          <FeatureCard
            icon={<GitIcon className="h-5 w-5" />}
            title="Zero-Config CI/CD"
            description="Conecte o repositório Git e cada push na branch principal gera build e deploy automáticos, sem configurar pipelines."
          />
          <FeatureCard
            icon={<EyeIcon className="h-5 w-5" />}
            title="Preview Deployments"
            description="Cada Pull Request recebe uma URL única e isolada para revisar as mudanças antes de chegar em produção."
          />
          <FeatureCard
            icon={<BoltIcon className="h-5 w-5" />}
            title="Serverless Scale-to-Zero"
            description="As funções escalam automaticamente com a demanda e não consomem recursos quando não há requisições."
          />
        </section>
      </main>

      <footer className="border-t border-zinc-800 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-xs text-zinc-500 sm:px-6">
          <span>Demonstração acadêmica · Fullstack na Vercel</span>
          <span className="font-mono">Next.js + Tailwind CSS</span>
        </div>
      </footer>
    </div>
  );
}

function SectionLabel({ method, path }: { method: "GET" | "POST"; path: string }) {
  const color =
    method === "GET"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
      : "border-sky-500/40 bg-sky-500/10 text-sky-400";
  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <span className={`rounded border px-1.5 py-0.5 font-semibold ${color}`}>{method}</span>
      <span className="text-zinc-400">{path}</span>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-zinc-900 pt-2 first:border-t-0 first:pt-0">
      <span className="font-mono text-[11px] text-zinc-500">{label}</span>
      {value ? (
        <span className="truncate font-mono text-sm text-zinc-200" title={value}>
          {value}
        </span>
      ) : (
        <span className="h-5 w-32 animate-pulse rounded bg-zinc-900" />
      )}
    </div>
  );
}

function JsonViewer({
  title,
  data,
  loading,
  emptyText = "Nenhum dado ainda.",
  className = "mt-4",
}: {
  title: string;
  data: unknown;
  loading: boolean;
  emptyText?: string;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 ${className}`}>
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <span className="font-mono text-xs text-zinc-500">{title}</span>
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
        </span>
      </div>
      <pre className="max-h-96 overflow-auto p-4 font-mono text-xs leading-relaxed text-emerald-300">
        {loading ? (
          <span className="text-zinc-500">Carregando...</span>
        ) : data ? (
          JSON.stringify(data, null, 2)
        ) : (
          <span className="text-zinc-500">{emptyText}</span>
        )}
      </pre>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-600">
      <div className="mb-3 inline-flex rounded-md border border-zinc-800 bg-black p-2 text-white">{icon}</div>
      <h4 className="font-semibold text-white">{title}</h4>
      <p className="mt-1 text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}

/* Ícones SVG inline (sem bibliotecas externas) */

type IconProps = { className?: string };

function VercelLogo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 76 65" fill="currentColor" className={className} aria-label="Vercel">
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
    </svg>
  );
}

function Stroke({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function RefreshIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </Stroke>
  );
}

function ServerIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <rect x="3" y="4" width="18" height="7" rx="1.5" />
      <rect x="3" y="13" width="18" height="7" rx="1.5" />
      <path d="M7 7.5h.01M7 16.5h.01" />
    </Stroke>
  );
}

function GlobeIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </Stroke>
  );
}

function CpuIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
      <rect x="9.5" y="9.5" width="5" height="5" />
      <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
    </Stroke>
  );
}

function SendIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </Stroke>
  );
}

function GitIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="9" r="2.5" />
      <path d="M6 8.5v7M18 11.5c0 3-3 4-9.5 5" />
    </Stroke>
  );
}

function EyeIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Stroke>
  );
}

function BoltIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </Stroke>
  );
}
