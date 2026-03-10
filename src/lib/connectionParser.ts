export interface ParsedConnection {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  sslMode: string;
  error?: string;
}

export function parseConnectionString(url: string): ParsedConnection {
  const defaults: ParsedConnection = { host: "", port: 5432, database: "postgres", user: "postgres", password: "", sslMode: "disable" };
  if (!url.trim()) return { ...defaults, error: "Empty connection string" };

  try {
    const match = url.match(
      /^postgres(?:ql)?:\/\/([^:@]+)(?::([^@]*))?@([^:/?]+)(?::(\d+))?\/([^?]*)?(?:\?(.*))?$/
    );
    if (!match) return { ...defaults, error: "Invalid format. Expected: postgres://user:pass@host:port/database" };

    const [, user, password, host, port, database, params] = match;
    const result: ParsedConnection = {
      host: host || "",
      port: port ? parseInt(port, 10) : 5432,
      database: database || "postgres",
      user: user ? decodeURIComponent(user) : "postgres",
      password: password ? decodeURIComponent(password) : "",
      sslMode: "disable",
    };

    if (params) {
      const searchParams = new URLSearchParams(params);
      result.sslMode = searchParams.get("sslmode") || "disable";
    }

    return result;
  } catch {
    return { ...defaults, error: "Failed to parse connection string" };
  }
}

export const cloudPresets: Record<string, { host: string; port: number; sslMode: string; hint: string; docsUrl: string; color: string }> = {
  Supabase: {
    host: "db.<project-ref>.supabase.co",
    port: 5432,
    sslMode: "require",
    hint: "Settings → Database → Connection string → URI",
    docsUrl: "https://supabase.com/docs/guides/database/connecting-to-postgres",
    color: "#3ECF8E",
  },
  Neon: {
    host: "<endpoint>.neon.tech",
    port: 5432,
    sslMode: "require",
    hint: "Dashboard → Connection Details → Connection string",
    docsUrl: "https://neon.tech/docs/connect/connect-from-any-app",
    color: "#00E599",
  },
  Railway: {
    host: "<host>.railway.internal",
    port: 5432,
    sslMode: "require",
    hint: "Service → Variables → DATABASE_URL",
    docsUrl: "https://docs.railway.app/databases/postgresql",
    color: "#A855F7",
  },
  Render: {
    host: "<host>.render.com",
    port: 5432,
    sslMode: "require",
    hint: "Dashboard → PostgreSQL → External Database URL",
    docsUrl: "https://render.com/docs/databases",
    color: "#46E3B7",
  },
  "AWS RDS": {
    host: "<instance>.rds.amazonaws.com",
    port: 5432,
    sslMode: "require",
    hint: "RDS Console → Databases → Connectivity & security",
    docsUrl: "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ConnectToPostgreSQLInstance.html",
    color: "#FF9900",
  },
  PlanetScale: {
    host: "<host>.psdb.cloud",
    port: 5432,
    sslMode: "require",
    hint: "Dashboard → Connect → General connection string",
    docsUrl: "https://planetscale.com/docs",
    color: "#F472B6",
  },
};
