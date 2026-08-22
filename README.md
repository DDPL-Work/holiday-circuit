# Holiday Circuit

## Product overview

Holiday Circuit is a role-based travel operations platform that manages a trip from an agent's initial enquiry through quotation, payment, supplier fulfilment, and voucher delivery. It connects travel agents, operations, DMC/supplier partners, finance, managers, and administrators in one workflow.

This is an **implemented-feature inventory** derived from the client routes, server routes, controllers, models, and services in this repository. It describes current code for Scope of Work (SOW) comparison; it does not represent a future roadmap.

## Business lifecycle

```text
Agent registration → Admin approval → Travel query → Operations acceptance
→ Quote drafting/customisation → Quote sent → Agent review / revision / acceptance
→ Invoice + payment proof → Finance verification → DMC fulfilment + invoice
→ Voucher generation → Voucher sent → Settlement, reporting, and audit
```

## Roles and workspaces

| Role | Workspace | Implemented responsibilities |
| --- | --- | --- |
| Agent | Agent Dashboard, Queries, Booking Payments | Creates/tracks queries, manages traveller documents and tasks, reviews quotes, pays invoices, receives vouchers/notifications. |
| Admin | Admin and Super Admin dashboards | Approves agents, manages staff, coupons, rate contracts, payment verification, finance analytics, DMC invoices, and oversight. |
| Operations | Ops Dashboard and Booking Management | Accepts/rejects queries, reviews documents, drafts/prices/sends quotations, produces invoices, generates/sends vouchers. |
| Operation Manager | Operations Manager workspace | Reviews team workload, creates team members, previews/reassigns work, updates queries, reviews activity, submits reports. |
| DMC Partner | DMC Dashboard, Contracted Rates, Confirmation, Settlement | Manages travel inventory, uploads rates, confirms services, submits supplier invoices, tracks ledger/settlements. |
| Finance Partner | Finance Dashboard | Reviews payment proofs, dispatches finance documents, handles internal DMC invoices and analytics. |
| Finance Manager | Finance Manager workspace | Manages finance team/vendors; reviews team transactions, analytics, and DMC invoice activity. |

Supported roles: `admin`, `agent`, `operations`, `dmc_partner`, `finance_partner`, `operation_manager`, and `finance_manager`.

## Complete feature inventory

### Identity, access, and account governance

- Agent registration with company, GST number, phone, password, and up to five supporting documents.
- Agent approval lifecycle: `pending`, `approve`, `rejected`; includes reviewer/date/rejection reason.
- Login, JWT bearer authentication, current-user lookup, profile update, and user heartbeat.
- Password recovery: send OTP, verify OTP, reset password.
- Role-aware client route protection and role-specific navigation.
- Managed-user administration: create, update, activate/deactivate, soft-delete, restore, and permanently delete team accounts.
- Governance fields for employee ID, manager, department, designation, granular permissions, account status, access expiry, last login/activity, and deletion audit data.
- Agent branding fields for profile/cover images, brand name/logo, and voucher footer image.
- Permission-based discount access for eligible managers.

### Travel enquiries, travellers, and CRM

- Agent creates travel queries with destination, domestic/international classification, group/customised tour type, dates, adult/child counts, client email, budget, hotel category, transfer/sightseeing request flags, and special requirements.
- Traveller records support adult/child type, child age, document type, passport/government ID files, and uploaded-file metadata.
- Agent can update their query while it remains actionable.
- Query identifiers, operations assignment, activity log, reassignment history, and operations/admin coordination message thread.
- Agent query list, active-booking list, dashboard KPIs, hotel-rate destination lookup, and finance overview.
- Per-query task management: create, list, resolve, delete, due-today view, and reminder dismissal.
- Status models:
  - Agent: `Pending`, `In Progress`, `Quote Sent`, `Client Approved`, `Confirmed`, `Rejected`, `Revision Requested`
  - Operations: `New_Query`, `Pending_Accept`, `Revision_Query`, `Rejected`, `Booking_Accepted`, `Invoice_Requested`, `Confirmed`, `Vouchered`, `Payment_Completed`
  - Quotation: `Awaiting_Decision`, `Quotation_Created`, `Sent_To_Agent`

### Traveller-document verification

