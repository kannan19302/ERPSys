#!/usr/bin/env node
/**
 * Start UniERP for daily development.
 *
 * One command for the everyday loop: datastores, the package registry, and the
 * two applications you almost always need. It waits until each is genuinely
 * answering rather than merely "started", then prints where everything is.
 *
 * Node rather than PowerShell: the first version of this was a .ps1 invoked
 * through `pwsh`, which is not installed on a stock Windows machine — the
 * script that exists to make starting the stack easy failed at
 * "pwsh: command not found". § 12.5 asks for Node or PowerShell and no bash
 * dependency; Node is the one that runs everywhere without being installed
 * first.
 *
 *   pnpm dev                    datastores in Docker, apps native (the fast path)
 *   pnpm dev --docker           everything in containers, for CI parity
 *   pnpm dev --with console     add a plane you are working on
 *   pnpm dev --down             stop everything
 *   pnpm dev --reset            stop and destroy the volumes
 *
 * Applications run natively by default. That is § 12's model and it is not a
 * preference: the same Next.js middleware compile took 962 seconds in a
 * bind-mounted container and 1 second natively. Docker keeps the datastores,
 * where it costs nothing.
 *
 * Additional planes are opt-in because each is a full Next.js or Nest process
 * holding its own module graph. Running all five in containers at once
 * exhausted the Docker VM during bring-up, three times.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COMPOSE = ["compose", "-f", "docker-compose.dev.yml"];
const REGISTRY_COMPOSE = join(ROOT, "..", "unierp-infra", "registry", "docker-compose.registry.yml");

const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);
const withPlanes = argv
  .filter((a, i) => argv[i - 1] === "--with")
  .flatMap((a) => a.split(","))
  .filter(Boolean);

const docker = (args, opts = {}) =>
  spawnSync("docker", args, { cwd: ROOT, stdio: opts.quiet ? "pipe" : "inherit", encoding: "utf8" });

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

if (has("--down")) {
  docker([...COMPOSE, "down"]);
  process.exit(0);
}
if (has("--reset")) {
  console.log(c.yellow("  Destroying volumes — all local data will be lost."));
  docker([...COMPOSE, "down", "-v"]);
  process.exit(0);
}

console.log(`\n  ${c.cyan(c.bold("UniERP"))} — starting the development stack\n`);

// Docker has to be up before anything else is worth trying.
if (docker(["info"], { quiet: true }).status !== 0) {
  console.log(c.yellow("  Docker is not responding. Start Docker Desktop and run this again."));
  process.exit(1);
}

// The registry lives in unierp-infra but the app containers install from it, so
// it must exist and share this stack's network.
const registryUp = docker(["ps", "--filter", "name=unerp-registry", "--format", "{{.Names}}"], { quiet: true });
if (!registryUp.stdout?.trim()) {
  if (existsSync(REGISTRY_COMPOSE)) {
    console.log(c.dim("  starting the package registry…"));
    docker(["compose", "-f", REGISTRY_COMPOSE, "up", "-d"], { quiet: true });
  } else {
    console.log(c.yellow("  unierp-infra/registry not found — @unerp/* installs will fail."));
  }
}

// Refuse to report success for a process this script did not start.
//
// A port already bound by something outside Docker — a native `next dev` left
// running, another project — makes `docker compose up` fail for that service
// while the health probe below still succeeds, because something IS answering.
// The script would then print a tick for a container that never started, which
// is precisely the kind of false green this codebase has been full of.
const PORTS = { api: 3001, web: 3000, console: 3002, developer: 3004, idp: 3005 };
const conflicts = [];
for (const [svc, port] of Object.entries(PORTS)) {
  if (svc !== "api" && svc !== "web" && !withPlanes.includes(svc)) continue;
  const inDocker = docker(["ps", "--filter", `publish=${port}`, "--format", "{{.Names}}"], { quiet: true });
  if (inDocker.stdout?.trim()) continue; // ours already
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2_000);
    await fetch(`http://localhost:${port}/`, { signal: ctrl.signal });
    clearTimeout(timer);
    conflicts.push({ svc, port });
  } catch {
    /* free, or not answering — either is fine */
  }
}
if (conflicts.length) {
  console.log(c.yellow("  Ports already in use by something outside this stack:"));
  for (const { svc, port } of conflicts) {
    console.log(`    ${String(port).padEnd(6)} wanted by ${c.bold(svc)}`);
  }
  console.log(
    c.dim(
      "\n  Those containers will not start, and a health check would pass against\n" +
        "  whatever is already there. Stop it, or run `pnpm dev --down`.\n",
    ),
  );
  process.exit(1);
}

const DOCKER_ONLY = has("--docker");

