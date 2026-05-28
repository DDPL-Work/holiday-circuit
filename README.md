# Holiday Circuit

Holiday Circuit is a full-stack travel operations and fulfillment platform designed to manage the end-to-end lifecycle of a travel booking. It connects travel agents, internal operations teams, destination management company (DMC) partners, finance teams, and management users in one role-based system.

The platform covers the complete business flow from agent onboarding and travel query creation to quotation building, booking approval, invoicing, payment verification, DMC fulfillment, and voucher delivery. It also includes operational dashboards, user administration, notification handling, document workflows, coupon support, and bulk inventory uploads for supplier rate management.

## Project Purpose

Holiday Circuit was built to centralize travel business operations that are usually spread across spreadsheets, email threads, WhatsApp messages, and disconnected internal tools. Its goal is to give each stakeholder a focused workspace while keeping the full booking journey traceable inside one system.

In practical terms, the application helps teams:

- register and approve travel agents
- capture travel queries with traveler-level details
- manage quotations and revisions
- maintain DMC inventories and contracted rates
- generate invoices and verify payments
- coordinate DMC confirmations and internal invoices
- create and send travel vouchers
- track operational and financial performance through dashboards

## What the Project Does

Holiday Circuit acts as a workflow engine for travel operations.

1. An agent registers and submits company and KYC details.
2. An admin reviews and approves the account.
3. The agent creates a travel query with trip details, traveler details, and client information.
4. The operations team accepts the query and prepares a quotation using DMC inventory and service pricing.
5. The quotation can be revised, sent, accepted, and confirmed.
6. The system generates invoices and tracks payment submissions, receipts, and verification.
7. DMC partners confirm service fulfillment and submit internal invoices.
8. Operations generates the final voucher and sends it to the agent/client.
9. Admin, finance, and managers monitor progress, workload, compliance, and performance from dashboards.

## Major Functionalities and Features

### 1. Authentication and Account Management

- Agent registration with company details, GST number, phone number, supporting documents, and KYC flow.
- Role-based login for agents, admin users, operations users, DMC partners, finance users, operation managers, and finance managers.
- JWT-based authentication for protected API access.
- Profile update support for authenticated users.
- Forgot password flow with OTP generation, OTP verification, and password reset.
- Account approval and rejection workflow for agents.
- Account status controls including active/inactive state, deletion status, review details, and access expiry support.

### 2. Role-Based Access Control

The backend and frontend both enforce role-specific access. Supported roles in the codebase are:

- `agent`
- `admin`
- `operations`
- `dmc_partner`
- `finance_partner`
- `operation_manager`
- `finance_manager`

The UI also exposes managed-user labels such as Super Admin, Ops Team, Finance Team, Operation Manager, Finance Manager, and DMC Partner.

### 3. Agent Query Management

- Create travel queries with destination, travel dates, client email, hotel category, budget, transport requirement, sightseeing requirement, and special requirements.
- Capture traveler-level details such as traveler type, child age, document type, and uploaded documents.
- Maintain query status at agent, operations, and quotation levels.
- View all agent queries and active bookings.
- Submit traveler documents for review and verification.
- Receive notifications related to quotations, coupons, and workflow events.

### 4. Traveler Document Workflow

- Traveler documents are stored per traveler and can include passport and government ID records.
- Document workflow supports draft, pending, verified, and rejected states.
- Operations can review document submissions.
- Audit trail captures document actions, reviewer information, remarks, and timestamps.
- Rejection issues can be tracked at traveler/document level for correction and resubmission.

### 5. Quotation Management and Pricing Engine

- Operations can accept or reject queries.
- A quotation draft can be created or reopened for a booking.
- Services can be added to quotations from DMC inventory.
- Supported service types:
  - hotel
  - transfer
  - activity
  - sightseeing
- Quotations support:
  - inclusions
  - exclusions
  - additional notes
  - day-wise itinerary
  - pricing snapshots
  - markup calculation
  - tax calculation
  - validity date
  - multi-currency amounts and INR conversion
- Agent-side quotation actions include:
  - review quotation
  - accept quotation
  - request revision
  - confirm quotation
- Quotation lifecycle states include pending, sent, revised, accepted, finalized, client-shared, and confirmed scenarios.

### 6. Booking and Operations Workflow