- Upload/replace and remove traveller documents.
- Submit all traveller documents for review.
- Operations review captures document-level verified/failed issues, rejection reason/remarks, reviewer, and time.
- Document status lifecycle: `Draft`, `Pending`, `Verified`, `Rejected`.
- Audit trail records document action, status, actor, remarks, and timestamp.

### Operations workflow, coordination, and escalation

- Operations dashboard, all-query view, and order-acceptance queue.
- Accept/reject enquiries, update operational state, start quotation work, and review traveller documents.
- Pass a query to admin for intervention; admin replies within the coordination thread and resolves override cases.
- Operations/manager activity logs, assignment history, and overdue-reminder widgets/modals.
- Operations manager workload preview and reassignment, including source/target/actor/timestamp history.

### Quotation, package, and pricing

- Create, retrieve, and save a quotation draft per query.
- Create, send, revise, and retrieve quotations for agent, operations, and manager views.
- Add/remove quotation services and quotation items.
- Quoted service types: **hotel, transfer, activity, sightseeing**.
- Quote content supports supplier/DMC details, location, service date, rooms/nights/pax, room/bed configuration, vehicle/capacity/usage, activity/sightseeing details, inclusions, exclusions, additional notes, validity, and day-wise itinerary.
- Search DMC inventory during quotation creation.
- Agent quote actions: view, download client PDF, view email preview, request revision, accept, confirm, update quote branding, and send voucher email.
- Client quotation delivery: quotation email/PDF generation and WhatsApp integration when Twilio is configured.
- Package templates can be created, listed, and deleted.
- Agent-side package customiser supports hotels, transfers, activities, sightseeing, service exclusions, custom add-ons, quantity/pax/room/night changes, rates, itinerary, and package/agent markup.
- Invoice-ready pricing snapshot preserves service totals, package amount, operations markup, agent markup (percentage/fixed), service/handling fees, GST, TCS, tourism tax, currency, and grand total.

### DMC inventory, contracted rates, and bulk upload

- DMC hotel CRUD: create, list, retrieve by ID, update, delete.
- DMC activity, transfer, sightseeing, and package creation/listing; package deletion.
- Contracted Rates UI for supplier inventory.
- Inventory captures applicable supplier/DMC, destination, hotel/room/meal details, validity, vehicle/capacity, route/usage/rates, operating time/slots, and adult/child pricing.
- Bulk uploads for hotel, transport/transfer, activity, sightseeing, and package records.
- Upload history: view data, download, delete, edit a spreadsheet row, and notify after edits.
- XLSX/Excel processing and normalisation services for hotel, transport, activity, sightseeing, and package data.

### Invoicing, coupons, and agent payments

- Invoice generation from a confirmed/relevant quotation/query, with immutable line-item, pricing, and trip snapshots.
- Agent can ensure an active-booking invoice exists, list invoices, and review finance overview.
- Invoice line items carry service type/location/date, quantity/pax/rooms/nights, currency, unit price, total, and notes.
- Coupon workflow: generate code, create, update, delete, distribute to agent, list agent coupons, mark coupon notifications read, and apply a coupon to an invoice.
- Coupon application stores code, percentage/flat configuration, discount, subtotal, payable amount, and audit actor/time.
- Agent payment proof includes amount, payer/on-behalf-of, UTR, bank, date, receipt, and tracker/instalment payments.
- Invoice payment states: `Pending`, `Partially Paid`, `Paid`, `Unpaid`.
- Finance verification states: `Pending`, `Verified`, `Rejected`.
- Verification supports finance assignment, team decision, admin escalation, rejection reason/remarks, audit trail, individual instalment verification, and final invoice/payment-receipt dispatch.
- Agent finance payment-receipt generation and final invoice/receipt email sending.

### DMC confirmation, invoices, payout, and settlement

- DMC can view confirmed queries ready for fulfilment.
- DMC submits/updates service confirmations with supplier-confirmation, voucher-reference, and terms/conditions attachments.
- DMC submits internal supplier invoices and previews extracted values from uploaded invoices.
- Admin can parse a manually uploaded invoice and create manual bulk internal invoices.
- OCR/PDF/document extraction capability is implemented through `tesseract.js`, `pdf-parse`, `mammoth`, and `sharp` services.
- Internal invoices store query/agent/DMC/supplier data, invoice/due dates, 7- or 15-day credit period, items, documents, source, claimed summary, taxes, extracted data, finance assignment, and review metadata.
- Internal invoice and settlement states: `Submitted`, `In Review`, `Approved`, `Rejected`, `Partially Paid`, `Paid`.
- DMC payment ledger, supplier-payment recording, and settlement batches.
- Settlement batches support covered queries, line items, uploaded/system source invoice, tax calculations, payout reference/date/bank/amount, finance notes, assignee/reviewer, and payout instalments.

