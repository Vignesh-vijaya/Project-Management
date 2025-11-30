// features/workspaceSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import API from "../configs/api";

export const fetchWorkspaces = createAsyncThunk(
  "workspace/fetchWorkspaces",
  // expects a function (getToken) passed from the component
  async (gettoken, thunkAPI) => {
    try {
      const token = await gettoken();
      const { data } = await API.get("/api/workspaces", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // ensure we always return an array
      return data?.workspaces ?? [];
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      return [];
    }
  }
);

const initialState = {
  workspaces: [],
  currentWorkspace: null, // { id, name, projects: [...] } or null
  loading: false,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setWorkspaces: (state, action) => {
      state.workspaces = Array.isArray(action.payload) ? action.payload : [];
    },
    setCurrentWorkspace: (state, action) => {
      const id = action.payload;
      localStorage.setItem("currentWorkspaceId", id);
      const found = state.workspaces.find((w) => w.id === id) ?? null;
      state.currentWorkspace = found;
    },
    addWorkspace: (state, action) => {
      const ws = action.payload;
      // normalize projects array
      ws.projects = Array.isArray(ws.projects) ? ws.projects : [];
      state.workspaces.push(ws);
      // if no current workspace, set the newly created one
      if (!state.currentWorkspace) {
        state.currentWorkspace = ws;
        localStorage.setItem("currentWorkspaceId", ws.id);
      }
    },
    updateWorkspace: (state, action) => {
      const updated = action.payload;
      state.workspaces = state.workspaces.map((w) =>
        w.id === updated.id ? { ...w, ...updated } : w
      );
      if (state.currentWorkspace?.id === updated.id) {
        state.currentWorkspace = { ...state.currentWorkspace, ...updated };
      }
    },
    deleteWorkspace: (state, action) => {
      // expects payload = workspaceId (string)
      const idToDelete = action.payload;
      state.workspaces = state.workspaces.filter((w) => w.id !== idToDelete);
      if (state.currentWorkspace?.id === idToDelete) {
        state.currentWorkspace = state.workspaces[0] ?? null;
        localStorage.setItem(
          "currentWorkspaceId",
          state.currentWorkspace ? state.currentWorkspace.id : ""
        );
      }
    },

    // addProject: expects payload = { workspaceId, project }
    addProject: (state, action) => {
      const { workspaceId, project } = action.payload;
      // ensure project has tasks array
      project.tasks = Array.isArray(project.tasks) ? project.tasks : [];

      // add to the workspace in array
      state.workspaces = state.workspaces.map((w) =>
        w.id === workspaceId
          ? { ...w, projects: Array.isArray(w.projects) ? w.projects.concat(project) : [project] }
          : w
      );

      // if currentWorkspace matches, also update it
      if (state.currentWorkspace?.id === workspaceId) {
        state.currentWorkspace = {
          ...state.currentWorkspace,
          projects: Array.isArray(state.currentWorkspace.projects)
            ? state.currentWorkspace.projects.concat(project)
            : [project],
        };
      }
    },

    /* addTask: expects payload = { workspaceId, projectId, task }
       - task must be an object with an id
    */
    addTask: (state, action) => {
      const { workspaceId, projectId, task } = action.payload;

      // update in workspaces list
      state.workspaces = state.workspaces.map((w) => {
        if (w.id !== workspaceId) return w;
        return {
          ...w,
          projects: (w.projects || []).map((p) =>
            p.id === projectId ? { ...p, tasks: (p.tasks || []).concat(task) } : p
          ),
        };
      });

      // update current workspace if matches
      if (state.currentWorkspace?.id === workspaceId) {
        state.currentWorkspace = {
          ...state.currentWorkspace,
          projects: (state.currentWorkspace.projects || []).map((p) =>
            p.id === projectId ? { ...p, tasks: (p.tasks || []).concat(task) } : p
          ),
        };
      }
    },

    /* updateTask: expects payload = { workspaceId, projectId, task } where task has id */
    updateTask: (state, action) => {
      const { workspaceId, projectId, task } = action.payload;
      state.workspaces = state.workspaces.map((w) => {
        if (w.id !== workspaceId) return w;
        return {
          ...w,
          projects: (w.projects || []).map((p) =>
            p.id === projectId
              ? { ...p, tasks: (p.tasks || []).map((t) => (t.id === task.id ? task : t)) }
              : p
          ),
        };
      });

      if (state.currentWorkspace?.id === workspaceId) {
        state.currentWorkspace = {
          ...state.currentWorkspace,
          projects: (state.currentWorkspace.projects || []).map((p) =>
            p.id === projectId
              ? { ...p, tasks: (p.tasks || []).map((t) => (t.id === task.id ? task : t)) }
              : p
          ),
        };
      }
    },

    /* deleteTask: expects payload = { workspaceId, projectId, taskIds: [] } */
    deleteTask: (state, action) => {
      const { workspaceId, projectId, taskIds } = action.payload;
      const idsToRemove = Array.isArray(taskIds) ? taskIds : [taskIds];

      state.workspaces = state.workspaces.map((w) => {
        if (w.id !== workspaceId) return w;
        return {
          ...w,
          projects: (w.projects || []).map((p) =>
            p.id === projectId
              ? { ...p, tasks: (p.tasks || []).filter((t) => !idsToRemove.includes(t.id)) }
              : p
          ),
        };
      });

      if (state.currentWorkspace?.id === workspaceId) {
        state.currentWorkspace = {
          ...state.currentWorkspace,
          projects: (state.currentWorkspace.projects || []).map((p) =>
            p.id === projectId
              ? { ...p, tasks: (p.tasks || []).filter((t) => !idsToRemove.includes(t.id)) }
              : p
          ),
        };
      }
    },
  },

  extraReducers: (builder) => {
    builder.addCase(fetchWorkspaces.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(fetchWorkspaces.fulfilled, (state, action) => {
      state.loading = false;
      const incoming = Array.isArray(action.payload) ? action.payload : [];

      // ensure projects arrays exist
      state.workspaces = incoming.map((w) => ({ ...w, projects: Array.isArray(w.projects) ? w.projects : [] }));

      if (state.workspaces.length > 0) {
        const savedWorkspaceId = localStorage.getItem("currentWorkspaceId");
        const workspaceToSet =
          state.workspaces.find((w) => w.id === savedWorkspaceId) || state.workspaces[0];
        state.currentWorkspace = workspaceToSet;
        localStorage.setItem("currentWorkspaceId", workspaceToSet.id);
      } else {
        state.currentWorkspace = null;
      }
    });

    builder.addCase(fetchWorkspaces.rejected, (state) => {
      state.loading = false;
    });
  },
});

export const {
  setWorkspaces,
  setCurrentWorkspace,
  addWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addProject,
  addTask,
  updateTask,
  deleteTask,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