- Booking Management Hub for operations and admin users.
- Order Acceptance interface for accepting new work and starting quotations.
- Query reassignment support for operation managers.
- Admin escalation/reply flow for operations coordination.
- Activity logs and reassignment history attached to travel queries.
- Voucher readiness and booking progression indicators.

### 7. DMC Inventory and Contracted Rates

DMC partners can manage service inventory through direct entry and bulk upload flows.

Implemented inventory modules:

- Hotels
- Activities
- Transfers
- Sightseeing
- Packages

Inventory records support operational travel pricing details such as:

- supplier name
- country and city
- category and room details
- meal plans
- vehicle details and capacities
- service validity dates
- adult/child/infant pricing
- supported currencies

Admin users can also create and manage rate contracts.

### 8. Bulk Upload System

The project includes Excel/CSV-based bulk upload processing for DMC inventory.

Supported upload categories:

- hotel
- transport
- activity
- package
- sightseeing

Bulk upload capabilities include:

- category-based processing
- automatic row parsing and normalization
- upload history logging
- success/failure tracking
- downloadable upload files
- delete upload history entries

### 9. Invoice and Payment Management

- Invoice generation from confirmed quotation data.
- Invoice line items and trip snapshots stored at generation time.
- Coupon application on invoices.
- Agent payment submission with:
  - amount
  - UTR number
  - bank name
  - payment date
  - uploaded receipt
- Payment verification workflow with assigned finance reviewer, approval/rejection decision, remarks, and audit trail.
- Final invoice dispatch tracking.
- Agent payment receipt dispatch tracking.
- Payment status states such as pending, partially paid, paid, and unpaid.

### 10. Coupon and Discount Module

- Admin coupon creation and update.
- Auto-generation of unique coupon codes.
- Coupon assignment and sending to agents.
- Agent coupon inbox and coupon notification handling.
- Coupon validation and application during invoice payment flow.
- Usage tracking, redemption metadata, and availability checks.

### 11. Finance Operations

- Finance dashboard for receivables, payables, pending verifications, settled totals, overdue status, and date-range based summaries.
- Payment verification interface for submitted agent payments.
- Internal invoice tracking for DMC submissions.
- Advanced analytics support from admin finance routes.
- Finance manager team oversight and team transaction review.

### 12. DMC Fulfillment and Internal Invoices

- DMC dashboard for confirmed work visibility.
- Fulfillment confirmation submission with uploaded documents.
- DMC internal invoice submission tied to booking/query context.
- Internal invoice status flow:
  - Submitted
  - In Review
  - Approved
  - Rejected
  - Paid
- Internal invoice document storage and generated PDF handling.
- Payout details, bank references, finance notes, and assignment metadata.

### 13. Voucher Management

- Voucher readiness tracking per booking.
- Voucher number generation and PDF creation.
- Support for branded and unbranded voucher output.
- Voucher preview before dispatch.
- Voucher sending workflow for completed bookings.
- Voucher records store services, confirmations, destination, guest name, travel dates, and send timestamps.

### 14. Notifications and Communication

- In-app notifications for users.
- Notification read-all and delete actions.
- Email communication services for:
  - registration acknowledgement
  - approval/rejection messages
  - password reset OTP
  - quotation emails
  - voucher emails
  - final invoice emails
  - payment receipt emails
  - coupon emails
- Configurable mail provider support:
  - SMTP
  - Resend
- Twilio WhatsApp integration for quotation communication.

### 15. Admin and Team Management

- Pending agent approvals dashboard.
- Managed user creation and update.
- Team member creation for operations and finance management structures.
- Role-specific permission assignment.
- Soft delete, restore, and permanent delete for managed users.
- Account event notifications for managed users.
- User status updates and access governance.

### 16. Dashboards and Reporting

The project includes dedicated dashboards for:

- agents
- admin/super admin
- operations
- DMC partners
- finance team
- operation managers
- finance managers

Dashboard data includes combinations of:

- pending queries
- active bookings
- voucher counts
- payment status summaries
- receivables/payables
- team performance
- workload and reassignment data
- query progress and recent activity

## User Roles and Responsibilities

