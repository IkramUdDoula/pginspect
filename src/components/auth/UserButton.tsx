import { UserButton as ClerkUserButton } from "@clerk/react";
import { useTheme } from "@/hooks/use-theme";

export function UserButton() {
  const { theme } = useTheme();

  const getClerkAppearance = () => ({
    elements: {
      avatarBox: "w-9 h-9",
      userButtonPopoverCard: "shadow-lg",
      userButtonPopoverActionButton: "hover:bg-accent",
      userButtonPopoverActionButtonText: "text-foreground",
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