### Voucher, dashboards, documents, and communication

- Voucher management queue; voucher number and PDF generation; branded/unbranded voucher output; preview and email sending.
- Voucher includes guest, destination, dates, duration, passengers, services, confirmations, generated-by/time, and sent time.
- Voucher lifecycle: `ready`, `generated`, `sent`.
- Dedicated dashboards for agent, operations, DMC, finance, operations manager, finance manager, admin, and super admin.
- Dashboard/analytics capabilities include metrics, date and segmented filters, performance analytics, finance analytics, query pipeline, vouchers, payments, internal invoices, workload, activity, and reassignment data.
- In-app notifications: list, mark all read, delete. Coupon notifications have dedicated read state.
- Email providers: SMTP/Nodemailer or Resend. Twilio WhatsApp integration is used when configured.
- Cloudinary file-upload middleware with 5 MB size limit; local `uploads/` storage for selected invoice/settlement files.
- PDF services for quotations, vouchers, internal invoices, payout receipts, and finance documents.
- Routed agent Document Portal and Asset Library pages are present but currently hidden in the sidebar menu.
- Proforma invoice create/view components are present in the agent Query Details workflow.

## User journeys

### Agent: registration to voucher

1. Registers company, GST, contact information, documents, and password.
2. Waits for admin approval; can recover password with OTP.
3. Creates a travel query with trip/traveller details, requirements, and budget.
4. Uploads traveller documents and submits them for verification.
5. Uses query tasks, reminders, and activity history for follow-up.
6. Reviews a delivered quotation/PDF and requests revision, accepts, or confirms.
7. Tracks the booking/invoice, applies coupon, submits UTR/bank/receipt payment proof, and follows verification status.
8. Receives final finance documents and voucher.

### Operations: enquiry to confirmed booking 

1. Accepts/rejects a query from Order Acceptance.
2. Reviews traveller documents and records verification issues if required.
3. Opens the draft; selects DMC inventory or package template.
4. Configures hotels, transfers, activities, sightseeing, itinerary, inclusions/exclusions, notes, tax, and markup.
5. Saves/sends the quotation and processes revision requests.
6. Generates invoice, coordinates with admin where escalation is needed, and monitors payment/DMC confirmation.
7. Generates, previews, and sends the voucher.

### DMC: rates to settlement

1. Adds services or bulk-uploads supplier rate sheets.
2. Reviews history, corrects rows, and exposes inventory to quotation builders.
3. Views confirmed queries; uploads confirmations, vouchers, and terms.
4. Submits internal invoice or extracts values from an uploaded invoice.
5. Tracks finance review, payment, ledger records, and settlement batches.

### Finance: payment verification to supplier payable

1. Checks agent amount, UTR, bank, date, and receipt.
2. Verifies/rejects with remarks; verifies individual instalments and escalates where needed.
3. Sends final invoice/payment receipt to agent.
4. Reviews DMC invoices, due dates/credit period, extracted data, tax, finance assignee, and payout notes.
5. Updates supplier invoice status and records payout instalments.

### Management and administration

1. Approves/rejects agents; manages staff role, permissions, status, access expiry, and deletion lifecycle.
2. Manages coupons and rate contracts.
3. Operations manager oversees team queries/activity, capacity, reassignment, and reports.
4. Finance manager manages finance staff/vendors and reviews team transactions and DMC invoices.
5. Admin/super admin monitors dashboards, analytics, finance, vouchers, escalations, and override cases.

## Client routes