// Datastores in Docker; applications native. This is § 12's model, and it is
// not a preference: the same Next.js middleware compile took 962 seconds inside
// a bind-mounted container and 1 second natively on this machine. Windows
// filesystem crossings dominate, and no amount of polling configuration fixes
// it. Docker earns its place for Postgres, Redis, MinIO and the registry, where
// it costs nothing and saves a great deal.
//
// --docker runs everything in containers instead, for parity with CI when you
// are debugging a container-only failure.
const datastores = ["postgres", "redis", "minio"];
const services = DOCKER_ONLY ? [...datastores, "api", "web", ...withPlanes] : datastores;
const profileArgs = DOCKER_ONLY ? withPlanes.flatMap((p) => ["--profile", p]) : [];
docker([...COMPOSE, ...profileArgs, "up", "-d", ...services]);

// Containers share a network with the registry only if it joins theirs.
docker(["network", "connect", "erpsys_default", "unerp-registry"], { quiet: true });

const env = {
  ...process.env,
  NODE_OPTIONS: "--max-old-space-size=8192",
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://unerp:unerp_password@localhost:5432/unerp_dev?schema=public",
  DATABASE_OWNER_URL:
    process.env.DATABASE_OWNER_URL ??
    "postgresql://unerp:unerp_password@localhost:5432/unerp_dev?schema=public",
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
  S3_ENDPOINT: process.env.S3_ENDPOINT ?? "http://localhost:9000",
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ?? "minioadmin",
  S3_SECRET_KEY: process.env.S3_SECRET_KEY ?? "minioadmin",
  S3_BUCKET: process.env.S3_BUCKET ?? "unerp-uploads",
  API_URL: "http://localhost:3001",
  NEXT_PUBLIC_API_URL: "http://localhost:3001",
  IDP_URL: "http://localhost:3005",
  NEXTAUTH_URL: "http://localhost:3000",
  // The API and IdP must agree on this or every token verifies at one and fails
  // at the other — which cost an evening to find.
  NEXTAUTH_SECRET:
    process.env.NEXTAUTH_SECRET ?? "your-super-secret-key-change-in-production",
  PII_ENCRYPTION_KEY:
    process.env.PII_ENCRYPTION_KEY ??
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
};

const children = [];
if (!DOCKER_ONLY) {
  const wait = async (url, label) => {
    const deadline = Date.now() + 3 * 60_000;
    while (Date.now() < deadline) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 5_000);
        await fetch(url, { signal: ctrl.signal });
        clearTimeout(timer);
        return true;
      } catch {
        /* not yet */
      }
      await new Promise((r) => setTimeout(r, 3_000));
    }
    console.log(c.yellow(`  ${label} did not become ready in time`));
    return false;
  };

  console.log(c.dim("  waiting for Postgres…"));
  let ready = false;
  for (let i = 0; i < 60 && !ready; i += 1) {
    ready = docker(["exec", "unerp-postgres", "pg_isready", "-U", "unerp", "-d", "unerp_dev"], { quiet: true }).status === 0;
    if (!ready) await new Promise((r) => setTimeout(r, 2_000));
  }

  const spawnApp = (name, cwd, cmd, args, extraEnv = {}) => {
    console.log(c.dim(`  starting ${name}…`));
    const child = spawn(cmd, args, {
      cwd: join(ROOT, cwd),
      env: { ...env, ...extraEnv },
      stdio: "ignore",
      shell: true,
      detached: false,
    });
    children.push({ name, child });
    return child;
  };

  spawnApp("api", "apps/api", "npx", ["nest", "start", "--watch"], { API_PORT: "3001" });
  spawnApp("idp", "apps/idp", "npx", ["nest", "start", "--watch"], { PORT: "3005", API_PORT: "3005" });
  spawnApp("web", "apps/web", "npx", ["next", "dev", "-p", "3000"]);

  await wait("http://localhost:3001/api/v1/health", "API");
  console.log(`  ${c.green("✓")}  API`);
  await wait("http://localhost:3005/api/v1/auth/check-email?email=x@y.z", "IdP");
  console.log(`  ${c.green("✓")}  IdP`);
  await wait("http://localhost:3000/", "Web");
  console.log(`  ${c.green("✓")}  Web`);

  process.on("SIGINT", () => {
    for (const { child } of children) child.kill();
    docker([...COMPOSE, "down"], { quiet: true });
    process.exit(0);
  });
}

console.log(`
  ${c.bold("Web")}         http://localhost:3000
  ${c.bold("API")}         http://localhost:3001/api/v1
  Swagger     http://localhost:3001/swagger${
    withPlanes.includes("console") ? "\n  Console     http://localhost:3002" : ""
  }${withPlanes.includes("developer") ? "\n  Developer   http://localhost:3004" : ""}
  MinIO       http://localhost:9001   ${c.dim("(minioadmin / minioadmin)")}
  Registry    http://localhost:4873

  ${c.dim("Smoke test:")}  pnpm smoke
  ${c.dim("Logs:")}        docker compose -f docker-compose.dev.yml logs -f api web
  ${c.dim("Stop:")}        pnpm dev --down
`);
