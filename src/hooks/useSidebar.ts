import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "visacheck-sidebar-collapsed";

function getInitialState(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function useSidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(getInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return { collapsed, toggleSidebar };
}
