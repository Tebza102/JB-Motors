"use client";

import { RefObject, useEffect, useRef } from "react";

const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])";

/** Modal focus contract: focus the first field, trap Tab/Shift+Tab, close on Escape, lock page scroll and restore focus on close. */
export function useModalFocus(panelRef:RefObject<HTMLElement | null>, onClose:() => void) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const firstField = panelRef.current?.querySelector<HTMLElement>("form :is(input, select, textarea):not([disabled])") ?? panelRef.current?.querySelector<HTMLElement>("button");
    firstField?.focus();
    const handleKey = (event:KeyboardEvent) => {
      if (event.key === "Escape") { closeRef.current(); return; }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((item) => !item.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!panelRef.current.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [panelRef]);
}
