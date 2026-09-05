import{r as g,j as e,X as Y,A as J,m as B,M as R,k as M,z as T,F as L,s as G}from"./index-CFi9T5Pm.js";import{S as U}from"./send-D2S7qqX_.js";import{D as V}from"./download-D38kYXgV.js";import{M as F}from"./message-circle-DdkNs6DM.js";import{S as K}from"./search-9tC2tUFL.js";import{U as Q}from"./user-CflC33wS.js";import{M as Z}from"./map-pin-DrxVrqYt.js";import{C as ee}from"./calendar-Bb6HC9FQ.js";import{P as te}from"./package-CCe62kEM.js";import{E as _}from"./eye-DAL0dhyZ.js";const re="https://res.cloudinary.com/dszadvuz6/image/upload/e_trim/v1777932524/unzssx1sjkrigbgldg7h.png",X=(t="")=>{const s=String(t||"").trim().toLowerCase();return s?s==="hotel"?"Hotel":s==="transfer"||s==="transport"||s==="car"?"Transport":s==="activity"?"Activity":s==="sightseeing"?"Sightseeing":s==="flight"?"Flight":s.replace(/\b\w/g,n=>n.toUpperCase()):"Service"},se=t=>{if(!t)return"-";const s=new Date(t);return Number.isNaN(s.getTime())?String(t):s.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})},ae=({adults:t=0,children:s=0,travelerSummary:n="",passengers:l=""}={})=>{const d=Number(t||0),c=Number(s||0),h=[];return d>0&&h.push(`${d} Adult${d>1?"s":""}`),c>0&&h.push(`${c} Child${c>1?"ren":""}`),h.length?h.join(", "):n||l||"-"},ne=(t=[],s=!1)=>{const n=(t||[]).filter(d=>!String(d?.title||d?.name||"").trim()),l=(t||[]).filter(d=>{const c=String(d?.confirmation||"").trim().toLowerCase();return!c||c==="pending"});return t.length?n.length&&l.length?{tone:"red",title:"Services And Confirmations Missing",message:"Some voucher services are missing and some DMC confirmation numbers are still pending. Client sharing will stay blocked until both are complete.",canSend:!1}:n.length?{tone:"red",title:"Service Details Missing",message:"Some voucher services are missing. Complete all service names before sending the voucher to the client.",canSend:!1}:l.length?{tone:"red",title:"DMC Confirmation Pending",message:"Some DMC confirmation numbers are still pending. Client sharing will stay blocked until all confirmations are updated.",canSend:!1}:s?{tone:"green",title:"Voucher Already Shared",message:"This voucher has already been sent successfully. You can review or download the final shared copy here.",canSend:!1}:{tone:"green",title:"Client Ready To Send",message:"All services and DMC confirmation numbers are available. This voucher is ready to share with the client.",canSend:!0}:{tone:"red",title:"Voucher Services Missing",message:"No services are mapped in this voucher yet. Add services before sending it to the client.",canSend:!1}},ie=(t="",s="")=>{const n=String(t||"").trim().toLowerCase(),l=String(s||"").trim().toLowerCase();return!n||n==="pending"?{label:"Pending",cssClass:"status-pending"}:l==="cancelled"||n==="cancelled"?{label:"Cancelled",cssClass:"status-cancelled"}:{label:"Confirmed",cssClass:"status-confirmed"}},O=(t,s,n={})=>{const l=s==="with",d=t?.travelDate||t?.date||null,c=String(t?.voucherFooterImage||t?.footerBanner||t?.pdfFooterImage||t?.agentFooterImage||"").trim(),h=ae({adults:t.adults,children:t.children,travelerSummary:t.travelerSummary,passengers:t.passengers}),w=String(n?.logo||"").trim(),p=String(n?.name||"").trim(),f=l&&(w||p),o=(t.services||[]).map((u,v)=>{const j=u.confirmation||"Pending",k=ie(j,u.status),C=j.toLowerCase()!=="pending"?j:"-";return`
        <tr>
          <td class="svc-type">${X(u.type)}</td>
          <td class="svc-name">${u.title||u.name||"Service details missing"}</td>
          <td class="svc-status"><span class="${k.cssClass}">${k.label}</span></td>
          <td class="svc-conf">${C}</td>
        </tr>
      `}).join("");return`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Travel Voucher - ${t.voucherNumber||t.query}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background-color: #f0f4f8;
            padding: 40px 20px;
            font-family: 'Plus Jakarta Sans', 'Inter', Arial, sans-serif;
            color: #1e293b;
            -webkit-font-smoothing: antialiased;
          }
          .voucher-container {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            overflow: hidden;
            border-radius: 2px;
          }

          /* ── HEADER ── */
          .brand-header {
            background: linear-gradient(135deg, #0f1d32 0%, #1a3352 50%, #264a6e 100%);
            height: 110px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 36px 0 32px;
            border-bottom: 3px solid #3d6a8e;
          }
          .brand-header::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 140px;
            height: 100%;
            background: linear-gradient(180deg, #264a6e 0%, #3d6a8e 100%);
            transform: skewX(-28deg);
            transform-origin: top left;
            z-index: 1;
          }
          .brand-header::after {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            width: 72px;
            height: 100%;
            background: linear-gradient(180deg, #264a6e 0%, #3d6a8e 100%);
            transform: skewX(-28deg);
            transform-origin: top right;
            z-index: 1;
          }
          .brand-logo-box {
            background: #ffffff;
            padding: 12px 18px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #5a8aa8;
            z-index: 2;
            position: relative;
            margin-left: 20px;
            border-radius: 4px;
          }
          .brand-logo {
            height: 62px;
            width: auto;
            object-fit: contain;
          }
          .brand-mark {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            line-height: 1;
          }
          .brand-mark-letters {
            display: inline-flex;
            align-items: flex-end;
            font-family: 'Inter', sans-serif;
            font-size: 36px;
            font-weight: 800;
            letter-spacing: -1px;
          }
          .brand-mark-t {
            color: #0f1d32;
          }
          .brand-mark-v {
            background: linear-gradient(180deg, #5a8aa8 0%, #3d6a8e 55%, #1a3352 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
            margin-left: 1px;
          }
          .brand-mark-sub {
            margin-top: 3px;
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            font-size: 7px;
            font-weight: 700;
            letter-spacing: 0.18em;
            color: #7badc8;
            text-transform: uppercase;
          }
          .brand-name {
            color: #ffffff;
            font-family: 'Inter', sans-serif;
            font-size: 32px;
            font-weight: 800;
            letter-spacing: -0.5px;
            z-index: 2;
            position: relative;
          }

          /* ── TITLE BAR ── */
          .title-bar {
            background: linear-gradient(135deg, #0f1d32 0%, #1a3352 50%, #264a6e 100%);
            color: #ffffff;
            text-align: center;
            font-size: 17px;
            font-weight: 700;
            padding: 15px 20px;
            letter-spacing: 4px;
            text-transform: uppercase;
            font-family: 'Inter', sans-serif;
            border-top: 2px solid #5a8aa8;
            border-bottom: 2px solid #0f1d32;
          }

          /* ── BODY ── */
          .voucher-body {
            padding: 28px 30px 30px;
          }

          /* ── METADATA CARDS ── */
          .metadata-card {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #e2e8f0;
            margin-bottom: 18px;
          }
          .metadata-card tr td {
            border-bottom: 1px solid #e2e8f0;
            border-right: 1px solid #e2e8f0;
            padding: 11px 14px;
            font-size: 13px;
            vertical-align: middle;
          }
          .metadata-card tr:last-child td {
            border-bottom: none;
          }
          .metadata-card tr td:last-child {
            border-right: none;
          }
          .metadata-card td.label-cell {
            background-color: #f1f5f9;
            font-weight: 700;
            color: #334155;
            width: 32%;
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            letter-spacing: 0.2px;
          }
          .metadata-card td.value-cell {
            background-color: #ffffff;
            color: #0f172a;
            font-weight: 600;
          }

          /* ── SECTION HEADING ── */
          .section-heading {
            margin: 24px 0 12px;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #ffffff;
            background: linear-gradient(135deg, #0f1d32 0%, #1a3352 50%, #264a6e 100%);
            padding: 11px 16px;
            font-family: 'Inter', sans-serif;
            border-top: 2px solid #5a8aa8;
            border-bottom: 2px solid #0f1d32;
          }

          /* ── SERVICES TABLE ── */
          .services-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #d5e3ee;
            font-size: 13px;
          }
          .services-table thead th {
            background: linear-gradient(180deg, #edf3f8 0%, #e2ecf3 100%);
            border-bottom: 2px solid #a3bdd0;
            border-right: 1px solid #d5e3ee;
            padding: 12px 14px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #1a3352;
            text-align: left;
            letter-spacing: 0.8px;
            font-family: 'Inter', sans-serif;
          }
          .services-table thead th:last-child {
            border-right: none;
          }
          .services-table tbody td {
            border-bottom: 1px solid #d5e3ee;
            border-right: 1px solid #d5e3ee;
            padding: 12px 14px;
            color: #1a3352;
            background-color: #ffffff;
            vertical-align: middle;
          }
          .services-table tbody tr:last-child td {
            border-bottom: none;
          }
          .services-table tbody td:last-child {
            border-right: none;
          }
          .services-table tbody tr:nth-child(even) td {
            background-color: #f4f8fc;
          }
          .services-table tbody tr:hover td {
            background-color: #eaf1f8;
          }
          .svc-type {
            font-weight: 700;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
            color: #1a3352;
            width: 16%;
          }
          .svc-name {
            font-weight: 600;
            color: #0f1d32;
            width: 40%;
          }
          .svc-status {
            width: 18%;
            text-align: center;
          }
          .svc-conf {
            font-weight: 600;
            color: #334155;
            width: 26%;
            font-family: 'Inter', monospace;
            font-size: 12px;
          }
          .status-confirmed {
            display: inline-block;
            background: #f0f9f4;
            color: #166534;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 20px;
            border: 1px solid #b4dfc8;
            letter-spacing: 0.3px;
          }
          .status-pending {
            display: inline-block;
            background: #fef9f0;
            color: #92400e;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 20px;
            border: 1px solid #f5dea0;
            letter-spacing: 0.3px;
          }
          .status-cancelled {
            display: inline-block;
            background: #fef4f4;
            color: #991b1b;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 20px;
            border: 1px solid #f5c6c6;
            letter-spacing: 0.3px;
          }

          /* ── EMPTY STATE ── */
          .empty-row td {
            text-align: center;
            color: #94a3b8;
            padding: 22px 14px;
            font-style: italic;
            font-size: 13px;
          }

          /* ── GENERATED NOTE ── */
          .generated-note {
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            margin: 24px 0 0;
            font-weight: 500;
            letter-spacing: 0.2px;
          }

          /* ── FOOTER ── */
          .brand-footer {
            background: linear-gradient(135deg, #0f1d32 0%, #1a3352 50%, #264a6e 100%);
            padding: 18px 28px;
            border-top: 3px solid #3d6a8e;
            color: #ffffff;
            font-size: 12px;
            text-align: center;
            line-height: 1.8;
          }
          .footer-info {
            font-weight: 600;
            margin-bottom: 4px;
          }
          .footer-item {
            color: #cbd5e1;
          }
          .footer-address {
            color: #94a3b8;
            font-size: 11px;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="voucher-container">
          <!-- HEADER -->
          <div class="brand-header">
            <div class="brand-logo-box">
              ${f&&w?`<img src="${w}" alt="${p||"Agent"} Logo" class="brand-logo">`:f?`<div class="brand-mark"><div class="brand-mark-letters"><span class="brand-mark-t">${(p||"A").charAt(0).toUpperCase()}</span></div><div class="brand-mark-sub">Travel Voucher</div></div>`:l?`<img src="${re}" alt="Holiday Circuit Logo" class="brand-logo">`:'<div class="brand-mark"><div class="brand-mark-letters"><span class="brand-mark-t">T</span><span class="brand-mark-v">V</span></div><div class="brand-mark-sub">Travel Voucher</div></div>'}
            </div>
            <div class="brand-name">${f?p||"Travel Voucher":l?"Holiday Circuit":"Travel Voucher"}</div>
          </div>

          <!-- TITLE BAR -->
          <div class="title-bar">Travel Voucher</div>

          <!-- BODY -->
          <div class="voucher-body">
            <!-- VOUCHER INFO -->
            <table class="metadata-card">
              <tr>
                <td class="label-cell">Voucher Number</td>
                <td class="value-cell">${t.voucherNumber||t.query}</td>
              </tr>
              <tr>
                <td class="label-cell">Destination</td>
                <td class="value-cell">${t.destination||"-"}</td>
              </tr>
              <tr>
                <td class="label-cell">Duration</td>
                <td class="value-cell">${t.duration||"-"}</td>
              </tr>
              <tr>
                <td class="label-cell">Passengers</td>
                <td class="value-cell">${t.passengers||"-"}</td>
              </tr>
            </table>

            <!-- GUEST INFO -->
            <table class="metadata-card">
              <tr>
                <td class="label-cell">Guest Details</td>
                <td class="value-cell">${t.name||t.guestName||"-"}</td>
              </tr>
              <tr>
                <td class="label-cell">Pax Details</td>
                <td class="value-cell">${h}</td>
              </tr>
              <tr>
                <td class="label-cell">Travel Date</td>
                <td class="value-cell">${se(d)}</td>
              </tr>
            </table>

            <!-- SERVICE DETAILS -->
            <div class="section-heading">Service Details</div>
            <table class="services-table">
              <thead>
                <tr>
                  <th width="16%">Type</th>
                  <th width="40%">Service Description</th>
                  <th width="18%" style="text-align:center;">Status</th>
                  <th width="26%">Confirmation No.</th>
                </tr>
              </thead>
              <tbody>
                ${o||'<tr class="empty-row"><td colspan="4">No services available</td></tr>'}
              </tbody>
            </table>

            <!-- GENERATED NOTE -->
            <div class="generated-note">
              This is a computer generated document. No signature/stamp required.
            </div>
          </div>

          <!-- FOOTER -->
          ${c?`
            <div style="width:100%; margin-top:16px; text-align:center;">
              <img src="${c}" alt="Footer Banner" style="width:100%; max-width:100%; height:auto; display:block;" />
            </div>
          `:`
            <div class="brand-footer">
              <div class="footer-info">
                <div class="footer-item">Phone: ${t.agencyPhone||"+91 8851346665"} | Email: ${t.agencyEmail||"ops@holidaycircuit.com"}</div>
              </div>
              <div class="footer-address">
                ${t.agencyAddress||"2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058"}
              </div>
            </div>
          `}
        </div>
      </body>
    </html>
  `},oe=[{key:"EMAIL",label:"Email",description:"Send voucher directly to the agent's email inbox",icon:R,colorClass:"bg-[#2563eb]"},{key:"WHATSAPP",label:"WhatsApp",description:"Open WhatsApp with the voucher link ready to share",icon:F,colorClass:"bg-[#16a34a]"},{key:"PDF",label:"PDF Download",description:"Download the voucher HTML to your system",icon:V,colorClass:"bg-[#f59e0b]"}],q=(t="")=>{const s=String(t||"").replace(/\D/g,"");return s?s.length===10?`91${s}`:s:""},le=({selectedChannel:t,recipientEmail:s,recipientPhone:n,onSelectChannel:l,onEmailChange:d,onPhoneChange:c,onClose:h,onConfirm:w,isSubmitting:p,agentName:f})=>e.jsx("div",{className:"fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4 py-8 md:py-10",children:e.jsxs(B.div,{initial:{opacity:0,y:18,scale:.96},animate:{opacity:1,y:0,scale:1},exit:{opacity:0,y:12,scale:.98},transition:{duration:.24,ease:"easeOut"},className:"w-full max-w-[400px] overflow-hidden rounded-[28px] border border-[#e2e8f0] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.25)]",children:[e.jsx("div",{className:"border-b border-slate-100 bg-[linear-gradient(180deg,#f0f4ff_0%,#f8faff_52%,#ffffff_100%)] px-5 py-3",children:e.jsxs("div",{className:"flex items-start justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] text-white shadow-md",children:e.jsx(U,{size:15})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-700",children:"Send Travel Voucher"}),e.jsxs("h3",{className:"mt-0.5 text-[17px] font-semibold leading-none text-slate-900",children:["Share with ",f||"Agent"]})]})]}),e.jsx("button",{type:"button",onClick:h,className:"flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:text-slate-700",children:e.jsx(Y,{size:16})})]})}),e.jsxs("div",{className:"px-5 py-3",children:[e.jsx("div",{className:"space-y-2",children:oe.map(o=>{const u=o.icon,v=t===o.key;return e.jsxs("button",{type:"button",onClick:()=>l(o.key),className:`flex w-full items-start gap-3 rounded-2xl border px-4 py-2.5 text-left transition ${v?"border-slate-800 bg-gradient-to-br from-[#1e3a8a] via-[#0f172a] to-black text-white shadow-[0_12px_30px_rgba(15,23,42,0.25)]":"border-slate-200 bg-white hover:bg-slate-50"}`,children:[e.jsx("span",{className:`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] ${v?"border-white/15 bg-white/10 text-white":`${o.colorClass} text-white`}`,children:e.jsx(u,{size:14})}),e.jsxs("span",{className:"min-w-0",children:[e.jsx("span",{className:`block text-sm font-semibold ${v?"text-white":"text-slate-900"}`,children:o.label}),e.jsx("span",{className:`mt-0.5 block text-[11px] leading-4 ${v?"text-slate-300":"text-slate-500"}`,children:o.description})]})]},o.key)})}),e.jsx(J,{initial:!1,mode:"wait",children:t==="EMAIL"?e.jsx(B.div,{initial:{opacity:0,height:0,y:-8},animate:{opacity:1,height:"auto",y:0},exit:{opacity:0,height:0,y:-8},transition:{duration:.22,ease:"easeOut"},className:"overflow-hidden",children:e.jsxs("div",{className:"mt-2.5",children:[e.jsxs("label",{className:"flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500",children:[e.jsx("span",{className:"flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#1e3a8a] text-white",children:e.jsx(R,{size:11})}),"Agent Email"]}),e.jsx("input",{type:"email",value:s,onChange:o=>d(o.target.value),placeholder:"Enter agent email",className:"mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"})]})},"send-email-input"):t==="WHATSAPP"?e.jsx(B.div,{initial:{opacity:0,height:0,y:-8},animate:{opacity:1,height:"auto",y:0},exit:{opacity:0,height:0,y:-8},transition:{duration:.22,ease:"easeOut"},className:"overflow-hidden",children:e.jsxs("div",{className:"mt-2.5",children:[e.jsxs("label",{className:"flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500",children:[e.jsx("span",{className:"flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#16a34a] text-white",children:e.jsx(F,{size:11})}),"WhatsApp Number"]}),e.jsx("input",{type:"tel",value:n,onChange:o=>c(o.target.value),placeholder:"Enter WhatsApp number",className:"mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"})]})},"send-whatsapp-input"):null}),e.jsx("div",{className:"mt-2.5 rounded-2xl border border-blue-100/70 bg-blue-50/20 px-4 py-3",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("span",{className:"mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-600",children:t==="EMAIL"?e.jsx("span",{className:"flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#1e3a8a] text-white",children:e.jsx(R,{size:12})}):t==="WHATSAPP"?e.jsx("span",{className:"flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#16a34a] text-white",children:e.jsx(F,{size:12})}):e.jsx("span",{className:"flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#f59e0b] text-white",children:e.jsx(V,{size:12})})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-slate-900",children:"What will happen"}),e.jsx("p",{className:"mt-1 text-[11px] leading-5 text-slate-500",children:t==="EMAIL"?"The travel voucher with all confirmed service information will be sent directly to the agent's email.":t==="WHATSAPP"?"WhatsApp will open with a ready-to-share message linking to the agent's online travel voucher.":"A clean travel voucher copy will be downloaded in HTML format for offline sharing."})]})]})}),e.jsxs("div",{className:"mt-3 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end",children:[e.jsx("button",{type:"button",onClick:h,className:"rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50",children:"Cancel"}),e.jsx("button",{type:"button",onClick:w,disabled:p,className:"rounded-full bg-gradient-to-br from-[#1e3a8a] via-[#0f172a] to-black px-6 py-2.5 text-sm font-semibold text-white transition hover:from-[#1d4ed8] hover:to-[#0f172a] disabled:cursor-not-allowed disabled:opacity-70 shadow-[0_4px_15px_rgba(30,58,138,0.25)]",children:p?t==="EMAIL"?"Sending...":"Preparing...":t==="EMAIL"?"Send Email":t==="WHATSAPP"?"Open WhatsApp":"Download"})]})]})]})}),de=({data:t,onClose:s,onSend:n,onDownload:l,mode:d="preview",loading:c=!1})=>{const[h,w]=g.useState({}),[p,f]=g.useState(!1),[o,u]=g.useState("EMAIL"),[v,j]=g.useState(t?.agentEmail||"agent@holidaycircuit.com"),[k,C]=g.useState(t?.agentPhone||"9876543210");g.useEffect(()=>{t&&(j(t.agentEmail||"agent@holidaycircuit.com"),C(t.agentPhone||"9876543210"))},[t]);const A=t?.voucherNumber||t?.query||"default",S=d==="view",b=h[A]??t?.branding??"with",$=g.useMemo(()=>ne(t?.services||[],t?.status==="sent"||S),[t?.services,t?.status,S]),P=g.useMemo(()=>`Voucher will ${b==="with"?"include":"not include"} branding`,[b]);if(!t)return null;const D=()=>{if(l){l(t,b);return}const i={name:t?.agentBrandingName||t?.agentName||"",logo:t?.agentLogo||""},r=O(t,b,i),a=new Blob([r],{type:"text/html;charset=utf-8"}),m=URL.createObjectURL(a),x=document.createElement("a");x.href=m,x.download=`${t.voucherNumber||t.query}-${b}.html`,document.body.appendChild(x),x.click(),x.remove(),URL.revokeObjectURL(m)},z=async()=>{if(o==="EMAIL"&&!String(v||"").trim()){alert("Please enter a valid email address");return}if(o==="WHATSAPP"&&!q(k)){alert("Please enter a valid phone number");return}try{if(n&&await n(b,o,v,k),o==="WHATSAPP"){const i=q(k);if(i){const r=`Hello ${t.agentName||"Agent"}, here is the voucher for your query ${t.query||t.voucherNumber}. Direct Link: ${window.location.origin}/voucher/${t.id}`,a=`https://wa.me/${i}?text=${encodeURIComponent(r)}`;window.open(a,"_blank","noopener,noreferrer")}}else o==="PDF"&&D();f(!1)}catch(i){console.error("Voucher dispatch confirm failed",i)}};return e.jsxs(e.Fragment,{children:[e.jsx("div",{className:`fixed inset-0 z-50 bg-black/60 backdrop-blur-[3px] ${p?"hidden":""}`,children:e.jsx("div",{className:"flex min-h-full items-center justify-center px-3 py-2",children:e.jsxs("div",{onClick:i=>i.stopPropagation(),className:"flex max-h-[94vh] w-full max-w-[445px] flex-col overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-2xl animate-scaleIn",children:[e.jsx("div",{className:"border-b border-gray-200 px-4 py-3",children:e.jsxs("div",{className:"flex items-start justify-between gap-4",children:[e.jsxs("div",{children:[e.jsxs("h2",{className:"text-[14px] font-semibold text-gray-900",children:["Voucher Preview - ",t.query]}),e.jsxs("p",{className:"text-[10px] text-gray-500",children:["Review and ",d==="send"?"send":"download"," the voucher for ",t.name,"."]})]}),e.jsx("button",{type:"button",onClick:s,className:"rounded-full p-1.5 text-red-600 transition hover:bg-red-50",children:e.jsx(Y,{size:16})})]})}),e.jsxs("div",{className:"custom-scroll flex-1 overflow-y-auto px-4 py-3",children:[e.jsxs("div",{className:"rounded-[18px] bg-gradient-to-r from-blue-600 to-blue-800 py-4 text-center text-white",children:[e.jsx("h1",{className:"text-base font-semibold",children:b==="with"?t?.agentBrandingName||t?.agentName||"Holiday Circuit":"Travel Voucher"}),e.jsx("p",{className:"mt-1 text-[10px]",children:b==="with"?"Travel Voucher":"Clean Voucher Copy"}),e.jsxs("div",{className:"mt-2 inline-block rounded-xl bg-white/20 px-6 py-1.5",children:[e.jsx("p",{className:"text-[10px]",children:"Voucher No."}),e.jsx("p",{className:"text-xs font-semibold",children:t.voucherNumber||t.query})]})]}),e.jsxs("div",{className:"mt-3 grid grid-cols-2 gap-2.5 text-[11px]",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-gray-500",children:"Guest Name"}),e.jsx("p",{className:"font-medium text-gray-900",children:t.name||"-"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-gray-500",children:"Passengers"}),e.jsx("p",{className:"font-medium text-gray-900",children:t.passengers||"-"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-gray-500",children:"Destination"}),e.jsx("p",{className:"font-medium text-gray-900",children:t.destination||"-"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-gray-500",children:"Duration"}),e.jsx("p",{className:"font-medium text-gray-900",children:t.duration||"-"})]})]}),e.jsxs("div",{className:"mt-3",children:[e.jsx("h3",{className:"mb-2 text-sm font-semibold text-gray-900",children:"Service Details"}),e.jsx("div",{className:"space-y-2",children:(t.services||[]).map((i,r)=>e.jsxs("div",{className:"rounded-[14px] border border-gray-200 bg-sky-50 px-3 py-2.5",children:[e.jsx("p",{className:"mb-1 text-sm font-medium text-gray-900",children:X(i.type)}),e.jsxs("div",{className:"flex justify-between gap-3 text-[11px]",children:[e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsx("p",{className:"text-gray-500",children:"Service"}),e.jsx("p",{className:"truncate text-gray-900",children:i.title||i.name||"Service missing"})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("p",{className:"text-gray-500",children:"Confirmation"}),e.jsxs("p",{className:"text-gray-900",children:[i.confirmation||"Pending",i.status?` (${i.status})`:""]})]})]})]},r))})]}),e.jsxs("div",{className:"mt-3",children:[e.jsx("h3",{className:"mb-2 text-sm font-semibold text-gray-900",children:"Template Options"}),e.jsxs("label",{className:`mb-2 flex items-start gap-2 rounded-[14px] border border-gray-200 bg-white p-2.5 ${S?"opacity-70":"cursor-pointer"}`,children:[e.jsx("input",{type:"radio",name:"branding",checked:b==="with",onChange:()=>w(i=>({...i,[A]:"with"})),disabled:S}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-medium text-gray-900",children:"With Branding"}),e.jsx("p",{className:"text-[10px] text-gray-500",children:"Include company logo and branded header"})]})]}),e.jsxs("label",{className:`flex items-start gap-2 rounded-[14px] border border-gray-200 bg-white p-2.5 ${S?"opacity-70":"cursor-pointer"}`,children:[e.jsx("input",{type:"radio",name:"branding",checked:b==="without",onChange:()=>w(i=>({...i,[A]:"without"})),disabled:S}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-medium text-gray-900",children:"Without Branding"}),e.jsx("p",{className:"text-[10px] text-gray-500",children:"Clean version for agent-facing share"})]})]})]})]}),e.jsxs("div",{className:"border-t border-gray-200 bg-white px-4 py-3",children:[e.jsx("p",{className:"text-[10px] text-gray-500",children:P}),e.jsxs("div",{className:"mt-2 flex gap-2",children:[e.jsx("button",{onClick:s,className:"flex-1 rounded-[12px] border border-gray-300 bg-white px-4 py-2 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-100",children:"Close"}),d==="send"?e.jsxs("button",{onClick:()=>f(!0),disabled:c||!$.canSend,className:"flex flex-1 items-center justify-center gap-1 rounded-[12px] bg-green-600 px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-green-700 disabled:opacity-60",children:[e.jsx(U,{size:13}),c?"Sending...":$.canSend?"Send to Agent":"Blocked"]}):e.jsxs("button",{onClick:D,className:"flex flex-1 items-center justify-center gap-1 rounded-[12px] bg-green-600 px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-green-700",children:[e.jsx(V,{size:13}),"Download"]})]})]})]})})}),e.jsx(J,{children:p&&e.jsx(le,{selectedChannel:o,recipientEmail:v,recipientPhone:k,onSelectChannel:u,onEmailChange:j,onPhoneChange:C,onClose:()=>f(!1),onConfirm:z,isSubmitting:c,agentName:t.agentName})})]})},ce=t=>{if(!t)return"-";const s=new Date(t);return Number.isNaN(s.getTime())?t:s.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})};function Ne(){const[t,s]=g.useState(!1),[n,l]=g.useState(null),[d,c]=g.useState("preview"),[h,w]=g.useState([]),[p,f]=g.useState({ready:0,generated:0,sent:0}),[o,u]=g.useState(""),[v,j]=g.useState(!1),[k,C]=g.useState(!1),A=async()=>{try{j(!0);const{data:r}=await M.get("/ops/vouchers");w(r.vouchers||[]),f(r.stats||{ready:0,generated:0,sent:0})}catch(r){console.error("Failed to fetch vouchers",r),T.error("Failed to fetch vouchers")}finally{j(!1)}};g.useEffect(()=>{A()},[]);const S=h.filter(r=>{const a=o.toLowerCase();return r.query?.toLowerCase().includes(a)||r.name?.toLowerCase().includes(a)||r.agentName?.toLowerCase().includes(a)||r.destination?.toLowerCase().includes(a)}),b=async r=>{try{const{data:a}=await M.patch(`/ops/vouchers/${r}/generate`);T.success(a?.message||"Voucher generated successfully"),await A()}catch(a){console.error("Failed to generate voucher",a),T.error(a?.response?.data?.message||"Failed to generate voucher")}},$=async(r,a="with",m="EMAIL",x="",N="")=>{try{C(!0);const{data:y}=await M.patch(`/ops/vouchers/${r}/send`,{branding:a,dispatchChannel:m,email:x,phone:N});T.success(y?.message||"Voucher sent successfully"),s(!1),await A()}catch(y){console.error("Failed to send voucher",y),T.error(y?.response?.data?.message||"Failed to send voucher")}finally{C(!1)}},P=(r,a="preview")=>{l(r),c(a),s(!0)},D=(r,a="with")=>{try{const m={name:r.agentBrandingName||r.agentName||"",logo:r.agentLogo||""},x=O(r,a,m),N=new Blob([x],{type:"text/html;charset=utf-8"}),y=URL.createObjectURL(N),E=document.createElement("a");E.href=y,E.download=`${r.voucherNumber||r.query||"voucher"}-${a}.html`,document.body.appendChild(E),E.click(),setTimeout(()=>{document.body.contains(E)&&document.body.removeChild(E),URL.revokeObjectURL(y)},5e3)}catch(m){console.error("Failed to download voucher",m),T.error("Failed to generate voucher download file")}},z=()=>{const r=S.filter(a=>a.status==="generated"||a.status==="sent"||a.voucherNumber);if(r.length===0){T.error("No generated vouchers found to download in bulk.");return}T.success(`Downloading ${r.length} voucher(s) in bulk...`);try{const a=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bulk Travel Vouchers (${r.length} Vouchers)</title>
  <style>
    @media print {
      .voucher-page { page-break-after: always; page-break-inside: avoid; }
    }
    .voucher-page { margin-bottom: 50px; }
  </style>
</head>
<body>
  ${r.map(y=>{const E={name:y.agentBrandingName||y.agentName||"",logo:y.agentLogo||""},H=O(y,y.branding||"with",E),W=H.match(/<body[^>]*>([\s\S]*)<\/body>/i);return`<div class="voucher-page">${W?W[1]:H}</div>`}).join(`
`)}
</body>
</html>`,m=new Blob([a],{type:"text/html;charset=utf-8"}),x=URL.createObjectURL(m),N=document.createElement("a");N.href=x,N.download=`Bulk-Vouchers-All-${r.length}-Items.html`,document.body.appendChild(N),N.click(),setTimeout(()=>{document.body.contains(N)&&document.body.removeChild(N),URL.revokeObjectURL(x)},5e3)}catch(a){console.error("Bulk master file generation error:",a)}r.forEach((a,m)=>{setTimeout(()=>{D(a,a.branding||"with")},(m+1)*300)})},i=h.filter(r=>r.status==="generated"||r.status==="sent"||r.voucherNumber).length;return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"bg-gray-50 min-h-screen",children:[e.jsxs("div",{className:"flex justify-between items-start mb-6",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-xl font-semibold text-gray-900",children:"Voucher Management"}),e.jsx("p",{className:"text-sm text-gray-500",children:"Generate and manage travel vouchers for confirmed bookings"})]}),e.jsxs("button",{onClick:z,className:"flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 hover:shadow-md hover:shadow-emerald-500/10 transition-all duration-300 text-white px-4 py-2 rounded-full text-sm font-semibold cursor-pointer active:scale-95",children:[e.jsx(V,{size:16}),"Bulk Download ",i>0?`(${i})`:""]})]}),e.jsxs("div",{className:"grid grid-cols-3 gap-4 mb-6",children:[e.jsx(I,{title:"Ready to Generate",count:p.ready,type:"ready"}),e.jsx(I,{title:"Generated",count:p.generated,type:"generated"}),e.jsx(I,{title:"Sent to Agents",count:p.sent,type:"sent"})]}),e.jsxs("div",{className:"relative mb-6 border border-gray-200 rounded-2xl shadow-sm p-4",children:[e.jsx(K,{className:"absolute left-8 top-7 text-gray-400",size:16}),e.jsx("input",{value:o,onChange:r=>u(r.target.value),className:"w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none",placeholder:"Search by Query ID, Guest Name, or Agent..."})]}),v?e.jsx("div",{className:"text-sm text-gray-500",children:"Loading vouchers..."}):e.jsx("div",{className:"space-y-6",children:S.map(r=>e.jsx(me,{id:r.id,status:r.status,query:r.query,voucherNumber:r.voucherNumber,name:r.name,destination:r.destination,date:r.date,travelDate:r.travelDate,duration:r.duration,passengers:r.passengers,adults:r.adults,children:r.children,travelerSummary:r.travelerSummary,services:r.services||[],branding:r.branding||"with",agentName:r.agentName,agentEmail:r.agentEmail,agentPhone:r.agentPhone,invoicePaymentStatus:r.invoicePaymentStatus,paymentVerificationStatus:r.paymentVerificationStatus,canSendVoucher:r.canSendVoucher,onPreview:P,onGenerate:b},r.id))})]}),t&&e.jsx(de,{data:n,mode:d,loading:k,onSend:(r,a,m,x)=>$(n.id,r,a,m,x),onDownload:D,onClose:()=>s(!1)})]})}function I({title:t,count:s,type:n}){const l={ready:{card:"bg-gradient-to-br from-orange-50/80 via-white to-white hover:from-orange-100/40 hover:via-orange-50/10 hover:to-white border-orange-100 border-b-orange-500 shadow-sm shadow-orange-500/5",iconWrap:"bg-orange-100 text-orange-600 border border-orange-200/50"},generated:{card:"bg-gradient-to-br from-blue-50/80 via-white to-white hover:from-blue-100/40 hover:via-blue-50/10 hover:to-white border-blue-100 border-b-blue-500 shadow-sm shadow-blue-500/5",iconWrap:"bg-blue-100 text-blue-600 border border-blue-200/50"},sent:{card:"bg-gradient-to-br from-green-50/80 via-white to-white hover:from-green-100/40 hover:via-green-50/10 hover:to-white border-green-100 border-b-green-500 shadow-sm shadow-green-500/5",iconWrap:"bg-green-100 text-green-600 border border-green-200/50"}}[n]||{card:"bg-white border-gray-200 border-b-gray-400",iconWrap:"bg-gray-100 text-gray-600"};return e.jsxs("div",{className:`border border-b-4 rounded-xl p-4 flex justify-between items-center hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-out ${l.card}`,children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium text-gray-500",children:t}),e.jsx("h2",{className:"text-2xl font-bold text-gray-800 mt-1",children:s})]}),e.jsx("div",{className:`p-3 rounded-lg ${l.iconWrap}`,children:e.jsx(L,{size:18})})]})}function me({id:t,status:s,query:n,voucherNumber:l,name:d,destination:c,date:h,travelDate:w,duration:p,passengers:f,adults:o,children:u,travelerSummary:v,services:j,branding:k,agentName:C,agentEmail:A,agentPhone:S,invoicePaymentStatus:b,paymentVerificationStatus:$,canSendVoucher:P,onPreview:D,onGenerate:z}){const i={ready:{label:"Ready to Generate",badge:"bg-amber-100/90 text-amber-900 border border-amber-300/80 font-bold",icon:e.jsx(L,{size:12,className:"text-amber-700"}),cardBg:"bg-gradient-to-br from-amber-100/70 via-orange-50/40 to-white border-amber-200/90 hover:border-amber-300 shadow-2xs"},generated:{label:"Generated",badge:"bg-indigo-100/90 text-indigo-900 border border-indigo-300/80 font-bold",icon:e.jsx(L,{size:12,className:"text-indigo-700"}),cardBg:"bg-gradient-to-br from-indigo-100/70 via-purple-50/40 to-white border-indigo-200/90 hover:border-indigo-300 shadow-2xs"},sent:{label:"Sent to Agent",badge:"bg-emerald-100/90 text-emerald-900 border border-emerald-300/80 font-bold",icon:e.jsx(G,{size:12,className:"text-emerald-700"}),cardBg:"bg-gradient-to-br from-emerald-100/70 via-teal-50/40 to-white border-emerald-200/90 hover:border-emerald-300 shadow-2xs"}},r={id:t,query:n,voucherNumber:l,name:d,destination:c,date:h,travelDate:w,duration:p,passengers:f,adults:o,children:u,travelerSummary:v,services:j,branding:k,agentName:C,agentEmail:A,agentPhone:S,invoicePaymentStatus:b,paymentVerificationStatus:$,canSendVoucher:P},a=!!P;return e.jsxs("div",{className:`border rounded-2xl p-5 md:p-6 flex flex-col gap-4.5 transition-all duration-300 ${i[s].cardBg}`,children:[e.jsxs("div",{className:"flex justify-between items-center flex-wrap gap-2",children:[e.jsxs("div",{className:"flex gap-3 items-center",children:[e.jsx("h3",{className:"font-extrabold text-slate-900 text-xl tracking-tight font-sans",children:n}),e.jsxs("span",{className:`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${i[s].badge}`,children:[i[s].icon,i[s].label]})]}),s==="sent"&&e.jsxs("div",{className:"flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300/70 px-3 py-1 rounded-full shadow-2xs",children:[e.jsx(G,{size:13,className:"text-emerald-600"}),"Synced to Agent Portal"]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2.5 text-xs",children:[e.jsxs("div",{className:"flex items-center gap-1.5 rounded-xl bg-white/90 border border-slate-200/80 px-3.5 py-1.5 font-bold text-slate-800 shadow-2xs",children:[e.jsx(Q,{size:13,className:"text-indigo-600 shrink-0"}),e.jsx("span",{children:d})]}),e.jsxs("div",{className:"flex items-center gap-1.5 rounded-xl bg-white/90 border border-slate-200/80 px-3.5 py-1.5 font-bold text-slate-800 shadow-2xs",children:[e.jsx(Z,{size:13,className:"text-purple-600 shrink-0"}),e.jsx("span",{children:c})]}),e.jsxs("div",{className:"flex items-center gap-1.5 rounded-xl bg-white/90 border border-slate-200/80 px-3.5 py-1.5 font-bold text-slate-800 shadow-2xs",children:[e.jsx(ee,{size:13,className:"text-orange-600 shrink-0"}),e.jsx("span",{children:ce(h)})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-start gap-2.5 border-t border-slate-200/70 pt-3.5",children:[e.jsxs("div",{className:"flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 min-w-[95px] pt-1",children:[e.jsx(te,{size:13,className:"text-indigo-600 shrink-0"}),e.jsx("span",{children:"Services:"})]}),e.jsx("div",{className:"flex flex-wrap gap-2 flex-1",children:(j||[]).map((m,x)=>{const N=typeof m=="string"?m:m.title||m.name||"Service missing";return e.jsxs("div",{className:"inline-flex items-center gap-1.5 bg-white/95 border border-slate-200/90 text-slate-800 text-xs px-3 py-1.5 rounded-full font-semibold shadow-2xs transition hover:border-indigo-300 hover:bg-indigo-50/40",children:[e.jsx("span",{className:"flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700",children:x+1}),e.jsx("span",{children:N})]},x)})})]}),e.jsxs("div",{className:"mt-1 flex flex-wrap gap-2.5 border-t border-slate-200/70 pt-4",children:[s==="ready"&&e.jsxs("button",{onClick:()=>z(t),className:"bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-indigo-950 hover:via-slate-900 hover:to-slate-950 text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95",children:[e.jsx(L,{size:15}),"Generate Voucher"]}),s==="generated"&&e.jsxs(e.Fragment,{children:[e.jsxs("button",{onClick:()=>D(r,"preview"),className:"flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-5 py-2.5 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95",children:[e.jsx(_,{size:14}),"Preview"]}),e.jsxs("button",{onClick:()=>D(r,"send"),disabled:!a,title:a?"Send voucher to agent":"Payment must be verified before sending the voucher",className:`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 ${a?"bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xs cursor-pointer":"cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200"}`,children:[e.jsx(U,{size:14}),a?"Send to Agent":"Awaiting Verification"]})]}),s==="sent"&&e.jsx(e.Fragment,{children:e.jsxs("button",{onClick:()=>D(r,"view"),className:"flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-5 py-2.5 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95",children:[e.jsx(_,{size:14}),"View"]})})]})]})}export{Ne as default};