| Role | Main Responsibilities |
| --- | --- |
| Agent | Register, create travel queries, upload traveler documents, review quotations, apply coupons, submit payments, track bookings and invoices |
| Admin / Super Admin | Approve agents, manage users, oversee bookings, review escalations, manage discounts/coupons, monitor dashboards, access finance and DMC views |
| Operations Team | Accept queries, create quotations, manage bookings, review traveler documents, generate invoices, manage vouchers |
| Operation Manager | Supervise operations team, review all team queries, reassign workload, submit manager reports |
| DMC Partner | Maintain service inventory, bulk upload contracted data, submit confirmations, manage internal invoices, monitor DMC dashboard |
| Finance Team / Finance Partner | Verify agent payments, review receipts, manage finance dashboard, process internal invoice actions |
| Finance Manager | Supervise finance team, review team transactions, monitor internal DMC invoices, manage finance workload |

## Core Modules

### Frontend Modules

- Authentication and registration
- Role-based routing and layout
- Agent dashboard and query management
- Operations dashboard and booking workflows
- Quotation builder
- Voucher management
- DMC contracted rates and fulfillment
- Finance dashboard and payment verification
- Admin dashboard and user management
- Manager dashboards for operations and finance
- Shared modal-driven workflows for booking actions, coupons, uploads, and previews

### Backend Modules

- Authentication controller and profile management
- Agent query and booking controller
- Admin controller
- Operations controller
- DMC controller
- Finance manager controller
- Ops manager controller
- Coupon controller
- Bulk upload controller
- Notification and communication services
- PDF generation services
- Email provider abstraction layer

### Primary Database Models

- `Auth`
- `TravelQuery`
- `Quotation`
- `Invoice`
- `InternalInvoice`
- `Voucher`
- `Coupon`
- `Notification`
- `RateContract`
- `UploadHistory`
- `Dmc_Hotel`
- `Dmc_Transfers`
- `Dmc_Activity`
- `Dmc_Sightseeing`
- `Dmc_Package`
- `Confirmation`

## Project Workflow

### End-to-End Booking Flow

1. Agent registration  
   The travel agent registers with company data and uploads required documents.

2. Admin review and approval  
   Admin validates the application and approves or rejects the account.

3. Travel query creation  
   The agent creates a query with destination, dates, traveler counts, documents, and client information.

4. Operations acceptance  
   Operations reviews the query, accepts it, and begins quotation preparation.

5. Inventory-based quotation building  
   Services are selected from DMC inventory or contracted data, pricing is calculated, and quotation details are prepared.

6. Quotation sharing and revision  
   The quotation is sent to the agent. The agent can accept it, request revision, or confirm it.

7. Invoice generation and payment submission  
   Once the booking reaches the required stage, an invoice is generated. The agent can apply a coupon and upload payment proof.

8. Finance verification  
   Finance validates the payment submission and updates verification status.

9. DMC confirmation and internal invoicing  
   DMC partners submit fulfillment confirmations and internal invoice details.

10. Voucher generation and dispatch  
   Operations generates the travel voucher and sends it once all required confirmations are complete.

11. Management oversight  
   Admin, operation managers, and finance managers monitor workload, compliance, payment progress, and operational completion.

## How the System Works Technically

### Frontend

- Built with React 19 and Vite.
- Uses React Router for route-level role segregation.
- Uses Redux Toolkit for authentication state.
- Uses Axios with an interceptor for automatic bearer-token injection.
- Uses Tailwind CSS and component-level styling for the user interface.
- Uses Framer Motion for interactive dashboard and modal animations.

### Backend

- Built with Node.js and Express.
- Uses MongoDB with Mongoose for persistence.
- Uses JWT for authentication.
- Uses Multer and Cloudinary for document upload handling.
- Uses XLSX for bulk Excel/CSV imports.
- Uses Nodemailer or Resend for email delivery.
- Uses Twilio for WhatsApp messaging.
- Uses PDF generation services for quotations, invoices, and payout-related documents.

## Technology Stack

### Client

- React 19
- Vite
- React Router
- Redux Toolkit
- Axios
- Tailwind CSS
- Framer Motion
- Recharts
- React Hook Form
- SweetAlert2
- XLSX

### Server

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- Bcrypt
- Multer
- Cloudinary
- Nodemailer
- Resend
- Twilio
- PDFKit
- XLSX

## Folder Structure