| Area | Routes |
| --- | --- |
| Public | `/`, `/register` |
| Agent | `/agent/dashboard`, `/agent/queries`, `/agent/bookings`, `/agent/documents`, `/agent/finance`, `/agent/assets` |
| Admin | `/admin/dashboard`, `/admin/superAdminDashboard`, `/admin/discount`, `/admin/bookings-management`, `/admin/user-management` |
| Operations | `/ops/dashboard`, `/ops/bookings-management`, `/ops/order-acceptance`, `/ops/quotation-builder`, `/ops/create-package`, `/ops/voucher-management` |
| DMC | `/dmc/dashboard`, `/dmc/contractedRates`, `/dmc/bulk-upload`, `/dmc/confirmation`, `/dmc/settlement` |
| Finance | `/finance/dashboard`, `/finance/advancedAnalytics`, `/finance/paymentVerification`, `/finance/internalInvoice` |
| Operations Manager | `/operationManager/operationManagerDashboard`, `/operationManager/allTeamQueries`, `/operationManager/myTeam` |
| Finance Manager | `/financeManager/financeManagerDashboard`, `/financeManager/advancedAnalytics`, `/financeManager/allTeamTransaction`, `/financeManager/internalDmcInvoice`, `/financeManager/myFinanceTeam` |

## API inventory

All paths are prefixed with `/api`. Most business routes require `Authorization: Bearer <JWT>`; file endpoints use multipart form data.

| Prefix | Endpoint groups |
| --- | --- |
| `/auth` | Registration, login, current user, heartbeat, profile, send/verify/reset password OTP. |
| `/agent` | Dashboard; queries; rate destinations; tasks/reminders; active bookings/finance; traveller documents; quotations/PDF/email preview/branding/revision/accept/confirm; voucher email; invoices/coupons/payment receipts/payment proof; notifications. |
| `/ops` | Dashboard/query list; query accept/reject/status/document review/escalation; quotation drafts/services/items/create/revise/send; service search; packages; invoices; vouchers; manager team/reassignment/report/activity. |
| `/admin` | Agent approvals; managed users; coupons; rate contracts; dashboards/stats; admin replies/override cases; payment verification/dispatch; finance analytics; vendors/internal invoices/parse upload/manual bulk upload; notifications. |
| `/dmc` | Hotel/activity/transfer/sightseeing/package inventory; bulk upload/history/view/download/delete/edit; dashboard; confirmations; supplier payment; internal invoices/extraction; payment ledger; settlement batches. |
| `/finance-manager` | Finance-team list/create, vendor creation, team transaction list/review. |

For individual HTTP methods and parameters, see [`server/src/routes`](server/src/routes).

## Core data entities

| Entity | Purpose |
| --- | --- |
| `Auth` | Users, roles, approval, profiles/branding, permissions, activity, and account governance. |
| `TravelQuery` | Trip query, travellers/documents, status, assignment, activity, document audit, reassignment, coordination. |
| `Quotation`, `QuotationDraft` | Quote versions/drafts, services, itinerary, pricing, branding, and decisions. |
| `Invoice` | Agent bill, snapshots, coupon, payment submission, verification/audit, dispatch. |
| `Voucher` | Voucher content, PDF, branding, lifecycle, and delivery. |
| `Dmc_Hotel`, `Dmc_Transfers`, `Dmc_Activity`, `Dmc_Sightseeing`, `Dmc_Package` | DMC catalogue and rate inventory. |
| `UploadHistory` | Bulk-upload metadata, parsed data, and row-change history. |
| `Confirmation` | DMC service confirmations and attachments. |
| `InternalInvoice`, `DmcSettlementBatch` | Supplier payables, review, payout, and grouped settlements. |
| `Coupon` | Discount code configuration, eligibility, distribution, and redemption context. |
| `Notification`, `AgentTask`, `OpsActivityLog`, `RateContract`, `AdminOverrideCase`, `AdminAccessRole`, `DestinationName`, `Counter` | Supporting workflow, audit, reference, and numbering entities. |

## Architecture and stack

### Frontend

- React 19, Vite, React Router, Redux Toolkit/React Redux.
- Axios client with automatic JWT injection and global request tracking.
- Tailwind CSS v4, Framer Motion, Lucide/React Icons, Recharts, React Hook Form, SweetAlert2.
- Excel/XLSX and ExcelJS utilities; Three.js and GSAP are installed.
- Lazy-loaded role pages and Vercel SPA rewrite configuration.

### Backend

- Node.js, Express 5, MongoDB/Mongoose.
- JWT and bcrypt authentication.
- Multer and Cloudinary uploads; selected local static uploads.
- XLSX import; PDFKit output; `pdf-parse`, Mammoth, Sharp, and Tesseract document extraction/OCR.
- SMTP/Nodemailer or Resend email; Twilio WhatsApp.
- CORS, Morgan logging, configurable body size, and 404/error handlers.

