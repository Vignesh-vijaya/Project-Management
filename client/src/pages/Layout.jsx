import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Loader2 as Loader2Icon } from "lucide-react";
import {
  useUser,
  SignIn,
  useAuth,
  CreateOrganization,
  useOrganizationList,
} from "@clerk/clerk-react";

// COMPONENTS
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

// FEATURES
import { loadTheme } from "../features/themeSlice";
import { fetchWorkspaces } from "../features/workspaceSlice";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { loading: workspaceLoading, workspaces } = useSelector(
    (state) => state.workspace
  );
  const dispatch = useDispatch();

  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();

  // Check for Organization Memberships
  // Clerk's useOrganizationList may return different shapes (array or object with count).
  const { userMemberships, isLoaded: isOrgsLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  // 1. Initial load of theme
  useEffect(() => {
    dispatch(loadTheme());
  }, [dispatch]);

  // 2. Initial load of workspaces
  // We intentionally do NOT include getToken in deps to avoid unnecessary re-runs.
  useEffect(() => {
    if (isUserLoaded && user && Array.isArray(workspaces) && workspaces.length === 0 && !workspaceLoading) {
      // pass getToken function to the thunk (our thunk will call it)
      dispatch(fetchWorkspaces(getToken));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserLoaded, user, workspaces.length, workspaceLoading, dispatch]);

  // Helper: robust check for whether the user has organizations
  const hasOrgs = (() => {
    if (!userMemberships) return false;
    if (Array.isArray(userMemberships)) return userMemberships.length > 0;
    if (typeof userMemberships.count === "number") return userMemberships.count > 0;
    // fallback: check if object has any keys
    if (typeof userMemberships === "object") {
      return Object.keys(userMemberships).length > 0;
    }
    return Boolean(userMemberships);
  })();

  // --- RENDER LOGIC ---

  // A. Wait for Clerk Data (User & Orgs) to load
  if (!isUserLoaded || !isOrgsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
        <Loader2Icon className="size-7 text-blue-500 animate-spin" />
      </div>
    );
  }

  // B. If no user -> Sign In
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
        <SignIn />
      </div>
    );
  }

  // C. If user has no organizations -> onboarding CreateOrganization
  if (!hasOrgs) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-zinc-950 gap-4 overflow-auto py-10">
        <p className="text-gray-900 dark:text-slate-100 text-lg font-medium">
          Welcome! Please create an organization to get started.
        </p>
        <div className="flex justify-center w-full max-w-md">
          <CreateOrganization afterCreateOrganizationUrl="/" />
        </div>
      </div>
    );
  }

  // D. If App Data is loading -> Spinner
  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
        <Loader2Icon className="size-7 text-blue-500 animate-spin" />
      </div>
    );
  }

  // E. (Optional) Sync Check: Clerk has orgs but App has none
  // Use defensive checks for workspaces being defined and an array
  if (!Array.isArray(workspaces) || workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-zinc-950 gap-4">
        <p className="text-gray-900 dark:text-slate-100">
          Organizations found, but not synced to dashboard yet.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Refresh Dashboard
        </button>
      </div>
    );
  }

  // F. Main App Layout
  return (
    <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col h-screen">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
