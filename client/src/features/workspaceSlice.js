// features/workspaceSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import API from "../configs/api";

export const fetchWorkspaces = createAsyncThunk(
  "workspace/fetchWorkspaces",
  // CHANGED: We now expect a 'token' string, not a function
  async (token, thunkAPI) => {
    try {
      // Validate we actually got a string
      if (!token || typeof token !== "string") {
        console.warn("[fetchWorkspaces] Aborting: No valid token provided.");
        return thunkAPI.rejectWithValue({ message: "No authentication token provided" });
      }

      console.info("[fetchWorkspaces] using token...");

      // Call the API with the token in headers
      const response = await API.get("/api/workspaces", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.info("[fetchWorkspaces] response:", response);

      // Handle response structure (checking response.data or response.data.workspaces)
      const workspacesFromResponse =
        response?.data?.workspaces ?? response?.data ?? [];

      // Ensure it is an array
      if (!Array.isArray(workspacesFromResponse)) {
        const msg = `[fetchWorkspaces] Unexpected response shape. Expected array but got ${typeof workspacesFromResponse}`;
        console.warn(msg, workspacesFromResponse);
        return thunkAPI.rejectWithValue({ message: msg, payload: workspacesFromResponse });
      }

      return workspacesFromResponse;
    } catch (error) {
      console.error("[fetchWorkspaces] error:", error);
      const message = error?.response?.data?.message ?? error?.message ?? "Unknown error";
      return thunkAPI.rejectWithValue({ message, raw: error });
    }
  }
);

const initialState = {
  workspaces: [],
  currentWorkspace: null,
  loading: false,
  error: null,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setWorkspaces(state, action) {
      state.workspaces = Array.isArray(action.payload) ? action.payload : [];
    },
    setCurrentWorkspace(state, action) {
      const id = action.payload;
      localStorage.setItem("currentWorkspaceId", id);
      const found = state.workspaces.find((w) => w.id === id) ?? null;
      state.currentWorkspace = found;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchWorkspaces.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(fetchWorkspaces.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      const incoming = Array.isArray(action.payload) ? action.payload : [];

      // Normalize projects array safely
      state.workspaces = incoming.map((w) => ({
        ...w,
        projects: Array.isArray(w.projects) ? w.projects : [],
      }));

      // Auto-select logic: Restore from localStorage or pick the first one
      if (state.workspaces.length > 0) {
        const savedWorkspaceId = localStorage.getItem("currentWorkspaceId");
        // Find saved one OR default to first
        const workspaceToSet = state.workspaces.find((w) => w.id === savedWorkspaceId) || state.workspaces[0];
        
        state.currentWorkspace = workspaceToSet;
        localStorage.setItem("currentWorkspaceId", workspaceToSet.id);
      } else {
        state.currentWorkspace = null;
      }
    });

    builder.addCase(fetchWorkspaces.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message ?? "Failed to fetch workspaces";
      console.warn("[workspaceSlice] fetchWorkspaces rejected:", action.payload ?? action.error);
    });
  },
});

export const { setWorkspaces, setCurrentWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;