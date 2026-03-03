/** Raw role shape returned by the API */
export type ApiRole = {
  idxno: number;
  roleCode: string;
  name: string;
  description: string;
  createdAt: string | null;
};

/**
 * Shape of each menu/permission entry from the menus endpoint.
 * Extend specific fields once real API data is confirmed (endpoint currently returns []).
 */
export type RoleMenu = {
  menuCode?: string;
  menuId?: string;
  name?: string;
  [key: string]: unknown;
};

export type AddRolePayload = {
  roleCode: string;
  name: string;
  description: string;
};
