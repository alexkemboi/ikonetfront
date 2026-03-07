/** Menu/permission item returned by the /{roleCode}/menus endpoint */
export type ApiMenuItem = {
  /** Database primary key — required for POST /menus assignment calls */
  menuItemId: number;
  label: string;
  route: string;
  /** Material Design icon name — mapped to Lucide in the Sidebar's ICON_MAP */
  icon: string;
  sortOrder: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  children: ApiMenuItem[];
};

/** Payload sent to POST /{roleCode}/menus for each menu item */
export type MenuAssignment = {
  menuItemId: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

/** User returned by GET /{roleCode}/users */
export type ApiRoleUser = {
  idxno: number;
  username: string;
  userId: string;
  role: string;
  createdAt: string;
  isActive: boolean;
  fname: string;
  middleName: string;
  otherName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  canLogin: boolean;
};

/** Raw role shape returned by the API */
export type ApiRole = {
  idxno: number;
  roleCode: string;
  name: string;
  description: string;
  createdAt: string | null;
};


export type AddRolePayload = {
  roleCode: string;
  name: string;
  description: string;
};
