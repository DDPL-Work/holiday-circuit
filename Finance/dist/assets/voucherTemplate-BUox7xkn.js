const xe="https://res.cloudinary.com/dszadvuz6/image/upload/e_trim/v1777932524/unzssx1sjkrigbgldg7h.png",ye=["Welcome to Holiday Circuit. These Terms and Conditions govern your use of the Holiday Circuit services. When You Make a booking or reservation, you agree to be bound by these Terms.","Bookings and Reservations","Booking Process: When you make a booking or reservation through Holiday Circuit, you agree to provide accurate and complete information. Any discrepancies or errors in the information you provide may result in the cancellation of your booking.","Payment: Payments for bookings are due as specified during the booking process. Failure to make payments on time may result in the cancellation of your booking.","Cancellations and Refunds: Cancellation and refund policies vary depending on the type of booking. Please refer to the specific cancellation policy provided at the time of booking. Holiday Circuit reserves the right to charge cancellation fees as applicable.","Intellectual Property","Ownership: All content, trademarks, logos, and intellectual property on the Holiday Circuit website and app are the property of Holiday Circuit or its licensors. You may not use, reproduce, or distribute our content without prior written permission.","Changes to Terms and Conditions: We reserve the right to update and modify these Terms and Conditions at any time. Please review them periodically for changes. Your continued use of our services after any modifications indicates your acceptance of the updated Terms.","By booking with Holiday Circuit, you acknowledge that you have read, understood, and agreed to these Terms and Conditions."],Ce=(t="")=>{const a=String(t||"").trim().toLowerCase();return a?a==="hotel"?"Hotel":a==="transfer"||a==="transport"||a==="car"?"Transport":a==="activity"?"Activity":a==="sightseeing"?"Sightseeing":a==="flight"?"Flight":a.replace(/\b\w/g,r=>r.toUpperCase()):"Service"},J=t=>{if(!t)return[];if(Array.isArray(t)){const a=[];return t.forEach(r=>{if(typeof r=="string")if(/<[a-z][\s\S]*>/i.test(r))a.push(...J(r));else{const p=r.replace(/^\d+[\.\)]\s*/,"").trim();p&&a.push(p)}else if(r&&typeof r=="object"){const p=r.content||r.text||r.name||r.item||r.label||"";p&&a.push(...J(p))}}),a.filter(Boolean)}if(typeof t!="string")return[];if(/<[a-z][\s\S]*>/i.test(t))try{const a=new DOMParser().parseFromString(t,"text/html"),r=[],p=g=>{if(g&&g.nodeType===Node.ELEMENT_NODE){const E=g.tagName.toLowerCase();if(["ul","ol"].includes(E))Array.from(g.childNodes).forEach(p);else if(["p","h1","h2","h3","h4","h5","h6","li","blockquote","div"].includes(E)){const T=(g.textContent||"").replace(/^\d+[\.\)]\s*/,"").trim();T&&!r.includes(T)&&r.push(T)}else Array.from(g.childNodes).forEach(p)}};return Array.from(a.body.childNodes).forEach(p),r.length>0?r:(a.body.textContent||"").trim().split(`
`).map(g=>g.replace(/^\d+[\.\)]\s*/,"").trim()).filter(Boolean)}catch{return t.replace(/<br\s*[\/]?>/gi,`
`).replace(/<\/p>/gi,`
`).replace(/<\/li>/gi,`
`).replace(/<[^>]+>/g,"").split(`
`).map(r=>r.replace(/^\d+[\.\)]\s*/,"").trim()).filter(Boolean)}return t.split(`
`).map(a=>a.replace(/^\d+[\.\)]\s*/,"").trim()).filter(Boolean)},De=(t=[],a=!1)=>{const r=(t||[]).filter(y=>!String(y?.title||y?.name||"").trim()),p=(t||[]).filter(y=>{const g=String(y?.confirmation||"").trim().toLowerCase();return!g||g==="pending"});return t.length?r.length&&p.length?{tone:"red",title:"Services And Confirmations Missing",message:"Some voucher services are missing and some DMC confirmation numbers are still pending. Client sharing will stay blocked until both are complete.",canSend:!1}:r.length?{tone:"red",title:"Service Details Missing",message:"Some voucher services are missing. Complete all service names before sending the voucher to the client.",canSend:!1}:p.length?{tone:"red",title:"DMC Confirmation Pending",message:"Some DMC confirmation numbers are still pending. Client sharing will stay blocked until all confirmations are updated.",canSend:!1}:a?{tone:"green",title:"Voucher Already Shared",message:"This voucher has already been sent successfully. You can review or download the final shared copy here.",canSend:!1}:{tone:"green",title:"Client Ready To Send",message:"All services and DMC confirmation numbers are available. This voucher is ready to share with the client.",canSend:!0}:{tone:"red",title:"Voucher Services Missing",message:"No services are mapped in this voucher yet. Add services before sending it to the client.",canSend:!1}},Ae=(t,a,r={})=>{const p=a==="with",y=t?.travelDate||t?.startDate||t?.date||null,g=String(t?.voucherFooterImage||t?.footerBanner||t?.pdfFooterImage||t?.agentFooterImage||"").trim(),E=(e,s="Holiday Circuit")=>{const l=String(e||"").trim();return l||s},T=String(r?.name||r?.brandingName||r?.companyName||t?.agentName||t?.agencyName||"").trim(),v=T?E(T,"Holiday Circuit"):"",G=!v||v.toLowerCase()==="holiday circuit",H=G?"":String(r?.logo||t?.agentLogo||"").trim(),F=p&&!G&&!!(H||v),k=e=>{if(!e||isNaN(new Date(e).getTime()))return"-";const s=new Date(e),l=s.getDate(),f=s.toLocaleString("en-US",{month:"short"}),c=s.getFullYear();let d="th";return l%10===1&&l!==11?d="st":l%10===2&&l!==12?d="nd":l%10===3&&l!==13&&(d="rd"),`${l}${d} ${f}, ${c}`},W=e=>{if(!e||isNaN(new Date(e).getTime()))return"-";const s=new Date(e),l=s.getDate(),f=s.toLocaleString("en-US",{month:"short"}),c=s.getFullYear();return`${l} ${f}, ${c}`},Z=(e={})=>{const s=[e.mealPlan,e.meal_plan,e.meal,e.meals,e.mealType].filter(d=>typeof d=="string"&&d.trim().length>0);for(const d of s){const i=d.trim().toUpperCase();if(i==="EP"||i.includes("ROOM ONLY")||i.includes("ONLY ROOM")||i.includes("NO MEAL"))return"EP ( Room Only )";if(i==="MAP"||i.includes("HALF BOARD")||i.includes("BREAKFAST & DINNER")||i.includes("BREAKFAST AND DINNER")||i.includes("BREAKFAST + DINNER"))return"MAP ( Breakfast & Dinner Included )";if(i==="AP"||i.includes("FULL BOARD")||i.includes("ALL MEAL"))return"AP ( Breakfast, Lunch & Dinner Included )";if(i==="AI"||i.includes("ALL INCLUSIVE"))return"AI ( All Inclusive )";if(i==="CP"||i.includes("BREAKFAST")||i.includes("BED & BREAKFAST")||i.includes("B&B"))return"CP ( Breakfast Included )"}const l=[e.description,e.roomDescription,e.hotelDescription,e.roomType,e.roomCategory,e.inclusions,e.notes].filter(Boolean);for(const d of l){const i=String(d).split("|").map(n=>n.trim().toUpperCase());for(const n of i){if(n==="EP"||n==="ROOM ONLY"||n==="ONLY ROOM"||n==="NO MEALS"||n==="NO MEAL")return"EP ( Room Only )";if(n==="MAP"||n==="HALF BOARD"||n==="BREAKFAST & DINNER"||n==="BREAKFAST AND DINNER"||n==="BREAKFAST + DINNER")return"MAP ( Breakfast & Dinner Included )";if(n==="AP"||n==="FULL BOARD"||n==="ALL MEALS"||n==="ALL MEAL")return"AP ( Breakfast, Lunch & Dinner Included )";if(n==="AI"||n==="ALL INCLUSIVE")return"AI ( All Inclusive )";if(n==="CP"||n==="BREAKFAST INCLUDED"||n==="BREAKFAST"||n==="BED & BREAKFAST"||n==="B&B")return"CP ( Breakfast Included )"}}const f=l.join(" ");if(/\b(EP|ROOM\s*ONLY|ONLY\s*ROOM|EUROPEAN\s*PLAN|NO\s*MEALS?)\b/i.test(f))return"EP ( Room Only )";if(/\b(MAP|HALF\s*BOARD|BREAKFAST\s*(?:AND|&|\+)\s*DINNER)\b/i.test(f))return"MAP ( Breakfast & Dinner Included )";if(/\b(AP|FULL\s*BOARD|ALL\s*MEALS?)\b/i.test(f))return"AP ( Breakfast, Lunch & Dinner Included )";if(/\b(AI|ALL\s*INCLUSIVE)\b/i.test(f))return"AI ( All Inclusive )";if(/\b(CP|BREAKFAST(?:\s*INCLUDED)?|BED\s*&\s*BREAKFAST)\b/i.test(f))return"CP ( Breakfast Included )";const c=s[0]||e.description||e.roomType||"";return c.trim()?c.trim():"As per hotel policy"},w=y?new Date(y):new Date,M=isNaN(w.getTime())?"22nd Dec, 2026":k(w),ee=isNaN(w.getTime())?"22 Dec, 2026":W(w),O=Number(t?.nights||t?.numberOfNights||4),te=Number(t?.days||t?.numberOfDays||O+1),V=t?.endDate?new Date(t.endDate):new Date(w.getTime()+O*864e5),oe=isNaN(V.getTime())?"26th Dec, 2026":k(V),_=t?.queryId||t?.tripId||t?.query||t?.queryNumber||t?.quotationNumber;let R="QRY-4304633";if(_){const e=String(_).replace(/^#\s*/,"").trim();R=e.toUpperCase().startsWith("QRY-")?e.toUpperCase():`QRY-${e}`}else if(t?.voucherNumber){const e=String(t.voucherNumber).replace(/^VCH-?/i,"").trim();R=e?`QRY-${e}`:"QRY-001"}const N=t?.destination||"India",ie=t?.duration||`${O} Night${O>1?"s":""} / ${te} Days`,ne=t?.name||t?.guestName||t?.clientName||t?.leadTraveler||"Valued Client",P=t?.clientPhone||t?.guestPhone||t?.phone||"",re=!P||String(P).includes("8287725270")||String(P).trim()===""||String(P).trim()==="-"?"-":String(P).trim(),$=t?.passengers||t?.travelerSummary||`${t?.adults||2} Adults${Number(t?.children||0)>0?`, ${t.children} Children`:""}`,q=v||"Holiday Circuit",U=t?.issuedBy||t?.agencyName||v||"Holiday Circuit",ae=U.toLowerCase().includes("user")||U.toLowerCase().includes("guest")?q:E(U,q),se=t?.agencyPhone||"+91-8851346665",Q=Array.isArray(t?.services)&&t.services.length>0?t.services:[],le=Q.filter(e=>String(e.type||e.category||"").toLowerCase().includes("hotel")),de=Q.filter(e=>!String(e.type||e.category||"").toLowerCase().includes("hotel")),X=le,ce=X.length>0?X.map(e=>{const s=e.title||e.hotelName||e.name||`${N} Hotel`,l=e.rating||e.starRating||e.hotelCategory||e.category||"",f=e.address||e.hotelAddress||e.location||(e.city?`${e.city}, ${N}`:`${N}, India`),c=e.confirmationNumber||e.cnfNumber||e.supplierConfirmation||e.voucherNumber||(e.confirmation&&e.confirmation!=="Confirmed(Confirmed)"&&e.confirmation!=="Confirmed"&&e.confirmation!=="Pending"?e.confirmation:null),d=!!(c||e.status&&String(e.status).toLowerCase()==="confirmed"||e.confirmation&&!String(e.confirmation).toLowerCase().includes("pending")||e.isVoucherGenerated),i=d?"Confirmed":"Pending",n=c?String(c).trim():d?"Confirmed":"Pending",h=e.checkIn?new Date(e.checkIn):e.startDate?new Date(e.startDate):w,Y=h&&!isNaN(h.getTime())?k(h):M,u=h&&!isNaN(h.getTime())?W(h):ee,m=e.checkInTime||"14:00 hrs",b=e.nights||e.numberOfNights||O||1,x=e.checkOut?new Date(e.checkOut):e.endDate?new Date(e.endDate):h&&!isNaN(h.getTime())?new Date(h.getTime()+b*864e5):V,C=x&&!isNaN(x.getTime())?k(x):oe,D=e.checkOutTime||"12:00 hrs",A=Z(e),S=`${u} (${b>1?`${b} Nights`:"1 Night"}) - ${A}`,B=`${e.numberOfRooms||e.rooms||1} x ${e.roomType||e.roomCategory||"Superior King Room"}`,z=e.pax||$||"2 Pax";return`
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
              <div style="font-size: 14px; font-weight: 800; color: #000000; margin-bottom: 3px; line-height: 1.3;">
                ${s}
              </div>
              <div style="font-size: 12px; color: #334155; margin-bottom: 3px;">
                ${l}
              </div>
              <div style="font-size: 12px; color: #1e293b; line-height: 1.4; margin-bottom: 12px;">
                ${f}
              </div>
              <div style="font-size: 13px; font-weight: 800; color: #713f12; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-bottom: 12px;">
                Confirmation: ${n} <span style="font-style: italic; font-size: 12px; color: ${i==="Confirmed"?"#15803d":"#e11d48"}; font-weight: 700; margin-left: 6px;">( ${i} )</span>
              </div>

              <!-- CHECK-IN & CHECK-OUT HIGHLIGHT BOX -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #b3cae8;">
                <tr>
                  <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                    Check-in
                  </td>
                  <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                    <strong style="color: #000000;">${Y}</strong> <span style="font-style: italic; font-size: 11px; color: #334155;">at ${m}</span>
                  </td>
                  <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                    Check-out
                  </td>
                  <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                    <strong style="color: #000000;">${C} ( ${b} Night${b>1?"s":""} )</strong> <span style="font-style: italic; font-size: 11px; color: #334155;">at ${D}</span> <span style="font-style: italic; font-size: 11px; color: ${i==="Confirmed"?"#15803d":"#e11d48"}; font-weight: 700; margin-left: 4px;">( ${i} )</span>
                  </td>
                </tr>
              </table>

              <!-- NIGHT AND MEALS & ROOM TYPE SUB-TABLE -->
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #b3cae8;">
                <thead>
                  <tr style="background-color: #dce8f6;">
                    <th style="width: 60%; padding: 8px 12px; font-size: 13px; font-weight: 700; color: #000000; text-align: left; border: 1px solid #b3cae8;">
                      Night and Meals
                    </th>
                    <th style="width: 40%; padding: 8px 12px; font-size: 13px; font-weight: 700; color: #000000; text-align: left; border: 1px solid #b3cae8;">
                      Room Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                      ${S}
                    </td>
                    <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                      <div style="font-weight: 500; color: #000000;">${B}</div>
                      <div style="font-size: 11px; color: #475569; margin-top: 4px;">${z}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    `}).join(""):'<div style="padding: 16px 20px; text-align: center; color: #64748b; font-style: italic; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; margin-bottom: 20px; font-size: 13px;">No specific hotel accommodations listed for this voucher.</div>',pe=de.map(e=>{const s=String(e.type||e.category||"Service").toLowerCase(),l=e.title||e.name||e.serviceName||`${N} Service`,f=e.description||e.details||e.notes||"",c=s.includes("transfer")||s.includes("transport")||s.includes("cab")||s.includes("car"),d=String(e.usageType||e.transferType||e.tripType||e.serviceMode||e.direction||"").trim();let i="";if(d){const o=d.toLowerCase();o.includes("point")||o.includes("oneway")||o.includes("one-way")||o.includes("one way")?i="One Way (Point to Point)":o.includes("round")?i="Round Trip":o.includes("full")||o.includes("day")?i="Full Day Disposal":o.includes("half")?i="Half Day Disposal":o.includes("pickup")||o.includes("pick-up")?i="Airport / Station Pickup":o.includes("drop")?i="Airport / Station Drop":i=d}else{const o=String(l||"").toLowerCase();o.includes("round trip")||o.includes("round-trip")?i="Round Trip":o.includes("disposal")||o.includes("full day")?i="Full Day Disposal":o.includes("half day")?i="Half Day Disposal":i="One Way Transfer"}const n=e.vehicleType||e.carType||e.vehicle||(c?"Private AC Vehicle":"Standard Vehicle"),h=e.vehicleCount||e.numberOfVehicles||e.quantity||1,Y=`${h>1?`${h} x `:""}${n}`;let u=e.passengerCapacity||e.maxPassengers||e.maxPax||e.seatingCapacity||e.seats||e.paxCapacity||null,m=e.luggageCapacity||e.maxLuggage||e.luggage||e.baggageCapacity||e.bags||null;if(!u&&c){const o=String(n).toLowerCase();o.includes("sedan")||o.includes("etios")||o.includes("dzire")||o.includes("car")?u="Max 4 Pax":o.includes("innova")||o.includes("suv")||o.includes("ertiga")||o.includes("crysta")?u="Max 6 Pax":o.includes("tempo")||o.includes("van")||o.includes("minivan")?u="Max 12 Pax":o.includes("coach")||o.includes("bus")?u="Max 25 Pax":u="Max 4 Pax"}else u&&!String(u).toLowerCase().includes("pax")&&(u=`Max ${u} Pax`);if(!m&&c){const o=String(n).toLowerCase();o.includes("sedan")||o.includes("etios")||o.includes("dzire")||o.includes("car")?m="2 Bags":o.includes("innova")||o.includes("suv")||o.includes("ertiga")||o.includes("crysta")?m="4 Bags":o.includes("tempo")||o.includes("van")||o.includes("minivan")?m="8 Bags":o.includes("coach")||o.includes("bus")?m="20 Bags":m="2-3 Bags"}else m&&!String(m).toLowerCase().includes("bag")&&(m=`${m} Bags`);let b="Service",x="Service Date",C="Service Type",D=e.transferType||e.vehicleType||e.category||"Standard Service",A="Service Details",S="Pax / Vehicle Details";c?(b="Transfer",x="Transfer Date",C="Vehicle & Trip",D=`${n} (${i})`,A="Transfer Description & Route",S="Vehicle & Capacity Details"):s.includes("activity")?(b="Activity",x="Activity Date",C="Timing / Duration",D=e.timing||e.duration||e.slot||"As per schedule",A="Activity Description",S="Pax Details"):s.includes("sightseeing")?(b="Sightseeing",x="Tour Date",C="Tour Type",D=e.tourType||"Sightseeing Tour",A="Sightseeing Description",S="Pax Details"):s.includes("flight")&&(b="Flight",x="Flight Date",C="Flight / Sector",D=e.flightNumber||e.sector||"Flight Service",A="Flight Details",S="Pax Details");const B=e.confirmationNumber||e.cnfNumber||e.supplierConfirmation||e.voucherNumber||(e.confirmation&&e.confirmation!=="Confirmed(Confirmed)"&&e.confirmation!=="Confirmed"&&e.confirmation!=="Pending"?e.confirmation:null),z=!!(B||e.status&&String(e.status).toLowerCase()==="confirmed"||e.confirmation&&!String(e.confirmation).toLowerCase().includes("pending")||e.isVoucherGenerated),K=z?"Confirmed":"Pending",ge=B?String(B).trim():z?"Confirmed":"Pending",j=e.serviceDate?new Date(e.serviceDate):e.date?new Date(e.date):e.startDate?new Date(e.startDate):w,ue=j&&!isNaN(j.getTime())?k(j):M,me=e.time||e.pickupTime||e.serviceDate||"10:00 hrs",he=e.vehicleType?`${e.vehicleType} • ${$}`:e.pax||$||"2 Pax",be=`${l} - ${K==="Confirmed"?"Confirmed Service":"Service"}`;return`
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; border: 1px solid #b3cae8; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #dce8f6;">
            <th colspan="2" style="padding: 9px 14px; font-size: 13px; font-weight: 800; color: #000000; text-align: left; border: 1px solid #b3cae8; letter-spacing: 0.2px;">
              ${b}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="2" style="padding: 14px; background-color: #ffffff; border: 1px solid #b3cae8;">
              <div style="font-size: 14px; font-weight: 800; color: #000000; margin-bottom: 3px; line-height: 1.3;">
                ${l}
              </div>
              <div style="font-size: 12px; color: #334155; margin-bottom: 3px;">
                ${b} • ${N}
              </div>
              ${f?`<div style="font-size: 12px; color: #1e293b; line-height: 1.4; margin-bottom: 12px;">${f}</div>`:'<div style="margin-bottom: 8px;"></div>'}
              
              <div style="font-size: 13px; font-weight: 800; color: #713f12; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-bottom: 12px;">
                Confirmation: ${ge}
              </div>

              <!-- SERVICE DATE & DETAILS HIGHLIGHT BOX -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #b3cae8;">
                <tr>
                  <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                    ${x}
                  </td>
                  <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                    <strong style="color: #000000;">${ue}</strong> <span style="font-style: italic; font-size: 11px; color: #334155;">at ${me}</span>
                  </td>
                  <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                    ${C}
                  </td>
                  <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                    <strong style="color: #000000;">${D}</strong> <span style="font-style: italic; font-size: 11px; color: ${K==="Confirmed"?"#15803d":"#334155"}; font-weight: 600;">( ${K} )</span>
                  </td>
                </tr>
              </table>

              <!-- SERVICE SUB-TABLE -->
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #b3cae8;">
                <thead>
                  <tr style="background-color: #dce8f6;">
                    <th style="width: 58%; padding: 8px 12px; font-size: 13px; font-weight: 700; color: #000000; text-align: left; border: 1px solid #b3cae8;">
                      ${A}
                    </th>
                    <th style="width: 42%; padding: 8px 12px; font-size: 13px; font-weight: 700; color: #000000; text-align: left; border: 1px solid #b3cae8;">
                      ${S}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                      <div style="font-weight: 600; color: #000000;">${be}</div>
                      ${c?`
                        <div style="margin-top: 4px; font-size: 11px; color: #1e40af; font-weight: 600;">
                          ${i}${e.pickupLocation||e.dropLocation?` &nbsp;•&nbsp; ${e.pickupLocation||"Pickup"} ➔ ${e.dropLocation||"Drop"}`:""}
                        </div>
                      `:""}
                      ${f?`<div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">${f}</div>`:""}
                    </td>
                    <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                      ${c?`
                        <div style="font-weight: 700; color: #000000; font-size: 12px; margin-bottom: 6px;">${Y}</div>
                        <table style="width: 100%; border-collapse: collapse; font-size: 11px; color: #1e293b;">
                          <tr>
                            <td style="padding: 2px 0; color: #475569;"><strong>Passenger Capacity:</strong></td>
                            <td style="padding: 2px 0; font-weight: 700; color: #0f172a; text-align: right;">${u}</td>
                          </tr>
                          <tr>
                            <td style="padding: 2px 0; color: #475569;"><strong>Luggage Capacity:</strong></td>
                            <td style="padding: 2px 0; font-weight: 700; color: #0f172a; text-align: right;">${m}</td>
                          </tr>
                          <tr>
                            <td style="padding: 2px 0; color: #475569;"><strong>Booked Pax:</strong></td>
                            <td style="padding: 2px 0; font-weight: 700; color: #0f172a; text-align: right;">${$}</td>
                          </tr>
                        </table>
                      `:`
                        <div style="font-weight: 600; color: #000000;">${he}</div>
                        <div style="font-size: 11px; color: #475569; margin-top: 4px;"><strong>Booked Pax:</strong> ${$}</div>
                      `}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    `}).join(""),I=t?.termsAndConditions||t?.terms||[];let L=[];Array.isArray(I)?L=I.filter(e=>typeof e=="string"&&e.trim().length>0):typeof I=="string"&&I.trim()&&(L=I.split(`
`).map(e=>e.trim()).filter(e=>e.length>0)),L.length===0&&(L=ye);const fe=L.length>0?`
    <!-- TERMS & CONDITIONS SECTION -->
    <div style="margin-top: 18px; margin-bottom: 18px; font-family: Arial, sans-serif;">
      <div style="font-size: 13.5px; font-weight: 800; color: #9a3412; margin-bottom: 8px;">
        Terms &amp; Conditions:
      </div>
      <ol style="margin: 0; padding-left: 20px; font-size: 11.5px; color: #1e293b; line-height: 1.65;">
        ${L.map(e=>`<li style="margin-bottom: 5px;">${e.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</li>`).join("")}
      </ol>
    </div>
  `:"";return`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Travel Voucher - ${R}</title>
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
              ${F&&H?`<img src="${H}" alt="${v||"Agent"} Logo" class="brand-logo">`:F?`<div style="font-size: 24px; font-weight: 800; color: #0f1d32;">${(v||"A").charAt(0).toUpperCase()}</div>`:p?`<img src="${xe}" alt="Holiday Circuit Logo" class="brand-logo">`:'<div style="font-size: 24px; font-weight: 800; color: #0f1d32;">TV</div>'}
            </div>
            <div class="brand-name">${F?v||"Travel Voucher":p?"Holiday Circuit":"Travel Voucher"}</div>
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
                    Trip ID: ${R}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; width: 18%; font-weight: 500; border: 1px solid #b3cae8;">Start Date</td>
                  <td style="padding: 8px 12px; color: #000000; width: 32%; font-weight: 700; border: 1px solid #b3cae8;">${M}</td>
                  <td style="padding: 8px 12px; color: #1e293b; width: 20%; font-weight: 500; border: 1px solid #b3cae8;">Trip Duration</td>
                  <td style="padding: 8px 12px; color: #000000; width: 30%; font-weight: 700; border: 1px solid #b3cae8;">${ie}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Destination</td>
                  <td colspan="3" style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">${N}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Guest Name</td>
                  <td style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">${ne}</td>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Guest Ph.</td>
                  <td style="padding: 8px 12px; color: #000000; font-weight: 600; border: 1px solid #b3cae8;">${re}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Pax Details</td>
                  <td colspan="3" style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">${$}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">Issued By</td>
                  <td colspan="3" style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">${ae}</td>
                </tr>
              </tbody>
            </table>

            <!-- HOTELS SECTION -->
            ${ce}

            <!-- TRANSFERS & ACTIVITIES SECTION -->
            ${pe}

            <!-- TERMS & CONDITIONS SECTION -->
            ${fe}

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
          ${g?`
            <div style="width:100%; margin-top:16px; text-align:center;">
              <img src="${g}" alt="Footer Banner" style="width:100%; max-width:100%; height:auto; display:block;" />
            </div>
          `:`
            <div class="brand-footer">
              <div class="footer-info">
                <div class="footer-item">Phone: ${t.agencyPhone||se} | Email: ${t.agencyEmail||"ops@holidaycircuit.com"}</div>
              </div>
              <div class="footer-address">
                ${t.agencyAddress||"2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058"}
              </div>
            </div>
          `}
        </div>
      </body>
    </html>
  `};export{Ae as b,Ce as f,De as g,J as p};
