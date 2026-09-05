import{r as v,j as e,X as ze,F as me,v as Me,A as Be,k as ge,m as je,M as Ce,z as ee,s as Le}from"./index-DWOrYxdh.js";import{S as Te}from"./send-Cev2F9hz.js";import{D as fe}from"./download-Cg5Py3pi.js";import{M as De}from"./message-circle-CkLPkq8b.js";import{S as Ve}from"./search-D2M5mamR.js";import{U as He}from"./user-5Ziw-bwP.js";import{M as Fe}from"./map-pin-BX--tnLr.js";import{C as Ue}from"./calendar-DQdWssm_.js";import{P as We}from"./package-DZszUieg.js";import{E as Pe}from"./eye-AEN6oZEU.js";const Ge="https://res.cloudinary.com/dszadvuz6/image/upload/e_trim/v1777932524/unzssx1sjkrigbgldg7h.png",Ye=["Welcome to Holiday Circuit. These Terms and Conditions govern your use of the Holiday Circuit services. When You Make a booking or reservation, you agree to be bound by these Terms.","Bookings and Reservations","Booking Process: When you make a booking or reservation through Holiday Circuit, you agree to provide accurate and complete information. Any discrepancies or errors in the information you provide may result in the cancellation of your booking.","Payment: Payments for bookings are due as specified during the booking process. Failure to make payments on time may result in the cancellation of your booking.","Cancellations and Refunds: Cancellation and refund policies vary depending on the type of booking. Please refer to the specific cancellation policy provided at the time of booking. Holiday Circuit reserves the right to charge cancellation fees as applicable.","Intellectual Property","Ownership: All content, trademarks, logos, and intellectual property on the Holiday Circuit website and app are the property of Holiday Circuit or its licensors. You may not use, reproduce, or distribute our content without prior written permission.","Changes to Terms and Conditions: We reserve the right to update and modify these Terms and Conditions at any time. Please review them periodically for changes. Your continued use of our services after any modifications indicates your acceptance of the updated Terms.","By booking with Holiday Circuit, you acknowledge that you have read, understood, and agreed to these Terms and Conditions."],_e=(r="")=>{const o=String(r||"").trim().toLowerCase();return o?o==="hotel"?"Hotel":o==="transfer"||o==="transport"||o==="car"?"Transport":o==="activity"?"Activity":o==="sightseeing"?"Sightseeing":o==="flight"?"Flight":o.replace(/\b\w/g,p=>p.toUpperCase()):"Service"},Ke=(r=[],o=!1)=>{const p=(r||[]).filter(N=>!String(N?.title||N?.name||"").trim()),b=(r||[]).filter(N=>{const f=String(N?.confirmation||"").trim().toLowerCase();return!f||f==="pending"});return r.length?p.length&&b.length?{tone:"red",title:"Services And Confirmations Missing",message:"Some voucher services are missing and some DMC confirmation numbers are still pending. Client sharing will stay blocked until both are complete.",canSend:!1}:p.length?{tone:"red",title:"Service Details Missing",message:"Some voucher services are missing. Complete all service names before sending the voucher to the client.",canSend:!1}:b.length?{tone:"red",title:"DMC Confirmation Pending",message:"Some DMC confirmation numbers are still pending. Client sharing will stay blocked until all confirmations are updated.",canSend:!1}:o?{tone:"green",title:"Voucher Already Shared",message:"This voucher has already been sent successfully. You can review or download the final shared copy here.",canSend:!1}:{tone:"green",title:"Client Ready To Send",message:"All services and DMC confirmation numbers are available. This voucher is ready to share with the client.",canSend:!0}:{tone:"red",title:"Voucher Services Missing",message:"No services are mapped in this voucher yet. Add services before sending it to the client.",canSend:!1}},Ae=(r,o,p={})=>{const b=o==="with",N=r?.travelDate||r?.startDate||r?.date||null,f=String(r?.voucherFooterImage||r?.footerBanner||r?.pdfFooterImage||r?.agentFooterImage||"").trim(),T=(t,g="Holiday Circuit")=>{const h=String(t||"").trim();return h||g},k=String(p?.name||p?.brandingName||p?.companyName||r?.agentName||r?.agencyName||"").trim(),w=k?T(k,"Holiday Circuit"):"",R=!w||w.toLowerCase()==="holiday circuit",x=R?"":String(p?.logo||r?.agentLogo||"").trim(),V=b&&!R&&!!(x||w),S=t=>{if(!t||isNaN(new Date(t).getTime()))return"-";const g=new Date(t),h=g.getDate(),$=g.toLocaleString("en-US",{month:"short"}),D=g.getFullYear();let j="th";return h%10===1&&h!==11?j="st":h%10===2&&h!==12?j="nd":h%10===3&&h!==13&&(j="rd"),`${h}${j} ${$}, ${D}`},H=t=>{if(!t||isNaN(new Date(t).getTime()))return"-";const g=new Date(t),h=g.getDate(),$=g.toLocaleString("en-US",{month:"short"}),D=g.getFullYear();return`${h} ${$}, ${D}`},K=t=>{let g=String(t).replace(/\(.*?\)/g,"").trim();return g=g.replace(/^(standard|deluxe|executive|superior|suite|family|classic)\s*room$/i,"$1 Room"),g||"Standard Room"},q=(t={})=>{const g=[t.mealPlan,t.meal_plan,t.meal,t.meals,t.mealType].filter(j=>typeof j=="string"&&j.trim().length>0);for(const j of g){const l=j.trim().toUpperCase();if(l==="EP"||l.includes("ROOM ONLY")||l.includes("ONLY ROOM")||l.includes("NO MEAL"))return"EP ( Room Only )";if(l==="MAP"||l.includes("HALF BOARD")||l.includes("BREAKFAST & DINNER")||l.includes("BREAKFAST AND DINNER")||l.includes("BREAKFAST + DINNER"))return"MAP ( Breakfast & Dinner Included )";if(l==="AP"||l.includes("FULL BOARD")||l.includes("ALL MEAL"))return"AP ( Breakfast, Lunch & Dinner Included )";if(l==="AI"||l.includes("ALL INCLUSIVE"))return"AI ( All Inclusive )";if(l==="CP"||l.includes("BREAKFAST")||l.includes("BED & BREAKFAST")||l.includes("B&B"))return"CP ( Breakfast Included )"}const h=[t.description,t.roomDescription,t.hotelDescription,t.roomType,t.roomCategory,t.inclusions,t.notes].filter(Boolean);for(const j of h){const l=String(j).split("|").map(c=>c.trim().toUpperCase());for(const c of l){if(c==="EP"||c==="ROOM ONLY"||c==="ONLY ROOM"||c==="NO MEALS"||c==="NO MEAL")return"EP ( Room Only )";if(c==="MAP"||c==="HALF BOARD"||c==="BREAKFAST & DINNER"||c==="BREAKFAST AND DINNER"||c==="BREAKFAST + DINNER")return"MAP ( Breakfast & Dinner Included )";if(c==="AP"||c==="FULL BOARD"||c==="ALL MEALS"||c==="ALL MEAL")return"AP ( Breakfast, Lunch & Dinner Included )";if(c==="AI"||c==="ALL INCLUSIVE")return"AI ( All Inclusive )";if(c==="CP"||c==="BREAKFAST INCLUDED"||c==="BREAKFAST"||c==="BED & BREAKFAST"||c==="B&B")return"CP ( Breakfast Included )"}}const $=h.join(" ");if(/\b(EP|ROOM\s*ONLY|ONLY\s*ROOM|EUROPEAN\s*PLAN|NO\s*MEALS?)\b/i.test($))return"EP ( Room Only )";if(/\b(MAP|HALF\s*BOARD|BREAKFAST\s*(?:AND|&|\+)\s*DINNER)\b/i.test($))return"MAP ( Breakfast & Dinner Included )";if(/\b(AP|FULL\s*BOARD|ALL\s*MEALS?)\b/i.test($))return"AP ( Breakfast, Lunch & Dinner Included )";if(/\b(AI|ALL\s*INCLUSIVE)\b/i.test($))return"AI ( All Inclusive )";if(/\b(CP|BREAKFAST(?:\s*INCLUDED)?|BED\s*&\s*BREAKFAST)\b/i.test($))return"CP ( Breakfast Included )";const D=g[0]||t.description||t.roomType||"";return D.trim()?D.trim():"As per hotel policy"},u=N?new Date(N):new Date,F=isNaN(u.getTime())?"22nd Dec, 2026":S(u),Q=isNaN(u.getTime())?"22 Dec, 2026":H(u),L=Number(r?.nights||r?.numberOfNights||4),X=Number(r?.days||r?.numberOfDays||L+1),U=r?.endDate?new Date(r.endDate):new Date(u.getTime()+L*864e5),J=isNaN(U.getTime())?"26th Dec, 2026":S(U),O=r?.queryId||r?.tripId||r?.query||r?.queryNumber||r?.quotationNumber;let i="QRY-4304633";if(O){const t=String(O).replace(/^#\s*/,"").trim();i=t.toUpperCase().startsWith("QRY-")?t.toUpperCase():`QRY-${t}`}else if(r?.voucherNumber){const t=String(r.voucherNumber).replace(/^VCH-?/i,"").trim();i=t?`QRY-${t}`:"QRY-001"}const n=r?.destination||"India",m=r?.duration||`${L} Night${L>1?"s":""} / ${X} Days`,C=r?.name||r?.guestName||r?.clientName||r?.leadTraveler||"Valued Client",d=r?.clientPhone||r?.guestPhone||r?.phone||"",I=!d||String(d).includes("8287725270")||String(d).trim()===""||String(d).trim()==="-"?"-":String(d).trim(),E=r?.passengers||r?.travelerSummary||`${r?.adults||2} Adults${Number(r?.children||0)>0?`, ${r.children} Children`:""}`,s=w||"Holiday Circuit",y=r?.issuedBy||r?.agencyName||w||"Holiday Circuit",Z=y.toLowerCase().includes("user")||y.toLowerCase().includes("guest")?s:T(y,s),te=r?.agencyPhone||"+91-8851346665",W=Array.isArray(r?.services)&&r.services.length>0?r.services:[],G=W.filter(t=>String(t.type||t.category||"").toLowerCase().includes("hotel")),ue=W.filter(t=>!String(t.type||t.category||"").toLowerCase().includes("hotel")),se=G;let $e=u&&!isNaN(u.getTime())?new Date(u.getTime()):new Date;const Oe=se.length>0?se.map((t,g)=>{const h=String(t.title||"").trim(),$=String(t.hotelName||t.hotel||"").trim(),D=String(t.serviceName||t.name||"").trim(),j=$||(h&&!h.toLowerCase().includes("hotel stay")&&!h.toLowerCase().includes("service")?h:D||"Hotel Accommodation"),l=D&&D!==j?D:h&&h!==j?h:"",c=t.rating||t.starRating||t.hotelCategory||t.category||"",xe=t.address||t.hotelAddress||t.location||(t.city?`${t.city}, ${n}`:`${n}, India`),le=t.description||t.hotelDescription||t.details||"",P=t.confirmationNumber||t.cnfNumber||t.supplierConfirmation||t.voucherNumber||(t.confirmation&&t.confirmation!=="Confirmed(Confirmed)"&&t.confirmation!=="Confirmed"&&t.confirmation!=="Pending"?t.confirmation:null),z=!!(P||t.status&&String(t.status).toLowerCase()==="confirmed"||t.confirmation&&!String(t.confirmation).toLowerCase().includes("pending")||t.isVoucherGenerated),Y=z?"Confirmed":"Pending",re=P?String(P).trim():z?"Confirmed":"Pending",_=Number(t.nights||t.numberOfNights||(se.length>1?2:L)||2);let A;t.checkIn?A=new Date(t.checkIn):t.startDate&&g===0?A=new Date(t.startDate):t.startDate&&t.startDate!==r?.startDate&&t.startDate!==r?.travelDate?A=new Date(t.startDate):g>0?A=new Date($e.getTime()):A=u&&!isNaN(u.getTime())?u:new Date;let B;t.checkOut?B=new Date(t.checkOut):t.endDate&&g===se.length-1&&se.length===1?B=new Date(t.endDate):t.endDate&&t.endDate!==r?.endDate?B=new Date(t.endDate):B=new Date(A.getTime()+_*864e5),$e=new Date(B.getTime());const ie=A&&!isNaN(A.getTime())?S(A):F,de=A&&!isNaN(A.getTime())?H(A):Q,he=t.checkInTime||"14:00 hrs",ce=B&&!isNaN(B.getTime())?S(B):J,be=t.checkOutTime||"12:00 hrs",pe=q(t),ye=`${de} (${_>1?`${_} Nights`:"1 Night"}) - ${pe}`,ve=t.roomType||t.roomCategory||"Standard Room",we=K(ve),Ne=`${t.numberOfRooms||t.rooms||1} x ${we}`,a=t.pax||E||"2 Adults",ke=t.roomDescription||t.roomDetails||"";return`
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; border: 1px solid #b3cae8; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #dce8f6;">
            <th colspan="2" style="padding: 9px 14px; font-size: 13px; font-weight: 800; color: #000000; text-align: left; border: 1px solid #b3cae8; letter-spacing: 0.2px;">
              Hotel
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="2" style="padding: 14px; background-color: #ffffff; border: 1px solid #b3cae8;">
              <div style="font-size: 15px; font-weight: 800; color: #000000; margin-bottom: 2px; line-height: 1.3;">
                ${j}
              </div>
              ${l?`<div style="font-size: 12px; font-weight: 700; color: #2B5083; margin-bottom: 3px;">Service: ${l}</div>`:""}
              <div style="font-size: 12px; color: #334155; margin-bottom: 3px;">
                ${c}
              </div>
              <div style="font-size: 12px; color: #1e293b; line-height: 1.4; margin-bottom: ${le?"6px":"12px"};">
                ${xe}
              </div>
              ${le?`<div style="font-size: 11px; color: #475569; line-height: 1.4; margin-bottom: 12px;">${le}</div>`:""}
              <div style="font-size: 13px; font-weight: 800; color: #713f12; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-bottom: 12px;">
                Confirmation: ${re} <span style="font-style: italic; font-size: 12px; color: ${Y==="Confirmed"?"#15803d":"#e11d48"}; font-weight: 700; margin-left: 6px;">( ${Y} )</span>
              </div>

              <!-- CHECK-IN & CHECK-OUT HIGHLIGHT BOX -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #b3cae8;">
                <tr>
                  <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                    Check-in
                  </td>
                  <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                    <strong style="color: #000000;">${ie}</strong> <span style="font-style: italic; font-size: 11px; color: #334155;">at ${he}</span>
                  </td>
                  <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                    Check-out
                  </td>
                  <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                    <strong style="color: #000000;">${ce} ( ${_} Night${_>1?"s":""} )</strong> <span style="font-style: italic; font-size: 11px; color: #334155;">at ${be}</span> <span style="font-style: italic; font-size: 11px; color: ${Y==="Confirmed"?"#15803d":"#e11d48"}; font-weight: 700; margin-left: 4px;">( ${Y} )</span>
                  </td>
                </tr>
              </table>

              <!-- NIGHT AND MEALS & ROOM TYPE SUB-TABLE -->
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #b3cae8;">
                <thead>
                  <tr style="background-color: #dce8f6;">
                    <th style="width: 55%; padding: 8px 12px; font-size: 13px; font-weight: 700; color: #000000; text-align: left; border: 1px solid #b3cae8;">
                      Night and Meals
                    </th>
                    <th style="width: 45%; padding: 8px 12px; font-size: 13px; font-weight: 700; color: #000000; text-align: left; border: 1px solid #b3cae8;">
                      Room Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                      <div style="font-weight: 600; color: #000000;">${ye}</div>
                      ${t.mealDescription?`<div style="font-size: 11px; color: #475569; margin-top: 4px;">${t.mealDescription}</div>`:""}
                    </td>
                    <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                      <div style="font-weight: 700; color: #000000;">${Ne}</div>
                      <div style="font-size: 11px; color: #475569; margin-top: 4px;">${a}</div>
                      ${ke?`<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${ke}</div>`:""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    `}).join(""):'<div style="padding: 16px 20px; text-align: center; color: #64748b; font-style: italic; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; margin-bottom: 20px; font-size: 13px;">No specific hotel accommodations listed for this voucher.</div>',Ie=ue.map(t=>{const g=String(t.type||t.category||"Service").toLowerCase(),h=t.title||t.name||t.serviceName||`${n} Service`,$=t.description||t.details||t.notes||"",D=g.includes("transfer")||g.includes("transport")||g.includes("cab")||g.includes("car"),j=String(t.usageType||t.transferType||t.tripType||t.serviceMode||t.direction||"").trim();let l="";if(j){const a=j.toLowerCase();a.includes("point")||a.includes("oneway")||a.includes("one-way")||a.includes("one way")?l="One Way (Point to Point)":a.includes("round")?l="Round Trip":a.includes("full")||a.includes("day")?l="Full Day Disposal":a.includes("half")?l="Half Day Disposal":a.includes("pickup")||a.includes("pick-up")?l="Airport / Station Pickup":a.includes("drop")?l="Airport / Station Drop":l=j}else{const a=String(h||"").toLowerCase();a.includes("round trip")||a.includes("round-trip")?l="Round Trip":a.includes("disposal")||a.includes("full day")?l="Full Day Disposal":a.includes("half day")?l="Half Day Disposal":l="One Way Transfer"}const c=t.vehicleType||t.carType||t.vehicle||(D?"Private AC Vehicle":"Standard Vehicle"),xe=t.vehicleCount||t.numberOfVehicles||t.quantity||1,le=`${xe>1?`${xe} x `:""}${c}`;let P=t.passengerCapacity||t.maxPassengers||t.maxPax||t.seatingCapacity||t.seats||t.paxCapacity||null,z=t.luggageCapacity||t.maxLuggage||t.luggage||t.baggageCapacity||t.bags||null;if(!P&&D){const a=String(c).toLowerCase();a.includes("sedan")||a.includes("etios")||a.includes("dzire")||a.includes("car")?P="Max 4 Pax":a.includes("innova")||a.includes("suv")||a.includes("ertiga")||a.includes("crysta")?P="Max 6 Pax":a.includes("tempo")||a.includes("van")||a.includes("minivan")?P="Max 12 Pax":a.includes("coach")||a.includes("bus")?P="Max 25 Pax":P="Max 4 Pax"}else P&&!String(P).toLowerCase().includes("pax")&&(P=`Max ${P} Pax`);if(!z&&D){const a=String(c).toLowerCase();a.includes("sedan")||a.includes("etios")||a.includes("dzire")||a.includes("car")?z="2 Bags":a.includes("innova")||a.includes("suv")||a.includes("ertiga")||a.includes("crysta")?z="4 Bags":a.includes("tempo")||a.includes("van")||a.includes("minivan")?z="8 Bags":a.includes("coach")||a.includes("bus")?z="20 Bags":z="2-3 Bags"}else z&&!String(z).toLowerCase().includes("bag")&&(z=`${z} Bags`);let Y="Service",re="Service Date",_="Service Type",A=t.transferType||t.vehicleType||t.category||"Standard Service",B="Service Details",ie="Pax / Vehicle Details";D?(Y="Transfer",re="Transfer Date",_="Vehicle & Trip",A=`${c} (${l})`,B="Transfer Description & Route",ie="Vehicle & Capacity Details"):g.includes("activity")?(Y="Activity",re="Activity Date",_="Timing / Duration",A=t.timing||t.duration||t.slot||"As per schedule",B="Activity Description",ie="Pax Details"):g.includes("sightseeing")?(Y="Sightseeing",re="Tour Date",_="Tour Type",A=t.tourType||"Sightseeing Tour",B="Sightseeing Description",ie="Pax Details"):g.includes("flight")&&(Y="Flight",re="Flight Date",_="Flight / Sector",A=t.flightNumber||t.sector||"Flight Service",B="Flight Details",ie="Pax Details");const de=t.confirmationNumber||t.cnfNumber||t.supplierConfirmation||t.voucherNumber||(t.confirmation&&t.confirmation!=="Confirmed(Confirmed)"&&t.confirmation!=="Confirmed"&&t.confirmation!=="Pending"?t.confirmation:null),he=!!(de||t.status&&String(t.status).toLowerCase()==="confirmed"||t.confirmation&&!String(t.confirmation).toLowerCase().includes("pending")||t.isVoucherGenerated),ce=he?"Confirmed":"Pending",be=de?String(de).trim():he?"Confirmed":"Pending",pe=t.serviceDate?new Date(t.serviceDate):t.date?new Date(t.date):t.startDate?new Date(t.startDate):u,ye=pe&&!isNaN(pe.getTime())?S(pe):F,ve=t.time||t.pickupTime||t.serviceDate||"10:00 hrs",we=t.vehicleType?`${t.vehicleType} • ${E}`:t.pax||E||"2 Pax",Ne=`${h} - ${ce==="Confirmed"?"Confirmed Service":"Service"}`;return`
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; border: 1px solid #b3cae8; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #dce8f6;">
            <th colspan="2" style="padding: 9px 14px; font-size: 13px; font-weight: 800; color: #000000; text-align: left; border: 1px solid #b3cae8; letter-spacing: 0.2px;">
              ${Y}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="2" style="padding: 14px; background-color: #ffffff; border: 1px solid #b3cae8;">
              <div style="font-size: 14px; font-weight: 800; color: #000000; margin-bottom: 3px; line-height: 1.3;">
                ${h}
              </div>
              <div style="font-size: 12px; color: #334155; margin-bottom: 3px;">
                ${Y} • ${n}
              </div>
              ${$?`<div style="font-size: 12px; color: #1e293b; line-height: 1.4; margin-bottom: 12px;">${$}</div>`:'<div style="margin-bottom: 8px;"></div>'}
              
              <div style="font-size: 13px; font-weight: 800; color: #713f12; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-bottom: 12px;">
                Confirmation: ${be}
              </div>

              <!-- SERVICE DATE & DETAILS HIGHLIGHT BOX -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #b3cae8;">
                <tr>
                  <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                    ${re}
                  </td>
                  <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                    <strong style="color: #000000;">${ye}</strong> <span style="font-style: italic; font-size: 11px; color: #334155;">at ${ve}</span>
                  </td>
                  <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                    ${_}
                  </td>
                  <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                    <strong style="color: #000000;">${A}</strong> <span style="font-style: italic; font-size: 11px; color: ${ce==="Confirmed"?"#15803d":"#334155"}; font-weight: 600;">( ${ce} )</span>
                  </td>
                </tr>
              </table>

              <!-- SERVICE SUB-TABLE -->
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #b3cae8;">
                <thead>
                  <tr style="background-color: #dce8f6;">
                    <th style="width: 58%; padding: 8px 12px; font-size: 13px; font-weight: 700; color: #000000; text-align: left; border: 1px solid #b3cae8;">
                      ${B}
                    </th>
                    <th style="width: 42%; padding: 8px 12px; font-size: 13px; font-weight: 700; color: #000000; text-align: left; border: 1px solid #b3cae8;">
                      ${ie}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                      <div style="font-weight: 600; color: #000000;">${Ne}</div>
                      ${D?`
                        <div style="margin-top: 4px; font-size: 11px; color: #1e40af; font-weight: 600;">
                          ${l}${t.pickupLocation||t.dropLocation?` &nbsp;•&nbsp; ${t.pickupLocation||"Pickup"} ➔ ${t.dropLocation||"Drop"}`:""}
                        </div>
                      `:""}
                      ${$?`<div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">${$}</div>`:""}
                    </td>
                    <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                      ${D?`
                        <div style="font-weight: 700; color: #000000; font-size: 12px; margin-bottom: 6px;">${le}</div>
                        <table style="width: 100%; border-collapse: collapse; font-size: 11px; color: #1e293b;">
                          <tr>
                            <td style="padding: 2px 0; color: #475569;"><strong>Passenger Capacity:</strong></td>
                            <td style="padding: 2px 0; font-weight: 700; color: #0f172a; text-align: right;">${P}</td>
                          </tr>
                          <tr>
                            <td style="padding: 2px 0; color: #475569;"><strong>Luggage Capacity:</strong></td>
                            <td style="padding: 2px 0; font-weight: 700; color: #0f172a; text-align: right;">${z}</td>
                          </tr>
                          <tr>
                            <td style="padding: 2px 0; color: #475569;"><strong>Booked Pax:</strong></td>
                            <td style="padding: 2px 0; font-weight: 700; color: #0f172a; text-align: right;">${E}</td>
                          </tr>
                        </table>
                      `:`
                        <div style="font-weight: 600; color: #000000;">${we}</div>
                        <div style="font-size: 11px; color: #475569; margin-top: 4px;"><strong>Booked Pax:</strong> ${E}</div>
                      `}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    `}).join(""),ae=r?.termsAndConditions||r?.terms||[];let oe=[];Array.isArray(ae)?oe=ae.filter(t=>typeof t=="string"&&t.trim().length>0):typeof ae=="string"&&ae.trim()&&(oe=ae.split(`
`).map(t=>t.trim()).filter(t=>t.length>0)),oe.length===0&&(oe=Ye);const Re=oe.length>0?`
    <!-- TERMS & CONDITIONS SECTION -->
    <div style="margin-top: 18px; margin-bottom: 18px; font-family: Arial, sans-serif;">
      <div style="font-size: 13.5px; font-weight: 800; color: #9a3412; margin-bottom: 8px;">
        Terms &amp; Conditions:
      </div>
      <ol style="margin: 0; padding-left: 20px; font-size: 11.5px; color: #1e293b; line-height: 1.65;">
        ${oe.map(t=>`<li style="margin-bottom: 5px;">${t.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</li>`).join("")}
      </ol>
    </div>
  `:"";return`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Travel Voucher - ${i}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background-color: #f0f4f8;
            padding: 40px 20px;
            font-family: Arial, sans-serif;
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
            padding: 10px 16px;
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
            height: 60px;
            width: auto;
            object-fit: contain;
          }
          .brand-name {
            color: #ffffff;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.5px;
            z-index: 2;
            position: relative;
          }
          .title-bar {
            background: linear-gradient(135deg, #0f1d32 0%, #1a3352 50%, #264a6e 100%);
            color: #ffffff;
            text-align: center;
            font-size: 16px;
            font-weight: 700;
            padding: 13px 20px;
            letter-spacing: 4px;
            text-transform: uppercase;
            border-top: 2px solid #5a8aa8;
            border-bottom: 2px solid #0f1d32;
          }
          .voucher-body {
            padding: 24px 28px;
          }
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
              ${V&&x?`<img src="${x}" alt="${w||"Agent"} Logo" class="brand-logo">`:V?`<div style="font-size: 24px; font-weight: 800; color: #0f1d32;">${(w||"A").charAt(0).toUpperCase()}</div>`:b?`<img src="${Ge}" alt="Holiday Circuit Logo" class="brand-logo">`:'<div style="font-size: 24px; font-weight: 800; color: #0f1d32;">TV</div>'}
            </div>
            <div class="brand-name">${V?w||"Travel Voucher":b?"Holiday Circuit":"Travel Voucher"}</div>
          </div>

          <!-- TITLE BAR -->
          <div class="title-bar">Travel Voucher</div>

          <!-- BODY -->
          <div class="voucher-body">
            <!-- OVERVIEW TABLE -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; border: 1px solid #b3cae8;">
              <thead>
                <tr style="background-color: #dce8f6;">
                  <th colspan="4" style="padding: 9px 14px; font-size: 13px; font-weight: 800; color: #000000; text-align: center; border: 1px solid #b3cae8; letter-spacing: 0.3px;">
                    Trip ID: ${i}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; width: 18%; font-weight: 500; border: 1px solid #b3cae8;">Start Date</td>
                  <td style="padding: 8px 12px; color: #000000; width: 32%; font-weight: 700; border: 1px solid #b3cae8;">${F}</td>
                  <td style="padding: 8px 12px; color: #1e293b; width: 20%; font-weight: 500; border: 1px solid #b3cae8;">Trip Duration</td>
                  <td style="padding: 8px 12px; color: #000000; width: 30%; font-weight: 700; border: 1px solid #b3cae8;">${m}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Destination</td>
                  <td colspan="3" style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">${n}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Guest Name</td>
                  <td style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">${C}</td>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Guest Ph.</td>
                  <td style="padding: 8px 12px; color: #000000; font-weight: 600; border: 1px solid #b3cae8;">${I}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Pax Details</td>
                  <td colspan="3" style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">${E}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">Issued By</td>
                  <td colspan="3" style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">${Z}</td>
                </tr>
              </tbody>
            </table>

            <!-- HOTELS SECTION -->
            ${Oe}

            <!-- TRANSFERS & ACTIVITIES SECTION -->
            ${Ie}

            <!-- TERMS & CONDITIONS SECTION -->
            ${Re}

            <!-- HELPLINE SECTION -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; border: 1px solid #b3cae8; font-family: Arial, sans-serif;">
              <thead>
                <tr style="background-color: #fef08a;">
                  <th colspan="3" style="padding: 8px 12px; font-size: 13px; font-weight: 800; color: #000000; text-align: center; border: 1px solid #b3cae8;">
                    Helpline
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 9px 12px; color: #000000; font-weight: 600; width: 34%; border: 1px solid #b3cae8;">Holiday Circuit</td>
                  <td style="padding: 9px 12px; color: #000000; font-weight: 500; width: 33%; border: 1px solid #b3cae8;">24x7 Operational</td>
                  <td style="padding: 9px 12px; color: #000000; font-weight: 700; width: 33%; border: 1px solid #b3cae8;">+91-8851346665</td>
                </tr>
              </tbody>
            </table>

            <!-- GENERATED NOTE -->
            <div style="text-align: right; font-size: 11px; color: #64748b; margin-top: 14px; font-family: Arial, sans-serif;">
              Generated On - ${new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})} - ${new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:!1})} Hrs UTC
            </div>
          </div>

          <!-- FOOTER -->
          ${f?`
            <div style="width:100%; margin-top:16px; text-align:center;">
              <img src="${f}" alt="Footer Banner" style="width:100%; max-width:100%; height:auto; display:block;" />
            </div>
          `:`
            <div class="brand-footer">
              <div class="footer-info">
                <div class="footer-item">Phone: ${r.agencyPhone||te} | Email: ${r.agencyEmail||"ops@holidaycircuit.com"}</div>
              </div>
              <div class="footer-address">
                ${r.agencyAddress||"2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058"}
              </div>
            </div>
          `}
        </div>
      </body>
    </html>
  `},qe=r=>{if(!r)return[];if(Array.isArray(r))return r.map(o=>String(o||"").trim()).filter(Boolean);if(typeof r!="string")return[];if(/<[a-z][\s\S]*>/i.test(r))try{const o=new DOMParser().parseFromString(r,"text/html"),p=[],b=f=>{if(f&&f.nodeType===Node.ELEMENT_NODE){const T=f.tagName.toLowerCase();if(["ul","ol"].includes(T))Array.from(f.childNodes).forEach(b);else if(["p","h1","h2","h3","h4","h5","h6","li","blockquote","div"].includes(T)){const k=(f.textContent||"").replace(/^\d+[\.\)]\s*/,"").trim();k&&!p.includes(k)&&p.push(k)}else Array.from(f.childNodes).forEach(b)}};return Array.from(o.body.childNodes).forEach(b),p.length>0?p:(o.body.textContent||"").trim().split(`
