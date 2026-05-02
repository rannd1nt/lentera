"use client";

import { useEffect } from "react";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  handler: () => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matchKey = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchCtrl = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true;
        const matchAlt = shortcut.alt ? e.altKey : !e.altKey;
        const matchShift = shortcut.shift ? e.shiftKey : !e.shiftKey;

        if (matchKey && matchCtrl && matchAlt && matchShift) {
          if (shortcut.preventDefault !== false) e.preventDefault();
          shortcut.handler();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}
