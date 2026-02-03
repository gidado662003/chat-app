"use client";
import { useEffect } from "react";
import { authAPI } from "../app/api";
import { useAuthStore } from "../lib/store";

export default function TokenHandler() {
  const { user, setUser, } = useAuthStore();
  console.log("user", user);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (!token) return;

      (async () => {
        try {
          const serverOrigin = `${window.location.protocol}//${window.location.hostname}:5001`;

          // Step 1: Exchange token for cookie
          console.log("[TokenHandler] Exchanging token for cookie...");
          const response = await fetch(`${serverOrigin}/auth/token`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          if (typeof window !== "undefined") {
            sessionStorage.setItem("erp_token", token);
          }
          const data = await response.json();
          console.log("data", data);
          if (data.ok) {
            setUser(data.user);
          }

          // Step 2: Sync user profile
          console.log("[TokenHandler] Syncing user profile...");


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
