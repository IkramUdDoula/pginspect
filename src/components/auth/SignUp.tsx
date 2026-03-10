import { SignUp as ClerkSignUp } from "@clerk/react";
import { Database } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function SignUp() {
  const { theme } = useTheme();

  const getClerkAppearance = () => ({
    elements: {
      rootBox: "w-full",
      card: "shadow-none bg-transparent border-0",
      headerTitle: "text-xl font-semibold text-foreground",
      headerSubtitle: "text-sm text-muted-foreground",
      socialButtonsBlockButton: "bg-secondary border border-border text-foreground hover:bg-surface-hover transition-colors",
      socialButtonsBlockButtonText: "text-foreground font-medium",
      formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
      formFieldInput: "bg-background border-border text-foreground",
      formFieldLabel: "text-muted-foreground text-xs uppercase tracking-wide",
      footerActionLink: "text-primary hover:text-primary/90",
      identityPreviewText: "text-foreground",
      identityPreviewEditButton: "text-primary hover:text-primary/90",
      dividerLine: "bg-border",
      dividerText: "text-muted-foreground",
      formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
      otpCodeFieldInput: "bg-background border-border text-foreground",
      formResendCodeLink: "text-primary hover:text-primary/90",
      alertText: "text-sm",
      formFieldErrorText: "text-destructive text-xs",
    },
    layout: {
      socialButtonsPlacement: "top" as const,
      socialButtonsVariant: "blockButton" as const,
    },
    variables: {
      colorPrimary: theme === "light" ? "hsl(38, 92%, 50%)" : "hsl(38, 92%, 50%)",
      colorBackground: theme === "light" ? "hsl(0, 0%, 100%)" : "hsl(0, 0%, 8%)",
      colorText: theme === "light" ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 93%)",
      colorTextSecondary: theme === "light" ? "hsl(0, 0%, 42%)" : "hsl(0, 0%, 50%)",
      colorInputBackground: theme === "light" ? "hsl(0, 0%, 100%)" : "hsl(0, 0%, 8%)",
      colorInputText: theme === "light" ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 93%)",
    },
  });
  return (
    <div className="min-h-screen flex items-center justify-center bg-background grid-texture p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Database className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">pgInspect</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Create an account to get started
          </p>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-6">
          <ClerkSignUp 
            appearance={getClerkAppearance()}
            routing="hash"
            signInUrl="/sign-in"
            redirectUrl="/app"
            afterSignUpUrl="/app"
          />
        </div>
      </div>
    </div>
  );
}
