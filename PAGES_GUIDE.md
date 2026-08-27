# Pages Guide — Feynman Technique Explanations

Explain each page as if to a smart non-technical person, then explain the business impact.

> **Route paths verified against the codebase (2026-08-26).** One correction: the IP-mapping page lives at **`/customers/bindings`**, not `/network/ip-mapping`.

---

## Customers

### 1. Customers Directory (`/customers/all`)

#### What is it?

Think of a paper address book for the ISP, but digital and searchable. Every person or company subscribed to internet appears here as a row. A staff member can type part of a name or a phone number and instantly find the full record — contact details, package, and account status — without flipping through files.

#### How it helps the business

- **Faster service**: A caller's details are found in seconds, shortening every support call.
- **Single source of truth**: No duplicated or out-of-date client records across spreadsheets.
- **Enables follow-up**: Teams can see who is active, inactive, or overdue at a glance.

---

### 2. Subscribers Hub (`/customers`)

- **What is it?** The one-stop control room for the whole client base. It shows headline numbers — total clients, active vs inactive, new sign-ups — beside a live list of subscribers, with quick actions like compensating clients during an outage. It is like a pilot's cockpit instrument panel for the customer book.
- **How it helps the business**
  - Gives management an instant pulse on growth and churn without opening spreadsheets.
  - Lets staff act immediately (e.g. compensation) instead of collecting data first.
  - Centralises day-to-day subscriber operations in one screen.

---

### 3. New Customer Wizard (`/customers/new`)

- **What is it?** A guided form that collects a new client's details in small, friendly steps rather than one daunting page. Just like a bank registering an account over several screens, it breaks the paperwork into manageable questions.
- **How it helps the business**
  - Reduced data-entry errors through a structured flow.
  - Faster onboarding — a new customer is live sooner.
  - Every required detail is captured up front, so support isn't chasing it later.

---

### 4. Customer Profile (`/customers/[id]`)

- **What is it?** One client's individual file. It holds their contact details and their PPPoE/hotspot credentials — the "username and password" the router uses to admit them onto the network. It is like an employee's personnel file.
- **How it helps the business**
  - Lets technicians reset a password or diagnose connection issues from one place.
  - At-a-glance renewal and service state for targeted outreach.
  - Avoids digging through multiple systems to understand a single account.

---

### 5. Support Tickets (`/customers/tickets`)

- **What is it?** A shared mailbox for customer issues. Each complaint is a ticket that can be created, tracked, and marked resolved. It is like a to-do list for the support team so nothing slips through unnoticed.
- **How it helps the business**
  - Prevents complaints from being forgotten or duplicated.
  - Shines a light on repeated problems (e.g. one area losing connection).
  - Builds a paper trail that can expose recurring faults.

---

### 6. Customer IP Mapping (`/customers/bindings`)

### What is it?

Imagine every house in a neighbourhood has a door number. On the internet, every device that connects gets an "IP address" — a unique number that tells the network where to send data. This page is the list that shows: **which customer owns which IP address, and which router gave it to them.**

When a customer calls saying "my internet is not working", instead of guessing, a technician can search this page by name or IP and see instantly: James Kamau → 192.168.10.5 → RTR-WESTLANDS. No more digging through spreadsheets.

It also shows the **IP pool** for each router — a bar that fills up as more customers are assigned IPs. When a pool is nearly full, the team knows to either add a new IP range or deploy another router before customers start getting connection failures.

> **Path note:** the page lives at **`/customers/bindings`** (previously referenced as `/network/ip-mapping`).

### How it helps the business

- **Faster fault resolution**: Support staff resolve complaints in seconds instead of minutes by tracing customer → IP → router in one view.
- **Prevents IP conflicts**: Two customers cannot accidentally be given the same IP because the mapping is tracked centrally.
- **Capacity planning**: When a pool hits 80%+ utilisation, the network team gets an early signal to expand — preventing service degradation before it happens.
- **Reduces customer churn**: Faster issue resolution = happier customers = lower churn.

---

## Network

### 7. Regions (`/network/regions`)

- **What is it?** The highest-level way to slice the network map — e.g. "Nairobi West", "Nairobi East". A way to organise coverage into big geographic buckets.
- **How it helps the business**
  - Makes reporting and fault analysis meaningful by area.
  - Lets management target investment and marketing by region.

---

### 8. Locations (`/network/locations`)

- **What is it?** One level below regions — concrete places within a region where infrastructure sits. It is the middle of the map: region covers location, and location covers stations/POPs.
- **How it helps the business**
  - Localises fault-finding ("the whole of gatewaymall is down").
  - Groups costs and capacity decisions at a practical level.

---

### 9. Stations / POPs (`/network/stations`)