```text
holiday-circuit/
|-- client/
|   |-- public/
|   |-- src/
|   |   |-- auth/
|   |   |-- components/
|   |   |-- data/
|   |   |-- layout/
|   |   |-- modal/
|   |   |-- pages/
|   |   |-- redux/
|   |   |-- routes/
|   |   `-- utils/
|   `-- package.json
|-- server/
|   |-- src/
|   |   |-- configs/
|   |   |-- controllers/
|   |   |-- helpers/
|   |   |-- middlewares/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- utils/
|   |-- uploads/
|   |-- createAdmin.js
|   |-- index.js
|   `-- package.json
`-- README.md
```

## API Route Groups

- `/api/auth` - authentication, registration, profile update, password recovery
- `/api/agent` - dashboard, queries, bookings, quotations, invoices, coupons, notifications
- `/api/admin` - approvals, users, coupons, dashboards, payments, finance analytics, internal invoices
- `/api/ops` - operations dashboard, query processing, quotations, invoices, vouchers, manager operations
- `/api/dmc` - service inventory, bulk uploads, confirmation, dashboard, internal invoices
- `/api/finance-manager` - finance team management and team transaction review

## Installation and Setup

### Prerequisites

- Node.js 18 or later
- npm
- MongoDB instance
- Cloudinary account for uploads
- Email provider configuration for SMTP or Resend
- Optional: Twilio credentials for WhatsApp notifications

### 1. Clone the project

```bash
git clone <your-repository-url>
cd holiday-circuit
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

```bash
cd ../server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside `server/` and configure the values below.

```env
PORT=3000
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
REQUEST_BODY_LIMIT=25mb

CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

MAIL_PROVIDER=smtp

SMTP_SERVICE=
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=
SMTP_REPLY_TO=

RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_REPLY_TO=

FRONTEND_LOGIN_URL=http://localhost:5173
SUPPORT_EMAIL=support@holidaycircuit.com

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

Create a `.env` file inside `client/` if you want to override the API URL.

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 5. Start the backend

```bash
cd server
npm start
```

### 6. Start the frontend

```bash
cd client
npm run dev
```

### 7. Open the application

The frontend typically runs on `http://localhost:5173` and the backend API uses `http://localhost:3000/api` unless you change the configuration.

## Admin Seeding

The backend includes `server/createAdmin.js` for creating an initial admin account.

Current script defaults:

- Email: `admin@gmail.com`
- Password: `admin123`

Use it only for development seeding and change these credentials before any shared or production deployment.

Example:

```bash
cd server
node createAdmin.js
```

## Deployment Notes

- The client already includes `vercel.json`, which suggests the frontend is intended to be deployable on Vercel.
- The server expects environment-based configuration and can be deployed on any Node.js-compatible hosting platform.
- Uploaded and generated files are served from the backend `uploads/` directory, while some document uploads are also handled through Cloudinary.

## Security and Access Features

- JWT-protected APIs
- role-based route protection
- managed-user permissions
- account approval workflow
- access expiry field support
- soft delete and permanent delete controls
- payment verification audit trail
- traveler document review audit trail

## Current Development Notes

- The project already contains substantial business functionality across client and server modules.
- The backend `package.json` does not currently define a real automated test suite.
- There is no root `.env.example` file yet, so environment setup is currently manual.

## Future Enhancements

The following improvements would strengthen the platform further:

- add a complete automated test suite for controllers, services, and critical UI workflows
- provide `.env.example` files for client and server
- implement refresh tokens and stronger session management
- add audit dashboards for admin-level compliance review
- support multi-tenant branding for agencies and white-label partners
- add live chat or comment threads inside each booking/query
- integrate payment gateway support for direct payment collection
- add calendar-based itinerary planning and scheduling views
- support downloadable MIS, finance, and reconciliation reports in multiple formats
- add approval SLAs and escalation reminders for pending tasks
- improve deployment readiness with CI/CD pipelines and environment validation
- add stronger file storage abstraction for production-scale upload management

## Summary

Holiday Circuit is a comprehensive travel operations platform that combines CRM-like query handling, quotation management, DMC inventory control, financial processing, and fulfillment workflows in one application. It is especially suited for travel businesses that need structured collaboration across agents, operations, finance teams, and destination partners.

The codebase already demonstrates a strong foundation for a production-oriented travel workflow system, with clear module separation, role-specific dashboards, multi-stage approvals, and document-driven booking operations.