`).map(f=>f.replace(/^\d+[\.\)]\s*/,"").trim()).filter(Boolean)}catch{return r.replace(/<br\s*[\/]?>/gi,`
`).replace(/<\/p>/gi,`
`).replace(/<\/li>/gi,`
`).replace(/<[^>]+>/g,"").split(`
`).map(p=>p.replace(/^\d+[\.\)]\s*/,"").trim()).filter(Boolean)}return r.split(`
`).map(o=>o.replace(/^\d+[\.\)]\s*/,"").trim()).filter(Boolean)},Qe=[{key:"EMAIL",label:"Email",description:"Send voucher directly to the agent's email inbox",icon:Ce,colorClass:"bg-[#2563eb]"},{key:"WHATSAPP",label:"WhatsApp",description:"Open WhatsApp with the voucher link ready to share",icon:De,colorClass:"bg-[#16a34a]"},{key:"PDF",label:"PDF Download",description:"Download the voucher HTML to your system",icon:fe,colorClass:"bg-[#f59e0b]"}],Ee=(r="")=>{const o=String(r||"").replace(/\D/g,"");return o?o.length===10?`91${o}`:o:""},Xe=({selectedChannel:r,recipientEmail:o,recipientPhone:p,onSelectChannel:b,onEmailChange:N,onPhoneChange:f,onClose:T,onConfirm:k,isSubmitting:w,agentName:R})=>e.jsx("div",{className:"fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4 py-8 md:py-10",children:e.jsxs(je.div,{initial:{opacity:0,y:18,scale:.96},animate:{opacity:1,y:0,scale:1},exit:{opacity:0,y:12,scale:.98},transition:{duration:.24,ease:"easeOut"},className:"w-full max-w-[400px] overflow-hidden rounded-[28px] border border-[#e2e8f0] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.25)]",children:[e.jsx("div",{className:"border-b border-slate-100 bg-[linear-gradient(180deg,#f0f4ff_0%,#f8faff_52%,#ffffff_100%)] px-5 py-3",children:e.jsxs("div",{className:"flex items-start justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] text-white shadow-md",children:e.jsx(Te,{size:15})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-700",children:"Send Travel Voucher"}),e.jsxs("h3",{className:"mt-0.5 text-[17px] font-semibold leading-none text-slate-900",children:["Share with ",R||"Agent"]})]})]}),e.jsx("button",{type:"button",onClick:T,className:"flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:text-slate-700",children:e.jsx(ze,{size:16})})]})}),e.jsxs("div",{className:"px-5 py-3",children:[e.jsx("div",{className:"space-y-2",children:Qe.map(x=>{const V=x.icon,S=r===x.key;return e.jsxs("button",{type:"button",onClick:()=>b(x.key),className:`flex w-full items-start gap-3 rounded-2xl border px-4 py-2.5 text-left transition ${S?"border-slate-800 bg-gradient-to-br from-[#1e3a8a] via-[#0f172a] to-black text-white shadow-[0_12px_30px_rgba(15,23,42,0.25)]":"border-slate-200 bg-white hover:bg-slate-50"}`,children:[e.jsx("span",{className:`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] ${S?"border-white/15 bg-white/10 text-white":`${x.colorClass} text-white`}`,children:e.jsx(V,{size:14})}),e.jsxs("span",{className:"min-w-0",children:[e.jsx("span",{className:`block text-sm font-semibold ${S?"text-white":"text-slate-900"}`,children:x.label}),e.jsx("span",{className:`mt-0.5 block text-[11px] leading-4 ${S?"text-slate-300":"text-slate-500"}`,children:x.description})]})]},x.key)})}),e.jsx(Be,{initial:!1,mode:"wait",children:r==="EMAIL"?e.jsx(je.div,{initial:{opacity:0,height:0,y:-8},animate:{opacity:1,height:"auto",y:0},exit:{opacity:0,height:0,y:-8},transition:{duration:.22,ease:"easeOut"},className:"overflow-hidden",children:e.jsxs("div",{className:"mt-2.5",children:[e.jsxs("label",{className:"flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500",children:[e.jsx("span",{className:"flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#1e3a8a] text-white",children:e.jsx(Ce,{size:11})}),"Agent Email"]}),e.jsx("input",{type:"email",value:o,onChange:x=>N(x.target.value),placeholder:"Enter agent email",className:"mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"})]})},"send-email-input"):r==="WHATSAPP"?e.jsx(je.div,{initial:{opacity:0,height:0,y:-8},animate:{opacity:1,height:"auto",y:0},exit:{opacity:0,height:0,y:-8},transition:{duration:.22,ease:"easeOut"},className:"overflow-hidden",children:e.jsxs("div",{className:"mt-2.5",children:[e.jsxs("label",{className:"flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500",children:[e.jsx("span",{className:"flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#16a34a] text-white",children:e.jsx(De,{size:11})}),"WhatsApp Number"]}),e.jsx("input",{type:"tel",value:p,onChange:x=>f(x.target.value),placeholder:"Enter WhatsApp number",className:"mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"})]})},"send-whatsapp-input"):null}),e.jsx("div",{className:"mt-2.5 rounded-2xl border border-blue-100/70 bg-blue-50/20 px-4 py-3",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("span",{className:"mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-600",children:r==="EMAIL"?e.jsx("span",{className:"flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#1e3a8a] text-white",children:e.jsx(Ce,{size:12})}):r==="WHATSAPP"?e.jsx("span",{className:"flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#16a34a] text-white",children:e.jsx(De,{size:12})}):e.jsx("span",{className:"flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#f59e0b] text-white",children:e.jsx(fe,{size:12})})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-slate-900",children:"What will happen"}),e.jsx("p",{className:"mt-1 text-[11px] leading-5 text-slate-500",children:r==="EMAIL"?"The travel voucher with all confirmed service information will be sent directly to the agent's email.":r==="WHATSAPP"?"WhatsApp will open with a ready-to-share message linking to the agent's online travel voucher.":"A clean travel voucher copy will be downloaded in HTML format for offline sharing."})]})]})}),e.jsxs("div",{className:"mt-3 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end",children:[e.jsx("button",{type:"button",onClick:T,className:"rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50",children:"Cancel"}),e.jsx("button",{type:"button",onClick:k,disabled:w,className:"rounded-full bg-gradient-to-br from-[#1e3a8a] via-[#0f172a] to-black px-6 py-2.5 text-sm font-semibold text-white transition hover:from-[#1d4ed8] hover:to-[#0f172a] disabled:cursor-not-allowed disabled:opacity-70 shadow-[0_4px_15px_rgba(30,58,138,0.25)]",children:w?r==="EMAIL"?"Sending...":"Preparing...":r==="EMAIL"?"Send Email":r==="WHATSAPP"?"Open WhatsApp":"Download"})]})]})]})}),Je=({data:r,onClose:o,onSend:p,onDownload:b,mode:N="preview",loading:f=!1})=>{const[T,k]=v.useState({}),[w,R]=v.useState(!1),[x,V]=v.useState("EMAIL"),[S,H]=v.useState(r?.agentEmail||"agent@holidaycircuit.com"),[K,q]=v.useState(r?.agentPhone||"9876543210"),[u,F]=v.useState([]),[Q,L]=v.useState(""),[X,U]=v.useState(!1),[J,O]=v.useState(!0);v.useEffect(()=>{r&&(H(r.agentEmail||"agent@holidaycircuit.com"),q(r.agentPhone||"9876543210"),(async()=>{try{O(!0);let y=null;try{y=await ge.get("/admin/terms")}catch{y=await ge.get("/agent/terms")}const Z=(Array.isArray(y?.data)?y.data:Array.isArray(y?.data?.data)?y.data.data:[]).map(G=>{const ue=qe(G.content||"");return{id:String(G.id||G._id),name:G.name||"Terms & Conditions",items:ue}}).filter(G=>G.items.length>0),te=[...Z];te.push({id:"none",name:"None (Exclude Terms & Conditions)",items:[]}),F(te);const W=Z.find(G=>G.name.toLowerCase().includes("voucher"));W?L(W.id):Z.length>0?L(Z[0].id):L("none")}catch(y){console.error("Failed to load admin terms:",y),F([{id:"none",name:"None (Exclude Terms & Conditions)",items:[]}]),L("none")}finally{O(!1)}})())},[r]);const i=r?.voucherNumber||r?.query||"default",n=N==="view",m=T[i]??r?.branding??"with",C=v.useMemo(()=>Ke(r?.services||[],r?.status==="sent"||n),[r?.services,r?.status,n]),d=v.useMemo(()=>u.find(y=>y.id===Q)?.items||[],[u,Q]),M=v.useMemo(()=>`Voucher will ${m==="with"?"include":"not include"} branding${d.length?` • ${d.length} terms applied`:" • No terms applied"}`,[m,d]);if(!r)return null;const I=()=>{const s={...r,termsAndConditions:d,terms:d};if(b){b(s,m,d);return}const ne=Ae(s,m,{name:"Holiday Circuit",logo:""}),Z=new Blob([ne],{type:"text/html;charset=utf-8"}),te=URL.createObjectURL(Z),W=document.createElement("a");W.href=te,W.download=`${r.voucherNumber||r.query}-${m}.html`,document.body.appendChild(W),W.click(),W.remove(),URL.revokeObjectURL(te)},E=async()=>{if(x==="EMAIL"&&!String(S||"").trim()){alert("Please enter a valid email address");return}if(x==="WHATSAPP"&&!Ee(K)){alert("Please enter a valid phone number");return}try{if(p&&await p(m,x,S,K,d),x==="WHATSAPP"){const s=Ee(K);if(s){const y=`Hello ${r.agentName||"Agent"}, here is the voucher for your query ${r.query||r.voucherNumber}. Direct Link: ${window.location.origin}/voucher/${r.id}`,ne=`https://wa.me/${s}?text=${encodeURIComponent(y)}`;window.open(ne,"_blank","noopener,noreferrer")}}else x==="PDF"&&I();R(!1)}catch(s){console.error("Voucher dispatch confirm failed",s)}};return e.jsxs(e.Fragment,{children:[e.jsx("div",{className:`fixed inset-0 z-50 bg-black/60 backdrop-blur-[3px] ${w?"hidden":""}`,children:e.jsx("div",{className:"flex min-h-full items-center justify-center px-3 py-2",children:e.jsxs("div",{onClick:s=>s.stopPropagation(),className:"flex max-h-[94vh] w-full max-w-[445px] flex-col overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-2xl animate-scaleIn",children:[e.jsx("div",{className:"border-b border-gray-200 px-4 py-3",children:e.jsxs("div",{className:"flex items-start justify-between gap-4",children:[e.jsxs("div",{children:[e.jsxs("h2",{className:"text-[14px] font-semibold text-gray-900",children:["Voucher Preview - ",r.query]}),e.jsxs("p",{className:"text-[10px] text-gray-500",children:["Review and ",N==="send"?"send":"download"," the voucher for ",r.name,"."]})]}),e.jsx("button",{type:"button",onClick:o,className:"rounded-full p-1.5 text-red-600 transition hover:bg-red-50",children:e.jsx(ze,{size:16})})]})}),e.jsxs("div",{className:"custom-scroll flex-1 overflow-y-auto px-4 py-3",children:[e.jsxs("div",{className:"rounded-[18px] bg-gradient-to-r from-blue-600 to-blue-800 py-4 text-center text-white",children:[e.jsx("h1",{className:"text-base font-semibold",children:m==="with"?"Holiday Circuit":"Travel Voucher"}),e.jsx("p",{className:"mt-1 text-[10px]",children:m==="with"?"Travel Voucher":"Clean Voucher Copy"}),e.jsxs("div",{className:"mt-2 inline-block rounded-xl bg-white/20 px-6 py-1.5",children:[e.jsx("p",{className:"text-[10px]",children:"Voucher No."}),e.jsx("p",{className:"text-xs font-semibold",children:r.voucherNumber||r.query})]})]}),e.jsxs("div",{className:"mt-3 grid grid-cols-2 gap-2.5 text-[11px]",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-gray-500",children:"Guest Name"}),e.jsx("p",{className:"font-medium text-gray-900",children:r.name||"-"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-gray-500",children:"Passengers"}),e.jsx("p",{className:"font-medium text-gray-900",children:r.passengers||"-"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-gray-500",children:"Destination"}),e.jsx("p",{className:"font-medium text-gray-900",children:r.destination||"-"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-gray-500",children:"Duration"}),e.jsx("p",{className:"font-medium text-gray-900",children:r.duration||"-"})]})]}),e.jsxs("div",{className:"mt-3",children:[e.jsx("h3",{className:"mb-2 text-sm font-semibold text-gray-900",children:"Service Details"}),e.jsx("div",{className:"space-y-2",children:(r.services||[]).map((s,y)=>e.jsxs("div",{className:"rounded-[14px] border border-gray-200 bg-sky-50 px-3 py-2.5",children:[e.jsx("p",{className:"mb-1 text-sm font-medium text-gray-900",children:_e(s.type)}),e.jsxs("div",{className:"flex justify-between gap-3 text-[11px]",children:[e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsx("p",{className:"text-gray-500",children:"Service"}),e.jsx("p",{className:"truncate text-gray-900",children:s.title||s.name||"Service missing"})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("p",{className:"text-gray-500",children:"Confirmation"}),e.jsxs("p",{className:"text-gray-900",children:[s.confirmation||"Pending",s.status?` (${s.status})`:""]})]})]})]},y))})]}),e.jsxs("div",{className:"mt-3",children:[e.jsxs("div",{className:"flex items-center justify-between mb-1.5",children:[e.jsxs("label",{className:"flex items-center gap-1.5 text-xs font-semibold text-gray-900",children:[e.jsx(me,{size:13,className:"text-blue-600"}),"Terms & Conditions"]}),d.length>0&&e.jsx("button",{type:"button",onClick:()=>U(s=>!s),className:"text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5 cursor-pointer",children:X?"Hide Preview":`Preview (${d.length} items)`})]}),e.jsxs("div",{className:"relative",children:[e.jsx("select",{value:Q,onChange:s=>L(s.target.value),disabled:n||J,className:"w-full appearance-none rounded-[12px] border border-gray-200 bg-white px-3 py-2 pr-8 text-xs font-medium text-gray-800 shadow-xs outline-none transition hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed",children:J?e.jsx("option",{value:"",children:"Loading Admin Terms..."}):u.length===0?e.jsx("option",{value:"none",children:"No Admin Terms Found"}):u.map(s=>e.jsxs("option",{value:s.id,children:[s.name," ",s.items?.length?`(${s.items.length} points)`:""]},s.id))}),e.jsx(Me,{size:14,className:"pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"})]}),X&&d.length>0&&e.jsx("div",{className:"mt-2 max-h-36 overflow-y-auto rounded-[12px] border border-blue-100 bg-blue-50/50 p-2.5 text-[10.5px] text-gray-700 custom-scroll",children:e.jsx("ol",{className:"list-decimal pl-4 space-y-1",children:d.map((s,y)=>e.jsx("li",{className:"leading-relaxed",children:s},y))})})]}),e.jsxs("div",{className:"mt-3",children:[e.jsx("h3",{className:"mb-2 text-sm font-semibold text-gray-900",children:"Template Options"}),e.jsxs("label",{className:`mb-2 flex items-start gap-2 rounded-[14px] border border-gray-200 bg-white p-2.5 ${n?"opacity-70":"cursor-pointer"}`,children:[e.jsx("input",{type:"radio",name:"branding",checked:m==="with",onChange:()=>k(s=>({...s,[i]:"with"})),disabled:n}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-medium text-gray-900",children:"With Branding"}),e.jsx("p",{className:"text-[10px] text-gray-500",children:"Include company logo and branded header"})]})]}),e.jsxs("label",{className:`flex items-start gap-2 rounded-[14px] border border-gray-200 bg-white p-2.5 ${n?"opacity-70":"cursor-pointer"}`,children:[e.jsx("input",{type:"radio",name:"branding",checked:m==="without",onChange:()=>k(s=>({...s,[i]:"without"})),disabled:n}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-medium text-gray-900",children:"Without Branding"}),e.jsx("p",{className:"text-[10px] text-gray-500",children:"Clean version for agent-facing share"})]})]})]})]}),e.jsxs("div",{className:"border-t border-gray-200 bg-white px-4 py-3",children:[e.jsx("p",{className:"text-[10px] text-gray-500",children:M}),e.jsxs("div",{className:"mt-2 flex gap-2",children:[e.jsx("button",{onClick:o,className:"flex-1 rounded-[12px] border border-gray-300 bg-white px-4 py-2 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-100",children:"Close"}),N==="send"?e.jsxs("button",{onClick:()=>R(!0),disabled:f||!C.canSend,className:"flex flex-1 items-center justify-center gap-1 rounded-[12px] bg-green-600 px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-green-700 disabled:opacity-60",children:[e.jsx(Te,{size:13}),f?"Sending...":C.canSend?"Send to Agent":"Blocked"]}):e.jsxs("button",{onClick:I,className:"flex flex-1 items-center justify-center gap-1 rounded-[12px] bg-green-600 px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-green-700",children:[e.jsx(fe,{size:13}),"Download"]})]})]})]})})}),e.jsx(Be,{children:w&&e.jsx(Xe,{selectedChannel:x,recipientEmail:S,recipientPhone:K,onSelectChannel:V,onEmailChange:H,onPhoneChange:q,onClose:()=>R(!1),onConfirm:E,isSubmitting:f,agentName:r.agentName})})]})},Ze=r=>{if(!r)return"-";const o=new Date(r);return Number.isNaN(o.getTime())?r:o.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})};function pt(){const[r,o]=v.useState(!1),[p,b]=v.useState(null),[N,f]=v.useState("preview"),[T,k]=v.useState([]),[w,R]=v.useState({ready:0,generated:0,sent:0}),[x,V]=v.useState(""),[S,H]=v.useState(!1),[K,q]=v.useState(!1),u=async()=>{try{H(!0);const{data:i}=await ge.get("/ops/vouchers");k(i.vouchers||[]),R(i.stats||{ready:0,generated:0,sent:0})}catch(i){console.error("Failed to fetch vouchers",i),ee.error("Failed to fetch vouchers")}finally{H(!1)}};v.useEffect(()=>{u()},[]);const F=T.filter(i=>{const n=x.toLowerCase();return i.query?.toLowerCase().includes(n)||i.name?.toLowerCase().includes(n)||i.agentName?.toLowerCase().includes(n)||i.destination?.toLowerCase().includes(n)}),Q=async i=>{try{const{data:n}=await ge.patch(`/ops/vouchers/${i}/generate`);ee.success(n?.message||"Voucher generated successfully"),await u()}catch(n){console.error("Failed to generate voucher",n),ee.error(n?.response?.data?.message||"Failed to generate voucher")}},L=async(i,n="with",m="EMAIL",C="",d="",M=null)=>{try{q(!0);const{data:I}=await ge.patch(`/ops/vouchers/${i}/send`,{branding:n,dispatchChannel:m,email:C,phone:d,termsAndConditions:M});ee.success(I?.message||"Voucher sent successfully"),o(!1),await u()}catch(I){console.error("Failed to send voucher",I),ee.error(I?.response?.data?.message||"Failed to send voucher")}finally{q(!1)}},X=(i,n="preview")=>{b(i),f(n),o(!0)},U=(i,n="with",m=null)=>{try{const C={name:i.agentBrandingName||i.agentName||"Holiday Circuit",logo:i.agentLogo||""},d=m?{...i,termsAndConditions:m}:i,M=Ae(d,n,C),I=new Blob([M],{type:"text/html;charset=utf-8"}),E=URL.createObjectURL(I),s=document.createElement("a");s.href=E,s.download=`${i.voucherNumber||i.query||"voucher"}-${n}.html`,document.body.appendChild(s),s.click(),setTimeout(()=>{document.body.contains(s)&&document.body.removeChild(s),URL.revokeObjectURL(E)},5e3)}catch(C){console.error("Failed to download voucher",C),ee.error("Failed to generate voucher download file")}},J=()=>{const i=F.filter(n=>n.status==="generated"||n.status==="sent"||n.voucherNumber);if(i.length===0){ee.error("No generated vouchers found to download in bulk.");return}ee.success(`Downloading ${i.length} voucher(s) in bulk...`);try{const n=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bulk Travel Vouchers (${i.length} Vouchers)</title>
  <style>
    @media print {
      .voucher-page { page-break-after: always; page-break-inside: avoid; }
    }
    .voucher-page { margin-bottom: 50px; }
  </style>