## Repository structure

```text
holiday-circuit/
├── client/
│   └── src/              # Auth, role pages, shared components, modals, routes, layout, redux, utilities
├── server/
│   ├── src/
│   │   ├── controllers/  # Workflow handlers
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # Express API declarations
│   │   ├── services/     # Mail, PDF, imports, extraction, notifications
│   │   └── middlewares/  # JWT, upload, error helpers
│   ├── uploads/
│   ├── createAdmin.js
│   └── index.js
└── README.md
```

## Setup

### Prerequisites

- Node.js 18+ and npm
- MongoDB
- Cloudinary credentials for Cloudinary-backed files
- SMTP or Resend credentials for email
- Optional Twilio credentials for WhatsApp

```bash
git clone <repository-url>
cd holiday-circuit

cd client
npm install

cd ../server
npm install
npm start
```

In another terminal:

```bash
cd holiday-circuit/client
npm run dev
```

Client default: `http://localhost:5173`. API default: `http://localhost:3000/api`.

### Environment variables

Create `server/.env` without committing secrets:

```env
PORT=3000
MONGO_URL=<mongodb-connection-string>
JWT_SECRET=<strong-secret>
REQUEST_BODY_LIMIT=25mb

CLOUDINARY_NAME=<cloud-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>

MAIL_PROVIDER=smtp
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_SERVICE=<optional-service>
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
SMTP_FROM_EMAIL=<sender-email>
SMTP_REPLY_TO=<reply-to-email>

RESEND_API_KEY=<resend-api-key>
RESEND_FROM_EMAIL=<sender-email>
RESEND_REPLY_TO=<reply-to-email>

TWILIO_ACCOUNT_SID=<twilio-sid>
TWILIO_AUTH_TOKEN=<twilio-token>
TWILIO_WHATSAPP_NUMBER=<whatsapp-sender>
FRONTEND_LOGIN_URL=http://localhost:5173
```

Optional `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

| Location | Command | Purpose |
| --- | --- | --- |
| `client` | `npm run dev` | Vite development server. |
| `client` | `npm run build` | Production frontend build. |
| `client` | `npm run lint` | ESLint. |
| `client` | `npm run preview` | Preview built frontend. |
| `server` | `npm start` | Start server with Nodemon. |
| `server` | `node createAdmin.js` | Development admin-seed utility. |

## SOW comparison checklist

| SOW area | Current evidence |
| --- | --- |
| Multi-role travel platform | Seven roles and distinct protected workspaces. |
| Agent onboarding/KYC | Registration documents, company/GST/contact data, approval lifecycle. |
| Travel CRM/query lifecycle | Query creation, statuses, assignment, activity/reassignment/admin thread, tasks. |
| Quotation system | Drafts, inventory services, package customisation, tax/markup, PDF/email/WhatsApp, revision/acceptance/confirmation. |
| Supplier/DMC rates | Four service categories plus packages, bulk upload, history, and row editing. |
| Billing/collections | Invoice snapshots, coupons, proof/instalments, verification, finance dispatch. |
| Supplier payables | DMC confirmation, internal invoices, extraction, approval, payout, ledger, settlement batches. |
| Voucher fulfilment | PDF generate, preview, branding, send, status lifecycle. |
| Management controls | Users/permissions, coupons/contracts, dashboards, analytics, reassignment, reports, escalations. |
| Communication/documents | In-app notifications, email, optional WhatsApp, Cloudinary/local files, PDFs, traveller audit. |
| Tests/CI | No working automated test suite is currently defined in `server/package.json`; treat as an implementation gap unless delivered separately. |

## Security and delivery notes

- API authentication uses `Authorization: Bearer <token>` JWTs.
- Client-side roles are protected by router guards; server routes use JWT middleware and controller-level business checks. A security review should confirm explicit server-side authorisation for every sensitive endpoint.
- Cloudinary middleware limits uploaded files to 5 MB. Some manual invoice/settlement files are stored under `/uploads`.
- Never commit or document environment secrets from `server/.env`.
- Validate environment-dependent features during SOW acceptance: email/WhatsApp delivery, Cloudinary access, payment permissions, PDF templates, OCR extraction accuracy, and supplier settlement flows.