- **What is it?** The physical "points of presence" — the local buildings housing the gear that actually serves a neighbourhood. This page manages those nodes and how loaded they are.
- **How it helps the business**
  - Shows at a glance which node is near capacity.
  - Funnels capacity planning down to the exact equipment that needs attention.

---

### 10. Router Devices (`/network/routers`)

### What is it?

Think of a router like a post office sorting room. Every letter (data packet) from every customer in an area passes through it before reaching its destination. If that sorting room overheats or runs out of space, every customer in the area loses their internet.

This page is a **live health dashboard** for all the company's routers. It shows each device as a card that displays:
- Whether the router is **online, struggling (warning), or offline**
- How hard the **CPU is working** (high means it may slow down soon)
- How much **memory (RAM)** is in use
- How many **customers are actively connected** vs. the maximum the device can handle

Routers are grouped by region so the team can immediately see if a whole area has a problem.

### How it helps the business

- **Proactive monitoring**: A router at 90% CPU gives the team a warning sign to act before it crashes and takes 200 customers offline.
- **Reduces downtime**: Offline routers are spotted instantly, not when angry customers start calling.
- **Right-sizing investments**: Knowing which routers are near capacity tells management where to spend on new hardware.
- **SLA compliance**: ISPs often have uptime guarantees — this is the first line of defence for maintaining them.

---

### 11. Link a Router (`/network/routers/setup`)

- **What is it?** The step-by-step "wiring" screen to connect a router device to the system. It walks a technician through linking the hardware so the system can see and manage it.
- **How it helps the business**
  - Standard hygiene and speed in adding new equipment to the estate.
  - New routers become visible and monitored as soon as possible.

---

### 12. Router Monitoring (`/network/routers/[id]/monitoring`)

- **What is it?** A zoomed-in view of a single router — graphs of its load, throughput and health over time. Like a bedside monitor for one patient instead of a whole ward.
- **How it helps the business**
  - Detailed diagnosis of a specific slow/failing device.
  - Confirms whether a "fix" actually held afterwards.

---

### 13. Equipment (`/network/equipment`)

- **What is it?** An inventory of physical network gear beyond the edge routers — switches, radios, CPEs, and so on — with status and type. Like an asset register for the network department.
- **How it helps the business**
  - Avoids equipment being lost, forgotten, or over‑ordered.
  - Enables asset tracking and maintenance planning.

---

### 14. Live Sessions (`/network/live-sessions`)

- **What is it?** A running list of who is on the network right now — active PPPoE logins, how long they've been on, data used. Like a live counter of customers currently on the connection.
- **How it helps the business**
  - Immediate picture of concurrent use for capacity planning.
  - Helps spot anomalies (many registered with no usage, unexpected device types).
  - Supports security and fair‑use checks.

---

## Finance

### 15. Executive Dashboard (`/finance`)

- **What is it?** A one-screen summary of money: revenue, collections, outstanding debts, and expenses — rolled up into headline numbers from the general ledger. The "big picture" of the business' financial health.
- **How it helps the business**
  - Management sees the fuel level of the business without waiting for a monthly report.
  - Flags collection gaps and cash-position trends early.

---

### 16. Invoices (`/finance/billing/invoices`)

- **What is it?** The list of the bills each customer has been sent. Like a cash-register drawer where every issued receipt is filed.
- **How it helps the business**
  - Removes the guesswork about who has been billed and who hasn't.
  - Supports and accelerates collections when a customer is called.

---

### 17. Payments (`/finance/billing/payments`)

- **What is it?** The record of money actually coming in — mobile money, vouchers, manual — with date, amount, and payer, alongside the invoices they settle.
- **How it helps the business**
  - Reconciles cash-in against invoices, catching missing collections.
  - Confirms which customers are current for credit decisions.

---

### 18. Vouchers (`/finance/vouchers`)

- **What is it?** A mint and ledger for pre-paid access codes. The system yields new voucher numbers ("scratch cards"), each granting a connection time and amount, and lists all that have been printed or used.
- **How it helps the business**
  - Creates a fast way to pre-sell internet through local resellers.
  - Prevents and detects voucher duplication or fraud.

---

### 19. Chart of Accounts / Ledger (`/finance/ledger`)

- **What is it?** The proper bookkeeping log of every financial movement — money in, money out — organized by standard accounting categories. The accounting backbone the rest of finance draws from.
- **How it helps the business**
  - Lets finance balance the books at turbo speed.
  - Produces tax- and auditor-grade numbers.

---

### 20. Expenses (`/finance/expenses`)

- **What is it?** The register of what the organisation spends — bandwidth, rent, salaries, equipment — itemised. The "money out" half of the ledger.
- **How it helps the business**
  - Budget check: are we spending more than we earn?
  - Highlights cost centres that need reining in.