</head>
<body>
  ${i.map(M=>{const I={name:M.agentBrandingName||M.agentName||"",logo:M.agentLogo||""},E=Ae(M,M.branding||"with",I),s=E.match(/<body[^>]*>([\s\S]*)<\/body>/i);return`<div class="voucher-page">${s?s[1]:E}</div>`}).join(`
`)}
</body>
</html>`,m=new Blob([n],{type:"text/html;charset=utf-8"}),C=URL.createObjectURL(m),d=document.createElement("a");d.href=C,d.download=`Bulk-Vouchers-All-${i.length}-Items.html`,document.body.appendChild(d),d.click(),setTimeout(()=>{document.body.contains(d)&&document.body.removeChild(d),URL.revokeObjectURL(C)},5e3)}catch(n){console.error("Bulk master file generation error:",n)}i.forEach((n,m)=>{setTimeout(()=>{U(n,n.branding||"with")},(m+1)*300)})},O=T.filter(i=>i.status==="generated"||i.status==="sent"||i.voucherNumber).length;return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"bg-gray-50 min-h-screen",children:[e.jsxs("div",{className:"flex justify-between items-start mb-6",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-xl font-semibold text-gray-900",children:"Voucher Management"}),e.jsx("p",{className:"text-sm text-gray-500",children:"Generate and manage travel vouchers for confirmed bookings"})]}),e.jsxs("button",{onClick:J,className:"flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 hover:shadow-md hover:shadow-emerald-500/10 transition-all duration-300 text-white px-4 py-2 rounded-full text-sm font-semibold cursor-pointer active:scale-95",children:[e.jsx(fe,{size:16}),"Bulk Download ",O>0?`(${O})`:""]})]}),e.jsxs("div",{className:"grid grid-cols-3 gap-4 mb-6",children:[e.jsx(Se,{title:"Ready to Generate",count:w.ready,type:"ready"}),e.jsx(Se,{title:"Generated",count:w.generated,type:"generated"}),e.jsx(Se,{title:"Sent to Agents",count:w.sent,type:"sent"})]}),e.jsxs("div",{className:"relative mb-6 border border-gray-200 rounded-2xl shadow-sm p-4",children:[e.jsx(Ve,{className:"absolute left-8 top-7 text-gray-400",size:16}),e.jsx("input",{value:x,onChange:i=>V(i.target.value),className:"w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none",placeholder:"Search by Query ID, Guest Name, or Agent..."})]}),S?e.jsx("div",{className:"text-sm text-gray-500",children:"Loading vouchers..."}):e.jsx("div",{className:"space-y-6",children:F.map(i=>e.jsx(et,{id:i.id,status:i.status,query:i.query,voucherNumber:i.voucherNumber,name:i.name,destination:i.destination,date:i.date,travelDate:i.travelDate,duration:i.duration,passengers:i.passengers,adults:i.adults,children:i.children,travelerSummary:i.travelerSummary,services:i.services||[],branding:i.branding||"with",agentName:i.agentName,agentEmail:i.agentEmail,agentPhone:i.agentPhone,invoicePaymentStatus:i.invoicePaymentStatus,paymentVerificationStatus:i.paymentVerificationStatus,canSendVoucher:i.canSendVoucher,onPreview:X,onGenerate:Q},i.id))})]}),r&&e.jsx(Je,{data:p,mode:N,loading:K,onSend:(i,n,m,C,d)=>L(p.id,i,n,m,C,d),onDownload:U,onClose:()=>o(!1)})]})}function Se({title:r,count:o,type:p}){const b={ready:{card:"bg-gradient-to-br from-orange-50/80 via-white to-white hover:from-orange-100/40 hover:via-orange-50/10 hover:to-white border-orange-100 border-b-orange-500 shadow-sm shadow-orange-500/5",iconWrap:"bg-orange-100 text-orange-600 border border-orange-200/50"},generated:{card:"bg-gradient-to-br from-blue-50/80 via-white to-white hover:from-blue-100/40 hover:via-blue-50/10 hover:to-white border-blue-100 border-b-blue-500 shadow-sm shadow-blue-500/5",iconWrap:"bg-blue-100 text-blue-600 border border-blue-200/50"},sent:{card:"bg-gradient-to-br from-green-50/80 via-white to-white hover:from-green-100/40 hover:via-green-50/10 hover:to-white border-green-100 border-b-green-500 shadow-sm shadow-green-500/5",iconWrap:"bg-green-100 text-green-600 border border-green-200/50"}}[p]||{card:"bg-white border-gray-200 border-b-gray-400",iconWrap:"bg-gray-100 text-gray-600"};return e.jsxs("div",{className:`border border-b-4 rounded-xl p-4 flex justify-between items-center hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-out ${b.card}`,children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium text-gray-500",children:r}),e.jsx("h2",{className:"text-2xl font-bold text-gray-800 mt-1",children:o})]}),e.jsx("div",{className:`p-3 rounded-lg ${b.iconWrap}`,children:e.jsx(me,{size:18})})]})}function et({id:r,status:o,query:p,voucherNumber:b,name:N,destination:f,date:T,travelDate:k,duration:w,passengers:R,adults:x,children:V,travelerSummary:S,services:H,branding:K,agentName:q,agentEmail:u,agentPhone:F,invoicePaymentStatus:Q,paymentVerificationStatus:L,canSendVoucher:X,onPreview:U,onGenerate:J}){const O={ready:{label:"Ready to Generate",badge:"bg-amber-100/90 text-amber-900 border border-amber-300/80 font-bold",icon:e.jsx(me,{size:12,className:"text-amber-700"}),cardBg:"bg-gradient-to-br from-amber-100/70 via-orange-50/40 to-white border-amber-200/90 hover:border-amber-300 shadow-2xs"},generated:{label:"Generated",badge:"bg-indigo-100/90 text-indigo-900 border border-indigo-300/80 font-bold",icon:e.jsx(me,{size:12,className:"text-indigo-700"}),cardBg:"bg-gradient-to-br from-indigo-100/70 via-purple-50/40 to-white border-indigo-200/90 hover:border-indigo-300 shadow-2xs"},sent:{label:"Sent to Agent",badge:"bg-emerald-100/90 text-emerald-900 border border-emerald-300/80 font-bold",icon:e.jsx(Le,{size:12,className:"text-emerald-700"}),cardBg:"bg-gradient-to-br from-emerald-100/70 via-teal-50/40 to-white border-emerald-200/90 hover:border-emerald-300 shadow-2xs"}},i={id:r,query:p,voucherNumber:b,name:N,destination:f,date:T,travelDate:k,duration:w,passengers:R,adults:x,children:V,travelerSummary:S,services:H,branding:K,agentName:q,agentEmail:u,agentPhone:F,invoicePaymentStatus:Q,paymentVerificationStatus:L,canSendVoucher:X},n=!!X;return e.jsxs("div",{className:`border rounded-2xl p-5 md:p-6 flex flex-col gap-4.5 transition-all duration-300 ${O[o].cardBg}`,children:[e.jsxs("div",{className:"flex justify-between items-center flex-wrap gap-2",children:[e.jsxs("div",{className:"flex gap-3 items-center",children:[e.jsx("h3",{className:"font-extrabold text-slate-900 text-xl tracking-tight font-sans",children:p}),e.jsxs("span",{className:`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${O[o].badge}`,children:[O[o].icon,O[o].label]})]}),o==="sent"&&e.jsxs("div",{className:"flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300/70 px-3 py-1 rounded-full shadow-2xs",children:[e.jsx(Le,{size:13,className:"text-emerald-600"}),"Synced to Agent Portal"]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2.5 text-xs",children:[e.jsxs("div",{className:"flex items-center gap-1.5 rounded-xl bg-white/90 border border-slate-200/80 px-3.5 py-1.5 font-bold text-slate-800 shadow-2xs",children:[e.jsx(He,{size:13,className:"text-indigo-600 shrink-0"}),e.jsx("span",{children:N})]}),e.jsxs("div",{className:"flex items-center gap-1.5 rounded-xl bg-white/90 border border-slate-200/80 px-3.5 py-1.5 font-bold text-slate-800 shadow-2xs",children:[e.jsx(Fe,{size:13,className:"text-purple-600 shrink-0"}),e.jsx("span",{children:f})]}),e.jsxs("div",{className:"flex items-center gap-1.5 rounded-xl bg-white/90 border border-slate-200/80 px-3.5 py-1.5 font-bold text-slate-800 shadow-2xs",children:[e.jsx(Ue,{size:13,className:"text-orange-600 shrink-0"}),e.jsx("span",{children:Ze(T)})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-start gap-2.5 border-t border-slate-200/70 pt-3.5",children:[e.jsxs("div",{className:"flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 min-w-[95px] pt-1",children:[e.jsx(We,{size:13,className:"text-indigo-600 shrink-0"}),e.jsx("span",{children:"Services:"})]}),e.jsx("div",{className:"flex flex-wrap gap-2 flex-1",children:(H||[]).map((m,C)=>{const d=typeof m=="string"?m:m.title||m.name||"Service missing";return e.jsxs("div",{className:"inline-flex items-center gap-1.5 bg-white/95 border border-slate-200/90 text-slate-800 text-xs px-3 py-1.5 rounded-full font-semibold shadow-2xs transition hover:border-indigo-300 hover:bg-indigo-50/40",children:[e.jsx("span",{className:"flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700",children:C+1}),e.jsx("span",{children:d})]},C)})})]}),e.jsxs("div",{className:"mt-1 flex flex-wrap gap-2.5 border-t border-slate-200/70 pt-4",children:[o==="ready"&&e.jsxs("button",{onClick:()=>J(r),className:"bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-indigo-950 hover:via-slate-900 hover:to-slate-950 text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95",children:[e.jsx(me,{size:15}),"Generate Voucher"]}),o==="generated"&&e.jsxs(e.Fragment,{children:[e.jsxs("button",{onClick:()=>U(i,"preview"),className:"flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-5 py-2.5 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95",children:[e.jsx(Pe,{size:14}),"Preview"]}),e.jsxs("button",{onClick:()=>U(i,"send"),disabled:!n,title:n?"Send voucher to agent":"Payment must be verified before sending the voucher",className:`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 ${n?"bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xs cursor-pointer":"cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200"}`,children:[e.jsx(Te,{size:14}),n?"Send to Agent":"Awaiting Verification"]})]}),o==="sent"&&e.jsx(e.Fragment,{children:e.jsxs("button",{onClick:()=>U(i,"view"),className:"flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-5 py-2.5 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95",children:[e.jsx(Pe,{size:14}),"View"]})})]})]})}export{pt as default};
