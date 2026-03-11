import { UserButton as ClerkUserButton } from "@clerk/react";
import { useTheme } from "@/hooks/use-theme";

export function UserButton() {
  const { theme } = useTheme();

  const getClerkAppearance = () => ({
    elements: {
      avatarBox: "w-9 h-9",
      userButtonPopoverCard: {
        backgroundColor: theme === "light" ? "hsl(0, 0%, 100%)" : "hsl(0, 0%, 8%)",
        border: `1px solid ${theme === "light" ? "hsl(0, 0%, 90%)" : "hsl(0, 0%, 20%)"}`,
        boxShadow: theme === "light" 
          ? "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
          : "0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.2)",
      },
      userButtonPopoverActionButton: {
        color: theme === "light" ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 93%)",
        "&:hover": {
          backgroundColor: theme === "light" ? "hsl(0, 0%, 96%)" : "hsl(0, 0%, 14%)",
        },
      },
      userButtonPopoverActionButtonText: {
        color: theme === "light" ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 93%)",
      },
      userButtonPopoverActionButtonIcon: {
        color: theme === "light" ? "hsl(0, 0%, 42%)" : "hsl(0, 0%, 65%)",
      },
      userButtonPopoverFooter: "hidden",
    },
    variables: {
      colorPrimary: theme === "light" ? "hsl(38, 92%, 50%)" : "hsl(38, 92%, 50%)",
      colorBackground: theme === "light" ? "hsl(0, 0%, 100%)" : "hsl(0, 0%, 8%)",
      colorText: theme === "light" ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 93%)",
    },
  });

  return (
    <ClerkUserButton 
      appearance={getClerkAppearance()}
    />
  );
}
