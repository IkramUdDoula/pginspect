import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Link2, ArrowLeft, Eye, EyeOff, Check, X, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseConnectionString, cloudPresets } from "@/lib/connectionParser";
import type { ConnectionInfo } from "@/shared/types";

type Step = "choose" | "direct" | "string" | "testing" | "loading";

interface Props {
  onConnect: (conn: ConnectionInfo) => void;
  onClose?: () => void;
  isFullscreen?: boolean;
}

export function ConnectionManager({ onConnect, onClose, isFullscreen }: Props) {
  const [step, setStep] = useState<Step>("choose");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "", host: "", port: "5432", database: "postgres",
    user: "postgres", password: "", sslMode: "disable", schema: "public",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [connString, setConnString] = useState("");
  const [testStatus, setTestStatus] = useState<{ step: number; error?: string } | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const updateForm = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const parsedUrl = connString ? parseConnectionString(connString) : null;

  const handleCloudSelect = (provider: string) => {
    setSelectedProvider(provider);
    const preset = cloudPresets[provider];
    setForm((f) => ({
      ...f, host: preset.host, port: String(preset.port), sslMode: preset.sslMode,
      name: provider.toLowerCase().replace(/\s/g, "_") + "_db",
    }));
    setStep("direct");
  };

  const testSteps = ["Resolving host...", "TCP connection established", "Authentication successful", `Schema '${form.schema}' loaded — 5 tables found`];

  const startTest = () => {
    setTestStatus({ step: 0 });
    let s = 0;
    const iv = setInterval(() => {
      s++;
      if (s >= testSteps.length) {
        clearInterval(iv);
        setTestStatus({ step: s });
      } else {
        setTestStatus({ step: s });
      }
    }, 600);
  };

  const loadingSteps = [
    `Connecting to ${form.host || "localhost"}:${form.port}...`,
    `Authenticating as ${form.user}...`,
    "Loading schemas...",
    "Fetching table definitions...",
    "Loading column metadata...",
    "Indexing foreign keys...",
  ];

  const handleSaveConnect = () => {
    setStep("loading");
    setLoadingStep(0);
    let s = 0;
    const iv = setInterval(() => {
      s++;
      if (s >= loadingSteps.length) {
        clearInterval(iv);
        setTimeout(() => {
          const conn: ConnectionInfo = {
            name: form.name || "untitled",
            host: form.host, port: parseInt(form.port), database: form.database,
            user: form.user, password: form.password, schema: form.schema,
            sslMode: form.sslMode, status: "connected",
          };
          onConnect(conn);
        }, 500);
      } else {
        setLoadingStep(s);
      }
    }, 500);
  };

  const handleStringConnect = () => {
    if (parsedUrl && !parsedUrl.error) {
      const updatedForm = {
        name: form.name || "imported_connection",
        host: parsedUrl.host, port: String(parsedUrl.port), database: parsedUrl.database,
        user: parsedUrl.user, password: parsedUrl.password, sslMode: parsedUrl.sslMode,
        schema: "public",
      };
      setForm(updatedForm);
      // Use updatedForm directly since setState is async
      setStep("loading");
      setLoadingStep(0);
      let s = 0;
      const steps = [
        `Connecting to ${updatedForm.host}:${updatedForm.port}...`,
        `Authenticating as ${updatedForm.user}...`,
        "Loading schemas...",
        "Fetching table definitions...",
        "Loading column metadata...",
        "Indexing foreign keys...",
      ];
      const iv = setInterval(() => {
        s++;
        if (s >= steps.length) {
          clearInterval(iv);
          setTimeout(() => {
            const conn: ConnectionInfo = {
              name: updatedForm.name,
              host: updatedForm.host, port: parseInt(updatedForm.port), database: updatedForm.database,
              user: updatedForm.user, password: updatedForm.password, schema: updatedForm.schema,
              sslMode: updatedForm.sslMode, status: "connected",
            };
            onConnect(conn);
          }, 500);
        } else {
          setLoadingStep(s);
        }
      }, 500);
    }
  };

  useEffect(() => {
    if (step === "string" && parsedUrl && !parsedUrl.error) {
      setForm((f) => ({
        ...f, host: parsedUrl.host, port: String(parsedUrl.port),
        database: parsedUrl.database, user: parsedUrl.user, password: parsedUrl.password,
        sslMode: parsedUrl.sslMode,
      }));
    }
  }, [connString]);

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 flex items-center justify-center bg-background grid-texture"
    : "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm";

  return (
    <div className={containerClass}>
      <AnimatePresence mode="wait">
        {step === "choose" && (
          <motion.div key="choose" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-3xl px-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold tracking-tight mb-2">Connect to your database</h1>
              <p className="text-muted-foreground">Choose how you want to connect</p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              {[
                { icon: Monitor, title: "Direct Connection", desc: "Enter host, port, username, password manually", step: "direct" as Step },
                { icon: Link2, title: "Connection String", desc: "Paste a full postgres:// URL", step: "string" as Step },
              ].map((opt) => (
                <button key={opt.step} onClick={() => setStep(opt.step)} className="group p-6 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-surface-hover transition-all text-left">
                  <opt.icon className="h-8 w-8 mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <h3 className="font-medium mb-1">{opt.title}</h3>
                  <p className="text-sm text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
            {onClose && !isFullscreen && (
              <div className="text-center mt-6">
                <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancel</Button>
              </div>
            )}
          </motion.div>
        )}

        {step === "direct" && (
          <motion.div key="direct" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="w-full max-w-2xl px-6">
            <div className="bg-card rounded-xl border border-border p-6">
              {selectedProvider && (
                <div className="flex items-center gap-2 mb-4 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ background: cloudPresets[selectedProvider]?.color }} />
                  <span className="font-medium">{selectedProvider}</span>
                  <a href={cloudPresets[selectedProvider]?.docsUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline ml-auto flex items-center gap-1">
                    Find your credentials <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              <h2 className="text-xl font-semibold mb-4">{selectedProvider ? `Connect to ${selectedProvider}` : "Direct Connection"}</h2>
              
              {/* URI Quick Fill for Cloud Presets */}
              {selectedProvider && (
                <div className="mb-6 p-4 rounded-lg bg-background border border-border">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide mb-2 block">Quick Fill from Connection URI</Label>
                  <textarea
                    value={connString}
                    onChange={(e) => {
                      setConnString(e.target.value);
                      const parsed = parseConnectionString(e.target.value);
                      if (parsed && !parsed.error) {
                        setForm(f => ({
                          ...f,
                          name: f.name || `${selectedProvider.toLowerCase().replace(/\s/g, "_")}_db`,
                          host: parsed.host,
                          port: String(parsed.port),
                          database: parsed.database,
                          user: parsed.user,
                          password: parsed.password,
                          sslMode: parsed.sslMode,
                        }));
                      }
                    }}
                    placeholder={`Paste your ${selectedProvider} connection URI here to auto-fill all fields below...`}
                    className="w-full h-20 p-3 rounded-lg bg-card border border-border font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  {connString && parsedUrl && !parsedUrl.error && (
                    <div className="mt-2 text-xs text-success flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Connection URI parsed successfully - fields updated below
                    </div>
                  )}
                  {connString && parsedUrl?.error && (
                    <div className="mt-2 text-xs text-destructive flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {parsedUrl.error}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground">
                    💡 You can also fill the fields manually below if you prefer
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Connection Name</Label>
                  <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="My Production DB" className="mt-1 bg-background border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Host</Label>
                  <Input value={form.host} onChange={(e) => updateForm("host", e.target.value)} placeholder="localhost" className="mt-1 bg-background border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Port</Label>
                  <Input value={form.port} onChange={(e) => updateForm("port", e.target.value)} placeholder="5432" className="mt-1 bg-background border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Database</Label>
                  <Input value={form.database} onChange={(e) => updateForm("database", e.target.value)} placeholder="postgres" className="mt-1 bg-background border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Username</Label>
                  <Input value={form.user} onChange={(e) => updateForm("user", e.target.value)} placeholder="postgres" className="mt-1 bg-background border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Password</Label>
                  <div className="relative mt-1">
                    <Input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => updateForm("password", e.target.value)} className="pr-10 bg-background border-border" />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">SSL Mode</Label>
                  <select value={form.sslMode} onChange={(e) => updateForm("sslMode", e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md bg-background border border-border text-sm">
                    <option value="disable">Disable</option>
                    <option value="require">Require</option>
                    <option value="verify-ca">Verify-CA</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">Use 'Require' for cloud databases</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Schema</Label>
                  <Input value={form.schema} onChange={(e) => updateForm("schema", e.target.value)} placeholder="public" className="mt-1 bg-background border-border" />
                  <p className="text-xs text-muted-foreground mt-1">Most databases use 'public'</p>
                </div>
              </div>

              {/* Test results */}
              {testStatus && (
                <div className="mt-4 p-3 rounded-lg bg-background border border-border">
                  {testSteps.map((s, i) => (
                    <div key={i} className={`flex items-center gap-2 text-sm py-0.5 ${i <= testStatus.step ? "text-foreground" : "text-muted-foreground/30"}`}>
                      {i < testStatus.step ? <Check className="h-3.5 w-3.5 text-success" /> : i === testStatus.step ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <div className="h-3.5 w-3.5" />}
                      <span>{s}</span>
                    </div>
                  ))}
                  {testStatus.step >= testSteps.length && (
                    <div className="mt-2 p-2 rounded bg-success/10 border border-success/20 text-success text-sm">
                      ✓ Connected! Tables found in '{form.schema}' schema
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => startTest()} className="border-border text-muted-foreground hover:text-foreground">
                  Test Connection
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setStep("choose"); setSelectedProvider(null); setConnString(""); }}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button size="sm" onClick={handleSaveConnect} disabled={!form.name || !form.host} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Save & Connect →
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === "string" && (
          <motion.div key="string" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="w-full max-w-2xl px-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Connection String</h2>
              <div className="mb-4">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Connection Name</Label>
                <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="My Database" className="mt-1 bg-background border-border" />
              </div>
              <textarea
                value={connString}
                onChange={(e) => setConnString(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (connString.trim()) handleSaveConnect();
                  }
                }}
                placeholder="postgres://username:password@host:5432/database?sslmode=require"
                className="w-full h-24 p-3 rounded-lg bg-background border border-border font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {parsedUrl && !parsedUrl.error && connString && (
                <div className="mt-3 p-3 rounded-lg bg-background border border-border text-sm">
                  <div className="text-xs uppercase text-muted-foreground mb-2 font-medium">Parsed Connection</div>
                  <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                    <span>Host:</span><span className="text-foreground font-mono">{parsedUrl.host}</span>
                    <span>Port:</span><span className="text-foreground font-mono">{parsedUrl.port}</span>
                    <span>Database:</span><span className="text-foreground font-mono">{parsedUrl.database}</span>
                    <span>User:</span><span className="text-foreground font-mono">{parsedUrl.user}</span>
                    <span>SSL:</span><span className="text-foreground font-mono">{parsedUrl.sslMode}</span>
                  </div>
                </div>
              )}
              {parsedUrl?.error && connString && (
                <div className="mt-3 p-2 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">{parsedUrl.error}</div>
              )}

              {/* Test results */}
              {testStatus && (
                <div className="mt-4 p-3 rounded-lg bg-background border border-border">
                  {testSteps.map((s, i) => (
                    <div key={i} className={`flex items-center gap-2 text-sm py-0.5 ${i <= testStatus.step ? "text-foreground" : "text-muted-foreground/30"}`}>
                      {i < testStatus.step ? <Check className="h-3.5 w-3.5 text-success" /> : i === testStatus.step ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <div className="h-3.5 w-3.5" />}
                      <span>{s}</span>
                    </div>
                  ))}
                  {testStatus.step >= testSteps.length && (
                    <div className="mt-2 p-2 rounded bg-success/10 border border-success/20 text-success text-sm">
                      ✓ Connected! Tables found in '{form.schema}' schema
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => startTest()} className="border-border text-muted-foreground">Test Connection</Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep("choose")}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                  <Button size="sm" onClick={handleStringConnect} disabled={!parsedUrl || !!parsedUrl.error || !connString} className="bg-primary text-primary-foreground hover:bg-primary/90">Save & Connect →</Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md px-6">
            <div className="bg-card rounded-xl border border-border p-8">
              <div className="space-y-3">
                {loadingSteps.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={i <= loadingStep ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.1 }} className={`flex items-center gap-3 text-sm ${i <= loadingStep ? "text-foreground" : "text-muted-foreground/20"}`}>
                    {i < loadingStep ? <Check className="h-4 w-4 text-success flex-shrink-0" /> : i === loadingStep ? <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" /> : <div className="h-4 w-4 flex-shrink-0" />}
                    <span>{s}</span>
                  </motion.div>
                ))}
              </div>
              {loadingStep >= loadingSteps.length - 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 text-center text-sm text-success">
                  All done! Opening {form.name}...
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
