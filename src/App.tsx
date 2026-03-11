import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/react";
import { ConnectionProvider } from "@/contexts/ConnectionContext";
import { ViewProvider } from "@/contexts/ViewContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { setAuthTokenProvider } from "@/lib/apiClient";
import { SignIn } from "@/components/auth/SignIn";
import { SignUp } from "@/components/auth/SignUp";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useAuth } from "@clerk/react";
import React, { useEffect } from "react";

const queryClient = new QueryClient();

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

function AuthTokenProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setAuthTokenProvider(async () => {
        try {
          return await getToken();
        } catch (error) {
          console.error("Failed to get auth token:", error);
          return null;
        }
      });
    }
  }, [getToken, isLoaded, isSignedIn]);

  return <>{children}</>;
}

function ClerkProviderWithTheme({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  // Update data attribute on document for CSS selectors
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  
  // Use useMemo to ensure appearance object is recreated when theme changes
  const clerkAppearance = React.useMemo(() => ({
    baseTheme: undefined,
    variables: {
      colorPrimary: "hsl(38, 92%, 50%)",
      colorBackground: theme === "light" ? "hsl(0, 0%, 100%)" : "hsl(0, 0%, 8%)",
      colorText: theme === "light" ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 93%)",
      colorTextSecondary: theme === "light" ? "hsl(0, 0%, 42%)" : "hsl(0, 0%, 65%)",
      colorInputBackground: theme === "light" ? "hsl(0, 0%, 100%)" : "hsl(0, 0%, 12%)",
      colorInputText: theme === "light" ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 93%)",
      colorNeutral: theme === "light" ? "hsl(0, 0%, 95%)" : "hsl(0, 0%, 25%)",
      colorTextOnPrimaryBackground: "hsl(0, 0%, 100%)",
      colorShimmer: theme === "light" ? "hsl(0, 0%, 90%)" : "hsl(0, 0%, 20%)",
      colorAlphaShade: theme === "light" ? "hsl(0, 0%, 0%, 0.1)" : "hsl(0, 0%, 100%, 0.1)",
      borderRadius: "0.5rem",
    },
    elements: {
      card: {
        backgroundColor: theme === "light" ? "hsl(0, 0%, 100%)" : "hsl(0, 0%, 8%)",
        border: `1px solid ${theme === "light" ? "hsl(0, 0%, 90%)" : "hsl(0, 0%, 20%)"}`,
        boxShadow: theme === "light" 
          ? "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
          : "0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.2)",
      },
      headerTitle: {
        color: theme === "light" ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 93%)",
      },
      headerSubtitle: {
        color: theme === "light" ? "hsl(0, 0%, 42%)" : "hsl(0, 0%, 65%)",
      },
      socialButtonsBlockButton: {
        backgroundColor: theme === "light" ? "hsl(0, 0%, 100%)" : "hsl(0, 0%, 12%)",
        border: `1px solid ${theme === "light" ? "hsl(0, 0%, 90%)" : "hsl(0, 0%, 25%)"}`,
        color: theme === "light" ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 93%)",
      },
      formFieldLabel: {
        color: theme === "light" ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 93%)",
      },
      formFieldInput: {
        backgroundColor: theme === "light" ? "hsl(0, 0%, 100%)" : "hsl(0, 0%, 12%)",
        border: `1px solid ${theme === "light" ? "hsl(0, 0%, 90%)" : "hsl(0, 0%, 25%)"}`,
        color: theme === "light" ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 93%)",
        "&:focus": {
          borderColor: "hsl(38, 92%, 50%)",
          boxShadow: "0 0 0 2px hsl(38, 92%, 50%, 0.2)",
        },
      },
      footerActionText: {
        color: theme === "light" ? "hsl(0, 0%, 42%)" : "hsl(0, 0%, 65%)",
      },
      footerActionLink: {
        color: "hsl(38, 92%, 50%)",
        "&:hover": {
          color: "hsl(38, 92%, 45%)",
        },
      },
      userButtonPopoverCard: {
        backgroundColor: theme === "light" ? "hsl(0, 0%, 100%)" : "hsl(0, 0%, 8%)",
        border: `1px solid ${theme === "light" ? "hsl(0, 0%, 90%)" : "hsl(0, 0%, 20%)"}`,
        boxShadow: theme === "light" 
          ? "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
          : "0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.2)",
      },
      userButtonPopoverActionButton: {
        color: theme === "light" ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 93%)",
        backgroundColor: "transparent",
        "&:hover": {
          backgroundColor: theme === "light" ? "hsl(0, 0%, 96%)" : "hsl(0, 0%, 14%)",
          color: theme === "light" ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 93%)",
        },
      },
      userButtonPopoverActionButtonText: {
        color: theme === "light" ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 93%)",
        "&:hover": {
          color: theme === "light" ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 93%)",
        },
      },
      userButtonPopoverActionButtonIcon: {
        color: theme === "light" ? "hsl(0, 0%, 42%)" : "hsl(0, 0%, 65%)",
        "&:hover": {
          color: theme === "light" ? "hsl(0, 0%, 42%)" : "hsl(0, 0%, 65%)",
        },
      },
      userButtonPopoverFooter: {
        borderTop: `1px solid ${theme === "light" ? "hsl(0, 0%, 90%)" : "hsl(0, 0%, 20%)"}`,
      },
      userPreviewMainIdentifier: {
        color: theme === "light" ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 93%)",
      },
      userPreviewSecondaryIdentifier: {
        color: theme === "light" ? "hsl(0, 0%, 42%)" : "hsl(0, 0%, 65%)",
      },
    },
  }), [theme]);

  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={clerkAppearance}
    >
      {children}
    </ClerkProvider>
  );
}

const App = () => (
  <ThemeProvider>
    <ClerkProviderWithTheme>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthTokenProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/sign-in/*" element={<SignIn />} />
                <Route path="/sign-up/*" element={<SignUp />} />
                
                {/* Protected app route */}
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <ConnectionProvider>
                        <ViewProvider>
                          <Index />
                        </ViewProvider>
                      </ConnectionProvider>
                    </ProtectedRoute>
                  }
                />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthTokenProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProviderWithTheme>
  </ThemeProvider>
);

export default App;