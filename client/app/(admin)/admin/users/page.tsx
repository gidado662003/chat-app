"use client";

import { useEffect, useMemo, useState } from "react";
import { adminAPI } from "@/lib/adminApi";
import type { AdminUser } from "@/lib/adminTypes";
import { formatDate } from "@/helper/dateFormat";
import axios from "axios";
import { socket } from "../../../../lib/socket";
import { useRouter } from "next/navigation";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  // create form
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await adminAPI.getUsers();
        if (!cancelled) setUsers(res);
      } catch {
        if (!cancelled) setError("Failed to load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // useEffect(() => {

  // }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u._id?.toLowerCase().includes(q)
    );
  }, [users, query]);

  async function create() {
    setCreating(true);
    setError(null);
    try {
      await adminAPI.createUser(newUser);
      const res = await adminAPI.getUsers();
      setUsers(res);
      setNewUser({ username: "", email: "", password: "" });
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as unknown;
        const maybeError =
          typeof data === "object" && data && "error" in data
            ? (data as { error?: string }).error
            : undefined;
        setError(maybeError || "Failed to create user");
      } else {
        setError("Failed to create user");
      }
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: string) {
    const ok = confirm("Delete this user? This cannot be undone.");
    if (!ok) return;
    setError(null);
    try {
      await adminAPI.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as unknown;
        const maybeError =
          typeof data === "object" && data && "error" in data
            ? (data as { error?: string }).error
            : undefined;
        setError(maybeError || "Failed to delete user");
      } else {
        setError("Failed to delete user");
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            View and manage registered users.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium">All users</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username/email/id…"
              className="w-full max-w-sm rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Username</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Role</th>
                  <th className="px-3 py-2 text-left">Last seen</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u._id} className="border-t">
                    <td className="px-3 py-2 font-medium">{u.username}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {u.email}
                    </td>
                    <td
                      className={`px-3 py-2 text-muted-foreground ${
                        u.isOnline ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {u.isOnline ? "online" : "offline"}
                    </td>
                    <td className="px-3 py-2">{u.role ?? "user"}</td>

                    <td className="px-3 py-2">
                      {!u.isOnline ? formatDate(u.lastSeen) : "online"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => router.push(`users/${u._id}`)}
                        className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                      >
                        Show
                      </button>
                      <button
                        onClick={() => remove(u._id)}
                        className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {loading && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 text-sm font-medium">Create user</div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Username</label>
              <input
                value={newUser.username}
                onChange={(e) =>
                  setNewUser((p) => ({ ...p, username: e.target.value }))
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="jane"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Email</label>
              <input
                value={newUser.email}
                onChange={(e) =>
                  setNewUser((p) => ({ ...p, email: e.target.value }))
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="jane@example.com"
                type="email"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Password</label>
              <input
                value={newUser.password}
                onChange={(e) =>
                  setNewUser((p) => ({ ...p, password: e.target.value }))
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
                type="password"
              />
            </div>

            <button
              disabled={
                creating ||
                !newUser.username ||
                !newUser.email ||
                !newUser.password
              }
              onClick={create}
              className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create user"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
