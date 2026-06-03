import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PermissionFlags, PermissionMap } from "@/lib/types/roles";

const ALL_TRUE:  PermissionFlags = { canView: true,  canCreate: true,  canEdit: true,  canDelete: true  };
const ALL_FALSE: PermissionFlags = { canView: false, canCreate: false, canEdit: false, canDelete: false };

type RolesState = {
  /**
   * In-progress permission edits keyed by roleId.
   * Each value is a PermissionMap: route → { canView, canCreate, canEdit, canDelete }.
   * Only present for roles that have been opened for editing.
   * Cleared on discard; dirty flag cleared on save.
   */
  pendingPermissions: Record<string, PermissionMap>;

  /** Which roles have unsaved permission changes */
  dirtyRoles: Record<string, boolean>;

  /** The roleId whose name is currently being inline-edited (null = none) */
  editingRoleId: string | null;
};

const initialState: RolesState = {
  pendingPermissions: {},
  dirtyRoles: {},
  editingRoleId: null,
};

const rolesSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    /**
     * Seed pending state when a role's permission panel is first opened.
     * Skipped if pending state already exists (so unsaved edits survive tab switching).
     */
    initPendingPermissions(
      state,
      action: PayloadAction<{ roleId: string; permissions: PermissionMap }>
    ) {
      const { roleId, permissions } = action.payload;
      if (!state.pendingPermissions[roleId]) {
        state.pendingPermissions[roleId] = { ...permissions };
        state.dirtyRoles[roleId] = false;
      }
    },

    /**
     * Toggle a single flag (canView / canCreate / canEdit / canDelete) on one route.
     *
     * When canView is turned OFF, the other three flags are also forced OFF —
     * you can't create/edit/delete something you can't view.
     */
    toggleFlag(
      state,
      action: PayloadAction<{
        roleId: string;
        route:  string;
        flag:   keyof PermissionFlags;
        checked: boolean;
      }>
    ) {
      const { roleId, route, flag, checked } = action.payload;
      const current = state.pendingPermissions[roleId] ?? {};
      const existing = current[route] ?? { ...ALL_FALSE };

      let updated = { ...existing, [flag]: checked };

      // Turning off canView must revoke all other flags — nothing can be done without view access
      if (flag === "canView" && !checked) {
        updated = { ...ALL_FALSE };
      }

      state.pendingPermissions[roleId] = { ...current, [route]: updated };
      state.dirtyRoles[roleId] = true;
    },

    /**
     * Grant or revoke ALL four flags for a set of routes at once.
     * Used by the parent group checkbox (select all / deselect all).
     */
    setGroupPermissions(
      state,
      action: PayloadAction<{ roleId: string; routes: string[]; checked: boolean }>
    ) {
      const { roleId, routes, checked } = action.payload;
      const current = state.pendingPermissions[roleId] ?? {};
      const flags = checked ? { ...ALL_TRUE } : { ...ALL_FALSE };
      const updated = { ...current };
      for (const route of routes) {
        updated[route] = { ...flags };
      }
      state.pendingPermissions[roleId] = updated;
      state.dirtyRoles[roleId] = true;
    },

    /** Clear the dirty flag after a successful save (pending state stays for reference) */
    markSaved(state, action: PayloadAction<string>) {
      state.dirtyRoles[action.payload] = false;
    },

    /** Discard all pending edits for a role — next render falls back to server props */
    discardChanges(state, action: PayloadAction<string>) {
      delete state.pendingPermissions[action.payload];
      state.dirtyRoles[action.payload] = false;
    },

    startEditingRole(state, action: PayloadAction<string>) {
      state.editingRoleId = action.payload;
    },

    stopEditingRole(state) {
      state.editingRoleId = null;
    },
  },
});

export const {
  initPendingPermissions,
  toggleFlag,
  setGroupPermissions,
  markSaved,
  discardChanges,
  startEditingRole,
  stopEditingRole,
} = rolesSlice.actions;

export default rolesSlice.reducer;
