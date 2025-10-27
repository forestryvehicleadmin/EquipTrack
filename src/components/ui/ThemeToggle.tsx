"use client"

import React from "react";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    // determine initial theme: localStorage -> system
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') {
        const dark = stored === 'dark';
        setIsDark(dark);
        document.documentElement.classList.toggle('dark', dark);
        return;
      }
    } catch (e) {
      // ignore (e.g., SSR or disabled storage)
    }

    // fallback to prefers-color-scheme
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
  }, []);

  const onToggle = (checked: boolean) => {
    setIsDark(checked);
    try {
      localStorage.setItem('theme', checked ? 'dark' : 'light');
    } catch (e) {
      // ignore
    }
    document.documentElement.classList.toggle('dark', checked);
  };

  if (isDark === null) return null; // avoid hydration mismatch

  return (
    <div className="flex items-center gap-2">
      <Sun className="w-4 h-4 text-foreground/70" />
      <Switch
        checked={!!isDark}
        onCheckedChange={onToggle}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      />
      <Moon className="w-4 h-4 text-foreground/70" />
    </div>
  );
}
