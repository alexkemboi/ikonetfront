import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Roles slice — tracks in-progress permission edits.
 *
 * Data fetching (roles, users, menus) is handled via server props + Next.js
 * revalidation — NOT stored here.
 *
 * Redux is used here specifically to track:
 *   - Which permissions have been toggled but not yet saved (dirty state)
 *   - Which role name is currently being inline-edited
 *
 * This lets child components (e.g. a Save button in a toolbar) react to
 * unsaved changes without prop-drilling.
 */

type RolesState = {
  /**
   * Pending permission sets, keyed by roleId.
   * Only populated when a role's permissions are being edited.
   * Cleared after save or discard.
   */
  pendingPermissions: Record<string, string[]>;

  /** Tracks which roles have unsaved permission changes */
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
    /** Called when a role's permission panel is opened — seeds the pending state */
    initPendingPermissions(
      state,
      action: PayloadAction<{ roleId: string; permissions: string[] }>
    ) {
      const { roleId, permissions } = action.payload;
      if (!state.pendingPermissions[roleId]) {
        state.pendingPermissions[roleId] = [...permissions];
        state.dirtyRoles[roleId] = false;
      }
    },

    /** Toggle a single permission on/off for a role */
    togglePermission(
      state,
      action: PayloadAction<{ roleId: string; permissionId: string; checked: boolean }>
    ) {
      const { roleId, permissionId, checked } = action.payload;
      const current = state.pendingPermissions[roleId] ?? [];
      state.pendingPermissions[roleId] = checked
        ? [...new Set([...current, permissionId])]
        : current.filter((id) => id !== permissionId);
      state.dirtyRoles[roleId] = true;
    },

    /** Set an entire group of permissions at once (e.g. select-all for a menu group) */
    setGroupPermissions(
      state,
      action: PayloadAction<{ roleId: string; permissionIds: string[]; checked: boolean }>
    ) {
      const { roleId, permissionIds, checked } = action.payload;
      const current = new Set(state.pendingPermissions[roleId] ?? []);
      if (checked) {
        permissionIds.forEach((id) => current.add(id));
      } else {
        permissionIds.forEach((id) => current.delete(id));
      }
      state.pendingPermissions[roleId] = Array.from(current);
      state.dirtyRoles[roleId] = true;
    },

    /** Mark a role's permissions as saved (clears dirty flag) */
    markSaved(state, action: PayloadAction<string>) {
      state.dirtyRoles[action.payload] = false;
    },

    /** Discard pending changes for a role, reverting to the original props */
    discardChanges(state, action: PayloadAction<string>) {
      delete state.pendingPermissions[action.payload];
      state.dirtyRoles[action.payload] = false;
    },

    /** Enter inline-edit mode for a role name */
    startEditingRole(state, action: PayloadAction<string>) {
      state.editingRoleId = action.payload;
    },

    /** Exit inline-edit mode */
    stopEditingRole(state) {
      state.editingRoleId = null;
    },
  },
});

export const {
  initPendingPermissions,
  togglePermission,
  setGroupPermissions,
  markSaved,
  discardChanges,
  startEditingRole,
  stopEditingRole,
} = rolesSlice.actions;

export default rolesSlice.reducer;
