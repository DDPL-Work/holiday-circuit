const we="https://res.cloudinary.com/dszadvuz6/image/upload/e_trim/v1777932524/unzssx1sjkrigbgldg7h.png",De=["Welcome to Holiday Circuit. These Terms and Conditions govern your use of the Holiday Circuit services. When You Make a booking or reservation, you agree to be bound by these Terms.","Bookings and Reservations","Booking Process: When you make a booking or reservation through Holiday Circuit, you agree to provide accurate and complete information. Any discrepancies or errors in the information you provide may result in the cancellation of your booking.","Payment: Payments for bookings are due as specified during the booking process. Failure to make payments on time may result in the cancellation of your booking.","Cancellations and Refunds: Cancellation and refund policies vary depending on the type of booking. Please refer to the specific cancellation policy provided at the time of booking. Holiday Circuit reserves the right to charge cancellation fees as applicable.","Intellectual Property","Ownership: All content, trademarks, logos, and intellectual property on the Holiday Circuit website and app are the property of Holiday Circuit or its licensors. You may not use, reproduce, or distribute our content without prior written permission.","Changes to Terms and Conditions: We reserve the right to update and modify these Terms and Conditions at any time. Please review them periodically for changes. Your continued use of our services after any modifications indicates your acceptance of the updated Terms.","By booking with Holiday Circuit, you acknowledge that you have read, understood, and agreed to these Terms and Conditions."],Te=(t="")=>{const l=String(t||"").trim().toLowerCase();return l?l==="hotel"?"Hotel":l==="transfer"||l==="transport"||l==="car"?"Transport":l==="activity"?"Activity":l==="sightseeing"?"Sightseeing":l==="flight"?"Flight":l.replace(/\b\w/g,r=>r.toUpperCase()):"Service"},re=t=>{if(!t)return[];if(Array.isArray(t)){const l=[];return t.forEach(r=>{if(typeof r=="string")if(/<[a-z][\s\S]*>/i.test(r))l.push(...re(r));else{const f=r.replace(/^\d+[\.\)]\s*/,"").trim();f&&l.push(f)}else if(r&&typeof r=="object"){const f=r.content||r.text||r.name||r.item||r.label||"";f&&l.push(...re(f))}}),l.filter(Boolean)}if(typeof t!="string")return[];if(/<[a-z][\s\S]*>/i.test(t))try{const l=new DOMParser().parseFromString(t,"text/html"),r=[],f=m=>{if(m&&m.nodeType===Node.ELEMENT_NODE){const $=m.tagName.toLowerCase();if(["ul","ol"].includes($))Array.from(m.childNodes).forEach(f);else if(["p","h1","h2","h3","h4","h5","h6","li","blockquote","div"].includes($)){const T=(m.textContent||"").replace(/^\d+[\.\)]\s*/,"").trim();T&&!r.includes(T)&&r.push(T)}else Array.from(m.childNodes).forEach(f)}};return Array.from(l.body.childNodes).forEach(f),r.length>0?r:(l.body.textContent||"").trim().split(`
`).map(m=>m.replace(/^\d+[\.\)]\s*/,"").trim()).filter(Boolean)}catch{return t.replace(/<br\s*[\/]?>/gi,`
`).replace(/<\/p>/gi,`
`).replace(/<\/li>/gi,`
`).replace(/<[^>]+>/g,"").split(`
`).map(r=>r.replace(/^\d+[\.\)]\s*/,"").trim()).filter(Boolean)}return t.split(`
`).map(l=>l.replace(/^\d+[\.\)]\s*/,"").trim()).filter(Boolean)},Ae=(t=[],l=!1)=>{const r=(t||[]).filter(w=>!String(w?.title||w?.name||"").trim()),f=(t||[]).filter(w=>{const m=String(w?.confirmation||"").trim().toLowerCase();return!m||m==="pending"});return t.length?r.length&&f.length?{tone:"red",title:"Services And Confirmations Missing",message:"Some voucher services are missing and some DMC confirmation numbers are still pending. Client sharing will stay blocked until both are complete.",canSend:!1}:r.length?{tone:"red",title:"Service Details Missing",message:"Some voucher services are missing. Complete all service names before sending the voucher to the client.",canSend:!1}:f.length?{tone:"red",title:"DMC Confirmation Pending",message:"Some DMC confirmation numbers are still pending. Client sharing will stay blocked until all confirmations are updated.",canSend:!1}:l?{tone:"green",title:"Voucher Already Shared",message:"This voucher has already been sent successfully. You can review or download the final shared copy here.",canSend:!1}:{tone:"green",title:"Client Ready To Send",message:"All services and DMC confirmation numbers are available. This voucher is ready to share with the client.",canSend:!0}:{tone:"red",title:"Voucher Services Missing",message:"No services are mapped in this voucher yet. Add services before sending it to the client.",canSend:!1}},Ne=(t,l,r={})=>{const f=l==="with",w=t?.travelDate||t?.startDate||t?.date||null,m=String(t?.voucherFooterImage||t?.footerBanner||t?.pdfFooterImage||t?.agentFooterImage||"").trim(),$=(e,a="Holiday Circuit")=>{const s=String(e||"").trim();return s||a},T=String(r?.name||r?.brandingName||r?.companyName||t?.agentName||t?.agencyName||"").trim(),D=T?$(T,"Holiday Circuit"):"",X=!D||D.toLowerCase()==="holiday circuit",U=X?"":String(r?.logo||t?.agentLogo||"").trim(),Y=f&&!X&&!!(U||D),L=e=>{if(!e||isNaN(new Date(e).getTime()))return"-";const a=new Date(e),s=a.getDate(),g=a.toLocaleString("en-US",{month:"short"}),c=a.getFullYear();let d="th";return s%10===1&&s!==11?d="st":s%10===2&&s!==12?d="nd":s%10===3&&s!==13&&(d="rd"),`${s}${d} ${g}, ${c}`},J=e=>{if(!e||isNaN(new Date(e).getTime()))return"-";const a=new Date(e),s=a.getDate(),g=a.toLocaleString("en-US",{month:"short"}),c=a.getFullYear();return`${s} ${g}, ${c}`},ae=e=>{let a=String(e).replace(/\(.*?\)/g,"").trim();return a=a.replace(/^(standard|deluxe|executive|superior|suite|family|classic)\s*room$/i,"$1 Room"),a||"Standard Room"},se=(e={})=>{const a=[e.mealPlan,e.meal_plan,e.meal,e.meals,e.mealType].filter(d=>typeof d=="string"&&d.trim().length>0);for(const d of a){const i=d.trim().toUpperCase();if(i==="EP"||i.includes("ROOM ONLY")||i.includes("ONLY ROOM")||i.includes("NO MEAL"))return"EP ( Room Only )";if(i==="MAP"||i.includes("HALF BOARD")||i.includes("BREAKFAST & DINNER")||i.includes("BREAKFAST AND DINNER")||i.includes("BREAKFAST + DINNER"))return"MAP ( Breakfast & Dinner Included )";if(i==="AP"||i.includes("FULL BOARD")||i.includes("ALL MEAL"))return"AP ( Breakfast, Lunch & Dinner Included )";if(i==="AI"||i.includes("ALL INCLUSIVE"))return"AI ( All Inclusive )";if(i==="CP"||i.includes("BREAKFAST")||i.includes("BED & BREAKFAST")||i.includes("B&B"))return"CP ( Breakfast Included )"}const s=[e.description,e.roomDescription,e.hotelDescription,e.roomType,e.roomCategory,e.inclusions,e.notes].filter(Boolean);for(const d of s){const i=String(d).split("|").map(n=>n.trim().toUpperCase());for(const n of i){if(n==="EP"||n==="ROOM ONLY"||n==="ONLY ROOM"||n==="NO MEALS"||n==="NO MEAL")return"EP ( Room Only )";if(n==="MAP"||n==="HALF BOARD"||n==="BREAKFAST & DINNER"||n==="BREAKFAST AND DINNER"||n==="BREAKFAST + DINNER")return"MAP ( Breakfast & Dinner Included )";if(n==="AP"||n==="FULL BOARD"||n==="ALL MEALS"||n==="ALL MEAL")return"AP ( Breakfast, Lunch & Dinner Included )";if(n==="AI"||n==="ALL INCLUSIVE")return"AI ( All Inclusive )";if(n==="CP"||n==="BREAKFAST INCLUDED"||n==="BREAKFAST"||n==="BED & BREAKFAST"||n==="B&B")return"CP ( Breakfast Included )"}}const g=s.join(" ");if(/\b(EP|ROOM\s*ONLY|ONLY\s*ROOM|EUROPEAN\s*PLAN|NO\s*MEALS?)\b/i.test(g))return"EP ( Room Only )";if(/\b(MAP|HALF\s*BOARD|BREAKFAST\s*(?:AND|&|\+)\s*DINNER)\b/i.test(g))return"MAP ( Breakfast & Dinner Included )";if(/\b(AP|FULL\s*BOARD|ALL\s*MEALS?)\b/i.test(g))return"AP ( Breakfast, Lunch & Dinner Included )";if(/\b(AI|ALL\s*INCLUSIVE)\b/i.test(g))return"AI ( All Inclusive )";if(/\b(CP|BREAKFAST(?:\s*INCLUDED)?|BED\s*&\s*BREAKFAST)\b/i.test(g))return"CP ( Breakfast Included )";const c=a[0]||e.description||e.roomType||"";return c.trim()?c.trim():"As per hotel policy"},x=w?new Date(w):new Date,K=isNaN(x.getTime())?"22nd Dec, 2026":L(x),le=isNaN(x.getTime())?"22 Dec, 2026":J(x),E=Number(t?.nights||t?.numberOfNights||4),de=Number(t?.days||t?.numberOfDays||E+1),Z=t?.endDate?new Date(t.endDate):new Date(x.getTime()+E*864e5),ce=isNaN(Z.getTime())?"26th Dec, 2026":L(Z),ee=t?.queryId||t?.tripId||t?.query||t?.queryNumber||t?.quotationNumber;let F="QRY-4304633";if(ee){const e=String(ee).replace(/^#\s*/,"").trim();F=e.toUpperCase().startsWith("QRY-")?e.toUpperCase():`QRY-${e}`}else if(t?.voucherNumber){const e=String(t.voucherNumber).replace(/^VCH-?/i,"").trim();F=e?`QRY-${e}`:"QRY-001"}const k=t?.destination||"India",pe=t?.duration||`${E} Night${E>1?"s":""} / ${de} Days`,fe=t?.name||t?.guestName||t?.clientName||t?.leadTraveler||"Valued Client",O=t?.clientPhone||t?.guestPhone||t?.phone||"",ge=!O||String(O).includes("8287725270")||String(O).trim()===""||String(O).trim()==="-"?"-":String(O).trim(),A=t?.passengers||t?.travelerSummary||`${t?.adults||2} Adults${Number(t?.children||0)>0?`, ${t.children} Children`:""}`,te=D||"Holiday Circuit",j=t?.issuedBy||t?.agencyName||D||"Holiday Circuit",ue=j.toLowerCase().includes("user")||j.toLowerCase().includes("guest")?te:$(j,te),me=t?.agencyPhone||"+91-8851346665",oe=Array.isArray(t?.services)&&t.services.length>0?t.services:[],be=oe.filter(e=>String(e.type||e.category||"").toLowerCase().includes("hotel")),he=oe.filter(e=>!String(e.type||e.category||"").toLowerCase().includes("hotel")),I=be;let ie=x&&!isNaN(x.getTime())?new Date(x.getTime()):new Date;const xe=I.length>0?I.map((e,a)=>{const s=String(e.title||"").trim(),g=String(e.hotelName||e.hotel||"").trim(),c=String(e.serviceName||e.name||"").trim(),d=g||(s&&!s.toLowerCase().includes("hotel stay")&&!s.toLowerCase().includes("service")?s:c||"Hotel Accommodation"),i=c&&c!==d?c:s&&s!==d?s:"",n=e.rating||e.starRating||e.hotelCategory||e.category||"",M=e.address||e.hotelAddress||e.location||(e.city?`${e.city}, ${k}`:`${k}, India`),B=e.description||e.hotelDescription||e.details||"",u=e.confirmationNumber||e.cnfNumber||e.supplierConfirmation||e.voucherNumber||(e.confirmation&&e.confirmation!=="Confirmed(Confirmed)"&&e.confirmation!=="Confirmed"&&e.confirmation!=="Pending"?e.confirmation:null),b=!!(u||e.status&&String(e.status).toLowerCase()==="confirmed"||e.confirmation&&!String(e.confirmation).toLowerCase().includes("pending")||e.isVoucherGenerated),y=b?"Confirmed":"Pending",C=u?String(u).trim():b?"Confirmed":"Pending",v=Number(e.nights||e.numberOfNights||(I.length>1?2:E)||2);let p;e.checkIn?p=new Date(e.checkIn):e.startDate&&a===0?p=new Date(e.startDate):e.startDate&&e.startDate!==t?.startDate&&e.startDate!==t?.travelDate?p=new Date(e.startDate):a>0?p=new Date(ie.getTime()):p=x&&!isNaN(x.getTime())?x:new Date;let h;e.checkOut?h=new Date(e.checkOut):e.endDate&&a===I.length-1&&I.length===1?h=new Date(e.endDate):e.endDate&&e.endDate!==t?.endDate?h=new Date(e.endDate):h=new Date(p.getTime()+v*864e5),ie=new Date(h.getTime());const S=p&&!isNaN(p.getTime())?L(p):K,R=p&&!isNaN(p.getTime())?J(p):le,V=e.checkInTime||"14:00 hrs",z=h&&!isNaN(h.getTime())?L(h):ce,G=e.checkOutTime||"12:00 hrs",H=se(e),W=`${R} (${v>1?`${v} Nights`:"1 Night"}) - ${H}`,_=e.roomType||e.roomCategory||"Standard Room",q=ae(_),Q=`${e.numberOfRooms||e.rooms||1} x ${q}`,o=e.pax||A||"2 Adults",ne=e.roomDescription||e.roomDetails||"";return`
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
                ${d}
              </div>
              ${i?`<div style="font-size: 12px; font-weight: 700; color: #2B5083; margin-bottom: 3px;">Service: ${i}</div>`:""}
              <div style="font-size: 12px; color: #334155; margin-bottom: 3px;">
                ${n}
              </div>
              <div style="font-size: 12px; color: #1e293b; line-height: 1.4; margin-bottom: ${B?"6px":"12px"};">
                ${M}
              </div>
              ${B?`<div style="font-size: 11px; color: #475569; line-height: 1.4; margin-bottom: 12px;">${B}</div>`:""}
              <div style="font-size: 13px; font-weight: 800; color: #713f12; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-bottom: 12px;">
                Confirmation: ${C} <span style="font-style: italic; font-size: 12px; color: ${y==="Confirmed"?"#15803d":"#e11d48"}; font-weight: 700; margin-left: 6px;">( ${y} )</span>
              </div>

              <!-- CHECK-IN & CHECK-OUT HIGHLIGHT BOX -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #b3cae8;">
                <tr>
                  <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                    Check-in
                  </td>
                  <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                    <strong style="color: #000000;">${S}</strong> <span style="font-style: italic; font-size: 11px; color: #334155;">at ${V}</span>
                  </td>
                  <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                    Check-out
                  </td>
                  <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                    <strong style="color: #000000;">${z} ( ${v} Night${v>1?"s":""} )</strong> <span style="font-style: italic; font-size: 11px; color: #334155;">at ${G}</span> <span style="font-style: italic; font-size: 11px; color: ${y==="Confirmed"?"#15803d":"#e11d48"}; font-weight: 700; margin-left: 4px;">( ${y} )</span>
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
                      <div style="font-weight: 600; color: #000000;">${W}</div>
                      ${e.mealDescription?`<div style="font-size: 11px; color: #475569; margin-top: 4px;">${e.mealDescription}</div>`:""}
                    </td>
                    <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                      <div style="font-weight: 700; color: #000000;">${Q}</div>
                      <div style="font-size: 11px; color: #475569; margin-top: 4px;">${o}</div>
                      ${ne?`<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${ne}</div>`:""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    `}).join(""):'<div style="padding: 16px 20px; text-align: center; color: #64748b; font-style: italic; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; margin-bottom: 20px; font-size: 13px;">No specific hotel accommodations listed for this voucher.</div>',ye=he.map(e=>{const a=String(e.type||e.category||"Service").toLowerCase(),s=e.title||e.name||e.serviceName||`${k} Service`,g=e.description||e.details||e.notes||"",c=a.includes("transfer")||a.includes("transport")||a.includes("cab")||a.includes("car"),d=String(e.usageType||e.transferType||e.tripType||e.serviceMode||e.direction||"").trim();let i="";if(d){const o=d.toLowerCase();o.includes("point")||o.includes("oneway")||o.includes("one-way")||o.includes("one way")?i="One Way (Point to Point)":o.includes("round")?i="Round Trip":o.includes("full")||o.includes("day")?i="Full Day Disposal":o.includes("half")?i="Half Day Disposal":o.includes("pickup")||o.includes("pick-up")?i="Airport / Station Pickup":o.includes("drop")?i="Airport / Station Drop":i=d}else{const o=String(s||"").toLowerCase();o.includes("round trip")||o.includes("round-trip")?i="Round Trip":o.includes("disposal")||o.includes("full day")?i="Full Day Disposal":o.includes("half day")?i="Half Day Disposal":i="One Way Transfer"}const n=e.vehicleType||e.carType||e.vehicle||(c?"Private AC Vehicle":"Standard Vehicle"),M=e.vehicleCount||e.numberOfVehicles||e.quantity||1,B=`${M>1?`${M} x `:""}${n}`;let u=e.passengerCapacity||e.maxPassengers||e.maxPax||e.seatingCapacity||e.seats||e.paxCapacity||null,b=e.luggageCapacity||e.maxLuggage||e.luggage||e.baggageCapacity||e.bags||null;if(!u&&c){const o=String(n).toLowerCase();o.includes("sedan")||o.includes("etios")||o.includes("dzire")||o.includes("car")?u="Max 4 Pax":o.includes("innova")||o.includes("suv")||o.includes("ertiga")||o.includes("crysta")?u="Max 6 Pax":o.includes("tempo")||o.includes("van")||o.includes("minivan")?u="Max 12 Pax":o.includes("coach")||o.includes("bus")?u="Max 25 Pax":u="Max 4 Pax"}else u&&!String(u).toLowerCase().includes("pax")&&(u=`Max ${u} Pax`);if(!b&&c){const o=String(n).toLowerCase();o.includes("sedan")||o.includes("etios")||o.includes("dzire")||o.includes("car")?b="2 Bags":o.includes("innova")||o.includes("suv")||o.includes("ertiga")||o.includes("crysta")?b="4 Bags":o.includes("tempo")||o.includes("van")||o.includes("minivan")?b="8 Bags":o.includes("coach")||o.includes("bus")?b="20 Bags":b="2-3 Bags"}else b&&!String(b).toLowerCase().includes("bag")&&(b=`${b} Bags`);let y="Service",C="Service Date",v="Service Type",p=e.transferType||e.vehicleType||e.category||"Standard Service",h="Service Details",S="Pax / Vehicle Details";c?(y="Transfer",C="Transfer Date",v="Vehicle & Trip",p=`${n} (${i})`,h="Transfer Description & Route",S="Vehicle & Capacity Details"):a.includes("activity")?(y="Activity",C="Activity Date",v="Timing / Duration",p=e.timing||e.duration||e.slot||"As per schedule",h="Activity Description",S="Pax Details"):a.includes("sightseeing")?(y="Sightseeing",C="Tour Date",v="Tour Type",p=e.tourType||"Sightseeing Tour",h="Sightseeing Description",S="Pax Details"):a.includes("flight")&&(y="Flight",C="Flight Date",v="Flight / Sector",p=e.flightNumber||e.sector||"Flight Service",h="Flight Details",S="Pax Details");const R=e.confirmationNumber||e.cnfNumber||e.supplierConfirmation||e.voucherNumber||(e.confirmation&&e.confirmation!=="Confirmed(Confirmed)"&&e.confirmation!=="Confirmed"&&e.confirmation!=="Pending"?e.confirmation:null),V=!!(R||e.status&&String(e.status).toLowerCase()==="confirmed"||e.confirmation&&!String(e.confirmation).toLowerCase().includes("pending")||e.isVoucherGenerated),z=V?"Confirmed":"Pending",G=R?String(R).trim():V?"Confirmed":"Pending",H=e.serviceDate?new Date(e.serviceDate):e.date?new Date(e.date):e.startDate?new Date(e.startDate):x,W=H&&!isNaN(H.getTime())?L(H):K,_=e.time||e.pickupTime||e.serviceDate||"10:00 hrs",q=e.vehicleType?`${e.vehicleType} • ${A}`:e.pax||A||"2 Pax",Q=`${s} - ${z==="Confirmed"?"Confirmed Service":"Service"}`;return`
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; border: 1px solid #b3cae8; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #dce8f6;">
            <th colspan="2" style="padding: 9px 14px; font-size: 13px; font-weight: 800; color: #000000; text-align: left; border: 1px solid #b3cae8; letter-spacing: 0.2px;">
              ${y}
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
                ${y} • ${k}
              </div>
              ${g?`<div style="font-size: 12px; color: #1e293b; line-height: 1.4; margin-bottom: 12px;">${g}</div>`:'<div style="margin-bottom: 8px;"></div>'}
              
              <div style="font-size: 13px; font-weight: 800; color: #713f12; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-bottom: 12px;">
                Confirmation: ${G}
              </div>

              <!-- SERVICE DATE & DETAILS HIGHLIGHT BOX -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #b3cae8;">
                <tr>
                  <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                    ${C}
                  </td>
                  <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                    <strong style="color: #000000;">${W}</strong> <span style="font-style: italic; font-size: 11px; color: #334155;">at ${_}</span>
                  </td>
                  <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                    ${v}
                  </td>
                  <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                    <strong style="color: #000000;">${p}</strong> <span style="font-style: italic; font-size: 11px; color: ${z==="Confirmed"?"#15803d":"#334155"}; font-weight: 600;">( ${z} )</span>
                  </td>
                </tr>
              </table>

              <!-- SERVICE SUB-TABLE -->
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #b3cae8;">
                <thead>
                  <tr style="background-color: #dce8f6;">
                    <th style="width: 58%; padding: 8px 12px; font-size: 13px; font-weight: 700; color: #000000; text-align: left; border: 1px solid #b3cae8;">
                      ${h}
                    </th>
                    <th style="width: 42%; padding: 8px 12px; font-size: 13px; font-weight: 700; color: #000000; text-align: left; border: 1px solid #b3cae8;">
                      ${S}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                      <div style="font-weight: 600; color: #000000;">${Q}</div>
                      ${c?`
                        <div style="margin-top: 4px; font-size: 11px; color: #1e40af; font-weight: 600;">
                          ${i}${e.pickupLocation||e.dropLocation?` &nbsp;•&nbsp; ${e.pickupLocation||"Pickup"} ➔ ${e.dropLocation||"Drop"}`:""}
                        </div>
                      `:""}
                      ${g?`<div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">${g}</div>`:""}
                    </td>
                    <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                      ${c?`
                        <div style="font-weight: 700; color: #000000; font-size: 12px; margin-bottom: 6px;">${B}</div>
                        <table style="width: 100%; border-collapse: collapse; font-size: 11px; color: #1e293b;">
                          <tr>
                            <td style="padding: 2px 0; color: #475569;"><strong>Passenger Capacity:</strong></td>
                            <td style="padding: 2px 0; font-weight: 700; color: #0f172a; text-align: right;">${u}</td>
                          </tr>
                          <tr>
                            <td style="padding: 2px 0; color: #475569;"><strong>Luggage Capacity:</strong></td>
                            <td style="padding: 2px 0; font-weight: 700; color: #0f172a; text-align: right;">${b}</td>
                          </tr>
                          <tr>
                            <td style="padding: 2px 0; color: #475569;"><strong>Booked Pax:</strong></td>
                            <td style="padding: 2px 0; font-weight: 700; color: #0f172a; text-align: right;">${A}</td>
                          </tr>
                        </table>
                      `:`
                        <div style="font-weight: 600; color: #000000;">${q}</div>
                        <div style="font-size: 11px; color: #475569; margin-top: 4px;"><strong>Booked Pax:</strong> ${A}</div>
                      `}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    `}).join(""),P=t?.termsAndConditions||t?.terms||[];let N=[];Array.isArray(P)?N=P.filter(e=>typeof e=="string"&&e.trim().length>0):typeof P=="string"&&P.trim()&&(N=P.split(`
`).map(e=>e.trim()).filter(e=>e.length>0)),N.length===0&&(N=De);const ve=N.length>0?`
    <!-- TERMS & CONDITIONS SECTION -->
    <div style="margin-top: 18px; margin-bottom: 18px; font-family: Arial, sans-serif;">
      <div style="font-size: 13.5px; font-weight: 800; color: #9a3412; margin-bottom: 8px;">
        Terms &amp; Conditions:
      </div>
      <ol style="margin: 0; padding-left: 20px; font-size: 11.5px; color: #1e293b; line-height: 1.65;">
        ${N.map(e=>`<li style="margin-bottom: 5px;">${e.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</li>`).join("")}
      </ol>
    </div>
  `:"";return`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Travel Voucher - ${F}</title>
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
              ${Y&&U?`<img src="${U}" alt="${D||"Agent"} Logo" class="brand-logo">`:Y?`<div style="font-size: 24px; font-weight: 800; color: #0f1d32;">${(D||"A").charAt(0).toUpperCase()}</div>`:f?`<img src="${we}" alt="Holiday Circuit Logo" class="brand-logo">`:'<div style="font-size: 24px; font-weight: 800; color: #0f1d32;">TV</div>'}
            </div>
            <div class="brand-name">${Y?D||"Travel Voucher":f?"Holiday Circuit":"Travel Voucher"}</div>
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
                    Trip ID: ${F}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; width: 18%; font-weight: 500; border: 1px solid #b3cae8;">Start Date</td>
                  <td style="padding: 8px 12px; color: #000000; width: 32%; font-weight: 700; border: 1px solid #b3cae8;">${K}</td>
                  <td style="padding: 8px 12px; color: #1e293b; width: 20%; font-weight: 500; border: 1px solid #b3cae8;">Trip Duration</td>
                  <td style="padding: 8px 12px; color: #000000; width: 30%; font-weight: 700; border: 1px solid #b3cae8;">${pe}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Destination</td>
                  <td colspan="3" style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">${k}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Guest Name</td>
                  <td style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">${fe}</td>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Guest Ph.</td>
                  <td style="padding: 8px 12px; color: #000000; font-weight: 600; border: 1px solid #b3cae8;">${ge}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Pax Details</td>
                  <td colspan="3" style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">${A}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">Issued By</td>
                  <td colspan="3" style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">${ue}</td>
                </tr>
              </tbody>
            </table>

            <!-- HOTELS SECTION -->
            ${xe}

            <!-- TRANSFERS & ACTIVITIES SECTION -->
            ${ye}

            <!-- TERMS & CONDITIONS SECTION -->
            ${ve}

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
          ${m?`
            <div style="width:100%; margin-top:16px; text-align:center;">
              <img src="${m}" alt="Footer Banner" style="width:100%; max-width:100%; height:auto; display:block;" />
            </div>
          `:`
            <div class="brand-footer">
              <div class="footer-info">
                <div class="footer-item">Phone: ${t.agencyPhone||me} | Email: ${t.agencyEmail||"ops@holidaycircuit.com"}</div>
              </div>
              <div class="footer-address">
                ${t.agencyAddress||"2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058"}
              </div>
            </div>
          `}
        </div>
      </body>
    </html>
  `};export{De as D,Ne as b,Te as f,Ae as g,re as p};
