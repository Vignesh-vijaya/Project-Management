// client/src/pages/Layout.jsx
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
  
  // State for mobile sidebar toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 1. Load theme preference on mount
  useEffect(() => {
    dispatch(loadTheme());
  }, [dispatch]);

  // 2. Initialize data (Fetch Workspaces)
  useEffect(() => {
    const initData = async () => {
      if (isUserLoaded && user) {
        try {
          // Get the token string safely
          const token = await getToken();
          // Dispatch action only if token exists
          if (token) {
            dispatch(fetchWorkspaces(token));
          }
        } catch (err) {
          console.error("Error initializing app data:", err);
        }
      }
    };
    initData();
  }, [isUserLoaded, user, getToken, dispatch]);

  // Show a simple loading state while Clerk loads
  if (!isUserLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar 
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen} 
        />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Top Navbar */}
          <Navbar 
            isSidebarOpen={isSidebarOpen} 
            setIsSidebarOpen={setIsSidebarOpen} 
          />
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;