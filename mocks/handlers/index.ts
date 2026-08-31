import { authHandlers } from "./auth.handlers";
import { hotspotHandlers } from "./hotspot.handlers";
import { customerHandlers } from "./customer.handlers";
import { networkHandlers } from "./network.handlers";
import { sessionHandlers } from "./session.handlers";
import { financeHandlers } from "./finance.handlers";

export const handlers = [
  ...authHandlers,
  ...hotspotHandlers,
  ...customerHandlers,
  ...networkHandlers,
  ...sessionHandlers,
  ...financeHandlers,
];