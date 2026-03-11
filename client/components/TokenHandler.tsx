"use client";
import { useEffect } from "react";
import { authAPI } from "../app/api";
import { useAuthStore } from "../lib/store";

export default function TokenHandler() {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (!token) return;

      (async () => {
        try {
          const serverOrigin = window.location.origin;

          // Step 1: Exchange token for cookie

          const response = await fetch(`${serverOrigin}/api/auth/token`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          if (typeof window !== "undefined") {
            sessionStorage.setItem("erp_token", token);
          }
          const data = await response.json();

          // Step 2: Sync user profile in our MongoDB (authoritative user record)

          const syncResponse = await authAPI.syncUserProfile();

          // Step 3: Store user in auth store
          if (syncResponse.user) {
            setUser(syncResponse.user);
          }

          // Step 4: Remove token from URL
          const newUrl = window.location.pathname + window.location.hash;
          window.history.replaceState(null, "", newUrl);
        } catch (err) {
          console.error("[TokenHandler] Sync error:", err);
        }
      })();
    } catch (err) {
      console.error("Token handler error:", err);
    }
  }, [setUser]);

  return null;
}
