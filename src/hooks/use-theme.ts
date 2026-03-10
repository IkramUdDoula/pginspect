import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("pgInspect-theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("pgInspect-theme", theme);
  }, [theme]);

  const toggle = () => {
    console.log("Toggle function executing, current theme:", theme);
    setTheme((t) => {
      const newTheme = t === "dark" ? "light" : "dark";
      console.log("Setting new theme:", newTheme);
      return newTheme;
    });
  };
  return { theme, toggle };
}