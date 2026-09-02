import { authHandlers } from "./auth.handlers";
import { hotspotHandlers } from "./hotspot.handlers";
import { customerHandlers } from "./customer.handlers";
import { networkHandlers } from "./network.handlers";
import { sessionHandlers } from "./session.handlers";
import { financeHandlers } from "./finance.handlers";
import { ticketHandlers } from "./ticket.handlers";
import { packageHandlers } from "./packages.handlers";
import { systemSetupHandlers } from "./system-setup.handlers";
import { systemUserHandlers } from "./system-users.handlers";
import { statementHandlers } from "./statements.handlers";
import { notificationProviderHandlers } from "./notifications.handlers";
import {
  analyticsHandlers,
  auditHandlers,
  paymentHandlers,
  provisioningHandlers,
  networkDeviceHandlers,
  bootstrapHandlers,
} from "./platform.handlers";
import { networkRouterHandlers } from "./network-router.handlers";
import { geoHandlers } from "./geo.handlers";
import { pppoeHandlers } from "./pppoe.handlers";

export const handlers = [
  ...authHandlers,
  ...hotspotHandlers,
  ...customerHandlers,
  ...networkHandlers,
  ...sessionHandlers,
  ...financeHandlers,
  ...ticketHandlers,
  ...packageHandlers,
  ...systemSetupHandlers,
  ...systemUserHandlers,
  ...statementHandlers,
  ...notificationProviderHandlers,
  ...analyticsHandlers,
  ...auditHandlers,
  ...paymentHandlers,
  ...networkRouterHandlers,
  ...geoHandlers,
  ...provisioningHandlers,
  ...networkDeviceHandlers,
  ...bootstrapHandlers,
  ...pppoeHandlers,
];