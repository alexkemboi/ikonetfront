import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** Network-level mock server driven entirely by contracts/catalog.ts fixtures. */
export const server = setupServer(...handlers);