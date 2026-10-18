/**
 * Plain-language explanations for the customer network health screens: what each figure and
 * status means, why it matters, and what to do. Written for network managers and the customer
 * care desk, not engineers. Shown by the "?" next to each heading and in "How to read this".
 */
export interface HelpEntry {
  title: string;
  /** What it is, in one or two sentences. */
  means: string;
  /** Why anyone should care. */
  why?: string;
  /** What to do when it is not as it should be. */
  todo?: string;
}

export const NETWORK_HEALTH_HELP = {
  customerSignIn: {
    title: "Customer sign-in",
    means:
      "Whether the router can check customers' payments with our sign-in server (RADIUS). Every time a customer pays " +
      "or reconnects, the router asks the server \"has this person paid?\" and waits for an answer.",
    why: "If the server does not answer, nobody at that site gets online, even after paying, while the router still looks online.",
    todo:
      "Working: nothing to do. Not working: open the router and run Reprovision Router (it gives the router the current " +
      "RADIUS password). If it stays Not working, the router cannot reach the server: check its connection.",
  },
  signInWorking: {
    title: "Sign-in: Working",
    means: "The server answered this router's sign-in requests in the last 10 minutes. An answer of \"no\" (wrong voucher, unpaid) still counts: it means the line works.",
  },
  signInNotWorking: {
    title: "Sign-in: Not working",
    means: "Requests from this router went unanswered and not one was answered in the last 10 minutes. Customers who pay here are not connected.",
    todo: "Run Reprovision Router. Their payments are recorded; they connect by themselves once sign-in works, or can be given a voucher.",
  },
  signInNoAttempts: {
    title: "Sign-in: No one tried lately",
    means: "Nobody tried to sign in at this router in the last 10 minutes, so there is nothing to judge. Normal at night or at a quiet site.",
  },
  signInNotSetUp: {
    title: "Sign-in: Not set up",
    means: "The router's hotspot has no sign-in server set at all, so it can never sign a customer in.",
    todo: "Run Reprovision Router, or link the router again with the ZTP command.",
  },
  signInUnknown: {
    title: "Sign-in: Not known yet",
    means: "The system has not read this router twice yet (it needs two readings about 10 minutes apart), or could not read its counters.",
  },
  radiusPassword: {
    title: "RADIUS password",
    means:
      "The password the router uses to talk to the sign-in server. All routers share one, and it is changed only when it may have leaked.",
    why: "A router that still holds an old password is refused on every sign-in: customers pay and never get online, while the router looks healthy.",
    todo: "Out of date or Not recorded: run Reprovision Router on it (or \"Reprovision every out-of-date router\" for all at once).",
  },
  passwordCurrent: { title: "RADIUS password: Current", means: "The router was given the password the server uses now." },
  passwordOutOfDate: {
    title: "RADIUS password: Out of date",
    means: "The router was given a password the server no longer uses. Every sign-in from it is refused.",
    todo: "Run Reprovision Router on it now.",
  },
  passwordUnknown: {
    title: "RADIUS password: Not recorded",
    means:
      "The system does not know which password this router holds: it was set up before this was recorded, and has not been reprovisioned since. It may be fine.",
    todo: "Run Reprovision Router once so it is recorded. If its sign-in shows Working, there is no hurry.",
  },
  customerDevices: {
    title: "Customer devices",
    means: "Phones, laptops and other customer devices the router can see on the hotspot right now, paid or not. Access points are not counted.",
    why: "A sudden drop at a busy hour can mean customers lost the Wi-Fi (power cut, cut cable, an access point down).",
  },
  wrongAddress: {
    title: "Customers on a wrong address",
    means:
      "Customer devices holding an internet address the router did not give them. Usually they got it from a device on the network that " +
      "hands out addresses when it should not (see Unauthorised DHCP servers).",
    why: "These customers see the Wi-Fi as connected but cannot open the payment page or the internet.",
    todo: "Should be 0. If not, fix the devices listed as handing out addresses on the router's Customer network tab.",
  },
  rogueDhcp: {
    title: "Unauthorised DHCP servers",
    means:
      "DHCP is how a phone gets its internet address when it joins the Wi-Fi. Only the router may hand them out. An unauthorised DHCP " +
      "server is another device on the customer network doing it too, almost always an access point (a Tenda) left in its factory " +
      "\"router\" setting.",
    why:
      "A customer who takes an address from one of them is cut off from the router: no payment page, no internet. While no customer " +
      "holds one of their addresses it is a risk, not an outage.",
    todo:
      "On each listed device: open its settings, switch its DHCP server off, or set it to access point (AP) mode. The mark clears about " +
      "20 minutes after the device stops.",
  },
  accessPoints: {
    title: "Access points",
    means:
      "The Wi-Fi boxes behind the router, found by the router itself. A box has several addresses (cable ports, Wi-Fi radios); they " +
      "are counted once. Customers' own routers are not listed.",
    todo: "Give each one a name or place so it can be found. Stop watching any listed device that is not one of your access points.",
  },
  apSeen: { title: "Access point: Seen", means: "The router heard from it within the last 15 minutes." },
  apNotSeen: {
    title: "Access point: Not seen",
    means: "The router has heard nothing from it for over 15 minutes. It may be switched off, unplugged, or just quiet.",
    todo: "If customers near it complain, check its power and cable. Not proof that it is down.",
  },
  apIgnored: { title: "Access point: Not watched", means: "Someone (or the system, for a customer's own router) marked it as not to be watched. It is not counted." },
  statusHealthy: { title: "Healthy", means: "Sign-in works and nothing on the customer network needs attention." },
  statusAttention: { title: "Needs attention", means: "At least one figure on the row is not as it should be. The coloured figure says which." },
  statusUnknown: {
    title: "Could not be read",
    means: "The system could not read the router lately (it may be offline). The figures shown are old, not zero.",
  },
} satisfies Record<string, HelpEntry>;

export type HelpKey = keyof typeof NETWORK_HEALTH_HELP;

/** What each colour means on these screens. */
export const COLOUR_LEGEND: { colour: "green" | "red" | "amber" | "grey"; label: string; means: string }[] = [
  { colour: "green", label: "Green", means: "Working as it should." },
  { colour: "red", label: "Red", means: "Customers are affected now: they cannot sign in or cannot reach the internet. Act now." },
  { colour: "amber", label: "Amber", means: "A risk or something to check; no customer is known to be affected yet. Fix when convenient." },
  { colour: "grey", label: "Grey", means: "Nothing to judge: no data, nobody tried, or not watched." },
];
