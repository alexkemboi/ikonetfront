# Pages Guide — Feynman Technique Explanations

Explain each page as if to a smart non-technical person, then explain the business impact.

---

## 1. Customer IP Mapping (`/network/ip-mapping`)

### What is it?

Imagine every house in a neighbourhood has a door number. On the internet, every device that connects gets an "IP address" — a unique number that tells the network where to send data. This page is the list that shows: **which customer owns which IP address, and which router gave it to them.**

When a customer calls saying "my internet is not working", instead of guessing, a technician can search this page by name or IP and see instantly: James Kamau → 192.168.10.5 → RTR-WESTLANDS. No more digging through spreadsheets.

It also shows the **IP pool** for each router — a bar that fills up as more customers are assigned IPs. When a pool is nearly full, the team knows to either add a new IP range or deploy another router before customers start getting connection failures.

### How it helps the business

- **Faster fault resolution**: Support staff resolve complaints in seconds instead of minutes by tracing customer → IP → router in one view.
- **Prevents IP conflicts**: Two customers cannot accidentally be given the same IP because the mapping is tracked centrally.
- **Capacity planning**: When a pool hits 80%+ utilisation, the network team gets an early signal to expand — preventing service degradation before it happens.
- **Reduces customer churn**: Faster issue resolution = happier customers = lower churn.

---

## 2. Router Devices (`/network/routers`)

### What is it?

Think of a router like a post office sorting room. Every letter (data packet) from every customer in an area passes through it before reaching its destination. If that sorting room overheats or runs out of space, every customer in the area loses their internet.

This page is a **live health dashboard** for all the company's routers. It shows each device as a card that displays:
- Whether the router is **online, struggling (warning), or offline**
- How hard the **CPU is working** (high means it may slow down soon)
- How much **memory (RAM)** is in use
- How many **customers are actively connected** vs. the maximum the device can handle

Routers are grouped by region (Nairobi West, East, etc.) so the team can immediately see if a whole area has a problem.

### How it helps the business

- **Proactive monitoring**: A router at 90% CPU is a warning sign — the team can act before it crashes and takes 200 customers offline.
- **Reduces downtime**: Offline routers are spotted instantly, not when angry customers start calling.
- **Right-sizing investments**: Knowing which routers are near capacity tells management exactly where to spend on new hardware.
- **SLA compliance**: ISPs often have uptime guarantees. This page is the first line of defence for maintaining them.

---

## 3. Bulk Email (`/communications/bulk-email`)

### What is it?

Imagine a customer's internet subscription expires tomorrow. Without a reminder, they go offline — then they're annoyed, they call support, maybe they switch to a competitor. Now imagine sending every expiring customer a personalised reminder email automatically. That is what this page does.

The Bulk Email page is a **4-step campaign wizard**:
1. **Pick your audience** — choose who gets the email: all customers, only PPPoE subscribers, only hotspot users, people whose accounts have expired, or people expiring within 7 days.
2. **Write the message** — start from a pre-built template (renewal reminder, promo offer, maintenance notice) or write from scratch. Variables like `{{customer_name}}` are swapped for each person's real name before sending.
3. **Preview the email** — see exactly how it will look in a recipient's inbox before anything is sent.
4. **Confirm and send** — review the final recipient count and hit send.

### How it helps the business

- **Reduces churn from expiry**: A timely renewal reminder is the single cheapest way to retain a customer.
- **Drives upsell revenue**: A promo email to customers on the basic plan ("upgrade for 50% off this month") converts passive customers into higher-paying ones.
- **Professionalises communications**: Branded, personalised emails build trust vs. generic SMS blasts.
- **Saves staff time**: One staff member sends to 1,800 customers in the same time it would take to send 5 individual emails.
- **Reduces support calls**: Maintenance notice emails prevent customers from calling support during outages because they already know what is happening.
