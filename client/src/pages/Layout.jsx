import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useUser, useAuth } from "@clerk/clerk-react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { loadTheme } from "../features/themeSlice";
import { fetchWorkspaces } from "../features/workspaceSlice";

const Layout = () => {
  const dispatch = useDispatch();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    dispatch(loadTheme());
  }, [dispatch]);

  // Fetch workspaces automatically on load
  useEffect(() => {
    const initWorkspaces = async () => {
      if (isUserLoaded && user) {
        try {
          const token = await getToken();
          if (token) {
            dispatch(fetchWorkspaces(token));
          }
        } catch (err) {
          console.error("Failed to initialize workspaces:", err);
        }
      }
    };
    initWorkspaces();
  }, [isUserLoaded, user, getToken, dispatch]);

  if (!isUserLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-slate-100 font-sans">
      <div className="flex h-screen overflow-hidden">
        <Sidebar 
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen} 
        />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Navbar 
            isSidebarOpen={isSidebarOpen} 
            setIsSidebarOpen={setIsSidebarOpen} 
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;