// src/layouts/Layout.jsx
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
// import { Loader2 as Loader2Icon } from "lucide-react"; // Uncomment if needed
import {
  useUser,
  useAuth,
  useOrganizationList,
} from "@clerk/clerk-react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import API from "../configs/api";
import { loadTheme } from "../features/themeSlice";
import { fetchWorkspaces } from "../features/workspaceSlice";

/* safe stringify to avoid crashes */
const safeStringify = (obj, max = 1200) => {
  try {
    const s = JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? v.toString() : v));
    return s.length > max ? s.slice(0, max) + "…(truncated)" : s;
  } catch (e) {
    return String(obj);
  }
};

const Layout = () => {
  const dispatch = useDispatch();

  // App / clerk state
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const { userMemberships, isLoaded: isOrgsLoaded } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  const workspaceState = useSelector((s) => s.workspace ?? { loading: false, workspaces: [], error: null });
  const { loading: workspaceLoading, workspaces, error: workspaceError } = workspaceState;

  // local debug state
  const [localToken, setLocalToken] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [alwaysShowDebug, setAlwaysShowDebug] = useState(true);

  // 1. load theme once
  useEffect(() => {
    dispatch(loadTheme());
  }, [dispatch]);

  // 2. UPDATED: Fetch workspaces (resolving token first)
  useEffect(() => {
    const initWorkspaces = async () => {
      if (isUserLoaded && user) {
        try {
          const token = await getToken();
          if (token) {
            console.info("[Layout] Dispatched fetchWorkspaces with token");
            dispatch(fetchWorkspaces(token));
          } else {
            console.warn("[Layout] No token available (user might not be signed in fully)");
          }
        } catch (err) {
          console.error("[Layout] Failed to get token or dispatch", err);
        }
      }
    };

    initWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserLoaded, user, dispatch]); 
  // removed getToken from deps loop to prevent infinite re-renders if getToken changes identity

  // helper to call getToken manually
  const handleGetToken = async () => {
    try {
      setApiError(null);
      const t = await getToken();
      setLocalToken(Boolean(t) ? `${String(t).slice(0, 8)}... (len ${String(t).length})` : null);
      console.info("[Layout] getToken returned", t ? "OK" : "NO_TOKEN");
      alert("Token retrieved — check debug panel and console");
    } catch (err) {
      console.error("[Layout] getToken error:", err);
      setApiError(String(err));
      setLocalToken(null);
      alert("getToken failed — check console and Debug panel");
    }
  };

  // helper to manually dispatch Redux action
  const handleManualDispatch = async () => {
    try {
      const t = await getToken();
      if (!t) {
        alert("No token! Cannot dispatch.");
        return;
      }
      dispatch(fetchWorkspaces(t));
      alert("Dispatched! Check Redux DevTools or Console.");
    } catch (e) {
      console.error(e);
      alert("Error dispatching: " + e.message);
    }
  };

  // helper to directly call /api/workspaces using API module
  const callApiWorkspaces = async () => {
    setApiResponse(null);
    setApiError(null);
    try {
      const t = await getToken();
      console.info("[Layout] using token (present?):", Boolean(t));
      const resp = await API.get("/api/workspaces", {
        headers: { Authorization: `Bearer ${t}` },
      });
      console.info("[Layout] /api/workspaces response:", resp);
      setApiResponse(resp);
    } catch (err) {
      console.error("[Layout] /api/workspaces error:", err);
      const friendly = err?.response?.data ?? err?.message ?? String(err);
      setApiError(friendly);
    }
  };

  // robust org check (unused in UI currently but good for logic)
  const hasOrgs = (() => {
    if (!userMemberships) return false;
    if (Array.isArray(userMemberships)) return userMemberships.length > 0;
    if (typeof userMemberships === "object" && typeof userMemberships.count === "number")
      return userMemberships.count > 0;
    if (typeof userMemberships === "object") return Object.keys(userMemberships).length > 0;
    return Boolean(userMemberships);
  })();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
      <div className="flex">
        <Sidebar isSidebarOpen={false} setIsSidebarOpen={() => {}} />
        <div className="flex-1">
          <Navbar isSidebarOpen={false} setIsSidebarOpen={() => {}} />
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">App Debug & Layout</h2>

            <div className="mb-4 p-4 border rounded bg-gray-50 dark:bg-zinc-900">
              <div className="flex gap-2 mb-2 flex-wrap">
                <button
                  onClick={handleGetToken}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Get Token
                </button>
                <button
                  onClick={callApiWorkspaces}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Call /api/workspaces
                </button>
                <button
                  onClick={handleManualDispatch}
                  className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Dispatch fetchWorkspaces
                </button>
                <button
                  onClick={() => {
                    setApiResponse(null);
                    setApiError(null);
                    setLocalToken(null);
                  }}
                  className="px-3 py-1 bg-gray-300 dark:bg-zinc-700 rounded hover:bg-gray-400"
                >
                  Clear
                </button>
                <label className="ml-auto flex items-center gap-2 text-sm select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alwaysShowDebug}
                    onChange={(e) => setAlwaysShowDebug(e.target.checked)}
                  />
                  Always show debug
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <strong>isUserLoaded:</strong> {String(isUserLoaded)} <br />
                  <strong>user:</strong> <pre className="max-h-28 overflow-auto text-xs">{safeStringify(user)}</pre>
                </div>

                <div>
                  <strong>isOrgsLoaded:</strong> {String(isOrgsLoaded)} <br />
                  <strong>userMemberships:</strong> <pre className="max-h-28 overflow-auto text-xs">{safeStringify(userMemberships)}</pre>
                </div>

                <div>
                  <strong>workspaceLoading:</strong> {String(workspaceLoading)} <br />
                  <strong>workspaces length:</strong>{" "}
                  {Array.isArray(workspaces) ? workspaces.length : String(typeof workspaces)}
                  <pre className="max-h-48 overflow-auto text-xs">{safeStringify(workspaces)}</pre>
                </div>

                <div>
                  <strong>workspace.error:</strong> <pre className="max-h-48 overflow-auto text-xs text-red-500">{safeStringify(workspaceError)}</pre>
                </div>
              </div>
            </div>

            <div className="mb-4 p-4 border rounded bg-white dark:bg-zinc-900">
              <h3 className="font-medium mb-2">API Call Result</h3>
              <div className="text-sm">
                <div>
                  <strong>Token (masked):</strong> {localToken ?? "<not retrieved>"}
                </div>
                <div className="mt-2">
                  <strong>API Response (object):</strong>
                  <pre className="max-h-64 overflow-auto bg-black/5 dark:bg-white/5 p-2 rounded mt-1 text-xs">
                    {safeStringify(apiResponse)}
                  </pre>
                </div>
                <div className="mt-2">
                  <strong>API Error:</strong>
                  <pre className="max-h-48 overflow-auto text-red-700 dark:text-red-300 text-xs">{safeStringify(apiError)}</pre>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded">
              <h3 className="font-medium mb-2">App Content Preview</h3>
              {Array.isArray(workspaces) && workspaces.length > 0 ? (
                <div>
                  <strong>Workspaces Loaded:</strong>
                  <ul className="mt-2 space-y-2">
                    {workspaces.map((w) => (
                      <li key={w.id || w._id || Math.random()} className="p-2 border rounded bg-gray-50 dark:bg-zinc-800">
                        <div className="font-bold">{w.name ?? w.title ?? `Workspace ${w.id ?? w._id}`}</div>
                        <div className="text-xs text-gray-500">
                          ID: {w.id} | Projects: {(w.projects && w.projects.length) || 0}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No workspaces in Redux yet.
                </div>
              )}
            </div>

            <div className="mt-6 border-t pt-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;