---

## Insights

### 21. Analytics (`/analytics`)

- **What is it?** A data-analysis view that answers "is our business actually in shape?" — revenue by product, performance trends (payments vs expenses, router load), top-performing areas and equipment, all in charts.
- **How it helps the business**
  - Turns raw signups and payments into "what to do next".
  - Highlights which investments are paying off and which are not.
  - Supports evidence‑based pricing and rescue planning.

---

## Portal

### 22. PPPoE Portal (`/portal/pppoe`)

- **What is it?** A dedicated screen for handling PPPoE login customers — the approach for many small/home connections. Staff view and act on these accounts specifically.
- **How it helps the business**
  - Focused handling of the most common connection type.
  - Faster credential and connection troubleshooting.

---

## Communications

### 23. Bulk Email (`/communications/bulk-email`)

### What is it?

Imagine a customer's internet subscription expires tomorrow. Without a reminder, they go offline — then they're annoyed, they call support, maybe they switch to a competitor. Now imagine sending every expiring customer a personalised reminder email automatically. That is what this page does.

The Bulk Email page is a **campaign wizard**:
1. **Pick your audience** — choose who gets the email: all customers, only PPPoE subscribers, account types, people whose accounts expired, or those expiring soon.
2. **Write the message** — start from a pre-built template (renewal reminder, promo offer, maintenance notice) or write your own. Variables like `{{customer_name}}` are swapped for each person's real name before sending.
3. **Preview the email** — see exactly how it will look in a recipient's inbox before anything is sent.
4. **Confirm and send** — review the final recipient count and hit send.

### How it helps the business

- **Reduces churn from expiry**: A timely renewal reminder is the single cheapest way to retain a customer.
- **Drives upsell revenue**: A promo email to customers on the basic plan ("upgrade — half‑price this month") converts passive customers into higher‑paying ones.
- **Professionalises communications**: Branded, personalised emails build trust vs. generic SMS blasts.
- **Saves staff time**: One person sends to hundreds of customers in the time it would take to send messages individually.
- **Reduces support calls**: Maintenance‑notice emails prevent customers from calling during outages because they already know what's happening.

---

## Settings & System

### 24. Alert Channels (`/settings/alerts`)

- **What is it?** The toll-free contact list for the network's early-warning system. You pick where alerts should go — email, phone, messaging — when something breaks, like leaving the number for the air‑alarm to notify.
- **How it helps the business**
  - Outages are actioned by the right person, not found by chance.
  - Cut MTTR by routing alarms to the on‑call team instantly.

---

### 25. System Users (`/system/users`)

- **What is it?** The list of people allowed to log into the system and their role in the company.
- **How it helps the business**
  - Every action a person takes can be tied to a specific account.
  - Controls who can access sensitive financial/network tools.

---

### 26. Access Control (`/system/access`)

- **What is it?** The "permissions & roles" engine. It defines who can view, create, edit, or delete on each page and which menus each role sees.
- **How it helps the business**
  - Implements least‑privilege — no one has more power than their job needs.
  - Separates daily finance from network admin, reducing risk and fraud.

---

### 27. Packages (`/system/packages`)

- **What is it?** The catalogue of internet offers — different speeds, durations, and prices — that customers can choose from. The pricing menu of the business.
- **How it helps the business**
  - Launch or retire products without code changes.
  - Ties every customer to a specific package for consistent billing.

---

### 28. Audit Logs (`/system/audit`)

- **What is it?** The black box / flight recorder of the system — a dated record of who did what, where and when. Immutable history of actions.
- **How it helps the business**
  - Detects and deters misuse and fraud.
  - Supports compliance and dispute‑resolution ("who changed this?").

---

## Hotspot

### 29. Public Hotspot (`/hotspot`)

- **What is it?** A public web page where anyone can buy and activate a pre-paid internet session — e.g. a café or a hotel guest paying for time. No staff required.
- **How it helps the business**
  - Turns hotspots into self‑service revenue that runs 24/7.
  - Handles casual, walk‑in users without creating full accounts.

---

## Authentication (brief)

### 30. Login (`/login`)

- **What is it?** The door into the whole system — where a user proves who they are with a username and password.
- **How it helps the business** — keeps customer and network data internal and secure; every session is accountable.

### 31. Sign Out (`/signout`)

- **What is it?** The clean exit that closes the session.
- **How it helps the business** — prevents idle terminals left logged in and unsafe data.

### 32. Forgot / Reset Password (`/forgot-password`, `/reset-password`)

- **What is it?** The self-service "lost keys" flow. A user requests a reset and confirms with a one-time code to pick a new password.
- **How it helps the business** — minimises helpdesk tickets for locked-out staff while keeping account recovery safe.