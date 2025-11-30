// src/features/workspaceSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import API from "../configs/api";

export const fetchWorkspaces = createAsyncThunk(
  "workspace/fetchWorkspaces",
  // CHANGED: Accept 'token' (string) directly
  async (token, thunkAPI) => {
    try {
      if (!token || typeof token !== "string") {
        return thunkAPI.rejectWithValue({ message: "No valid token provided" });
      }

      // Pass token in headers
      const response = await API.get("/api/workspaces", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Extract workspaces array safely from your API response structure
      const workspacesFromResponse =
        response?.data?.workspaces ?? response?.data ?? [];

      if (!Array.isArray(workspacesFromResponse)) {
        return thunkAPI.rejectWithValue({
          message: "Invalid response format",
          payload: workspacesFromResponse,
        });
      }

      return workspacesFromResponse;
    } catch (error) {
      const message =
        error?.response?.data?.message ?? error?.message ?? "Unknown error";
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

      state.workspaces = incoming.map((w) => ({
        ...w,
        projects: Array.isArray(w.projects) ? w.projects : [],
      }));

      // Auto-select workspace logic
      if (state.workspaces.length > 0) {
        const savedWorkspaceId = localStorage.getItem("currentWorkspaceId");
        const workspaceToSet =
          state.workspaces.find((w) => w.id === savedWorkspaceId) ||
          state.workspaces[0];

        state.currentWorkspace = workspaceToSet;
        localStorage.setItem("currentWorkspaceId", workspaceToSet.id);
      } else {
        state.currentWorkspace = null;
      }
    });

    builder.addCase(fetchWorkspaces.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message ?? "Failed to fetch workspaces";
    });
  },
});

export const { setWorkspaces, setCurrentWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;