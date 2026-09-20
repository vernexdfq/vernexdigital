# Vernex Digital
## White-Label Customer Panel – Project Brief

**Document Version:** 1.1  
**Status:** Ready for Client Review & Acceptance  
**Date:** 20 September 2026  
**Prepared by:** Verxor Platform Team  
**Repository:** https://github.com/vernexdfq/vernexdigital

---

### 1. Project Overview

Vernex Digital is a professional, Nigeria-focused white-label customer panel built on the Verxor platform.

The panel allows the client’s end-users to purchase digital services through a prepaid wallet system. All retail pricing is controlled by the client (panel owner) through a dedicated Admin area. Payments are collected directly into the client’s own XixaPay account. Service fulfilment is handled securely through Verxor’s wholesale API.

**Public Brand Name:** Vernex Digital  
**Installed App / Short Name:** Vernex  
**Currency:** Nigerian Naira (₦) only

---

### 2. Design System (Mandatory)

| Element                    | Value                          |
|---------------------------|--------------------------------|
| Background (canvas)       | `#FFFFFF`                      |
| Cards / Containers        | `#F8FAFC` or `#F1F5F9`         |
| Primary Text & Headers    | `#0F172A`                      |
| Primary Action (Buttons)  | `#0284C7` (Secure Royal Blue)  |
| Success Accents           | `#16A34A`                      |
| Borders / Muted Text      | Soft slate tones (`#E2E8F0`, `#64748B`) |

**Design Rules**
- Straight edges only (maximum border-radius 10–12px)
- Dense, commercial spacing — no large empty “AI SaaS” gaps
- Fully mobile-first and professional on real phone screens
- No Verxor brand blue (`#2563EB`) used as primary colour

---

### 3. Navigation Structure

**Bottom Navigation (exactly 5 items)**  
`Home` · `Services` · `Fund` · `History` · `Profile`

---

### 4. Home Page Structure

1. Greeting + short subtitle (“Your Vernex Dashboard”)
2. Wallet Card (Available Balance in ₦, eye toggle, Fund Wallet + History buttons)
3. Quick Actions – exactly 8 tiles:

| # | Service              | Status          |
|---|----------------------|-----------------|
| 1 | Virtual Number       | Live            |
| 2 | Boost Account (SMM)  | Live            |
| 3 | Buy Logs             | Live            |
| 4 | Rent Number          | Live            |
| 5 | Data                 | Live            |
| 6 | Airtime              | Live            |
| 7 | Gift Card            | Coming Soon     |
| 8 | Lucky Draw           | Coming Soon     |

4. Recent Activity section with “View all”
5. Bottom navigation as defined above

---

### 5. Core Service Pages

#### 5.1 Virtual Number
Clean product listing with search and country/service filters. OTP-focused purchase flow.

#### 5.2 Boost Account (SMM)
Platform → Service → Link + Quantity → Order flow. Clean category organisation.

#### 5.3 Buy Logs / Accounts
Marketplace-style layout with platform filters, stock indicators, Instant badge, and clear pricing.

#### 5.4 Rent Number – Communication Hub
Information architecture inspired by proven rental products, polished for professional use:

- **My Numbers** – list of rented numbers + “+ Get a Number”
- **Make a Call** – select rented number → enter destination → show rate → Call
- **Messages** – inbox per number + ability to receive SMS
- **Call History** – per-number call log

**Get a Number flow:**
- Country selector
- Type selector: **VoIP** or **Non-VoIP**
- Price summary (driven by Admin + API)
- Search → Select → Pay from wallet

#### 5.5 Airtime
Network → Phone number → Amount → Confirm → Wallet debit

#### 5.6 Data
Network → Plan list → Phone number → Confirm → Wallet debit

#### 5.7 Gift Card & Lucky Draw
Real routes with clean “Coming Soon” empty states.

---

### 6. Supporting Pages

- **Fund** – Amount entry → XixaPay (client’s keys) → Wallet credit
- **History** – Unified list of all orders and transactions
- **Profile** – Account details, security, support links, logout
- **Landing Page** – Professional public marketing page with Login / Register CTAs
- **Admin Entry** – Small “Admin” link in landing footer only (separate from user authentication)

---

### 7. Payment Gateway (Customer Choice)

**Primary Gateway:** XixaPay  
Website: [https://www.xixapay.com](https://www.xixapay.com)  
Documentation: [https://documentation.xixapay.com](https://documentation.xixapay.com)

**Rules:**
- The panel uses the **customer’s (panel owner’s) own XixaPay API keys**
- Keys are stored securely in Admin → Settings
- Platform (Verxor) keys are **never** hard-coded in this application
- Fund Wallet flow:
  1. User enters amount
  2. Panel initializes payment via XixaPay using the client’s keys
  3. Customer completes payment on XixaPay
  4. Webhook confirms successful payment
  5. NGN wallet is credited
- Settlement, transaction fees, and payment support are the sole responsibility of the panel owner with XixaPay

---

### 8. Admin Panel (Client / Panel Owner Only)

Accessible exclusively via the footer “Admin” link on the landing page.

**MVP Features:**
- Secure login
- Dashboard overview
- Pricing management (set retail prices / markups for all live services)
- Orders list
- Panel wallet / settlement view with platform
- Settings: display name, support contacts (WhatsApp / Telegram), **XixaPay public & secret keys**
- Light user list

All end-user prices are controlled by the Admin settings + Verxor wholesale API. No hard-coded retail prices.

---

### 9. Technical Architecture Notes

- Frontend: Modern React / Next.js (App Router) + TypeScript + Tailwind CSS
- Prepaid wallet model
- No upstream provider API keys stored in this repository
- Clear separation between client panel and Verxor wholesale API
- Mock data permitted in early phases; clear boundaries prepared for live integration
- Mobile-first with responsive desktop support

---

### 10. Build Phases

| Phase | Scope                                      |
|-------|--------------------------------------------|
| 1     | Design tokens, app shell, routing, Landing, Login/Register placeholders, Home with wallet + 8 actions |
| 2     | All core service pages (UI complete)       |
| 3     | Admin panel (login, pricing, orders, settings) |
| 4     | Empty states, loading/error handling, mobile polish |

---

### 11. Explicitly Out of Scope

- Flight booking
- Gaming top-up
- Affiliate / referral website system
- Any service not listed above

---

### 12. Acceptance Criteria

The panel will be considered complete for client review when:

- Home page matches the agreed structure and 8 quick actions
- Rent Number hub follows the Communication Hub information architecture with VoIP / Non-VoIP types
- Colour palette matches the approved design system
- Bottom navigation contains exactly the five specified items
- Gift Card and Lucky Draw exist as proper “Coming Soon” pages
- Admin is accessible only from the landing page footer
- Payment gateway is XixaPay using the panel owner’s own API keys
- The application looks professional and commercial on real mobile devices

---

**Next Step**  
Please review this brief. Once accepted, development will begin with Phase 1.

For any required adjustments, kindly provide feedback before formal acceptance.

---

*This document represents the agreed scope between Verxor and the client for the Vernex Digital white-label panel.*
