const we="https://res.cloudinary.com/dszadvuz6/image/upload/e_trim/v1777932524/unzssx1sjkrigbgldg7h.png",Ae=(t="")=>{const l=String(t||"").trim().toLowerCase();return l?l==="hotel"?"Hotel":l==="transfer"||l==="transport"||l==="car"?"Transport":l==="activity"?"Activity":l==="sightseeing"?"Sightseeing":l==="flight"?"Flight":l.replace(/\b\w/g,r=>r.toUpperCase()):"Service"},se=t=>{if(!t)return[];if(Array.isArray(t)){const l=[];return t.forEach(r=>{if(typeof r=="string")if(/<[a-z][\s\S]*>/i.test(r))l.push(...se(r));else{const p=r.replace(/^\d+[\.\)]\s*/,"").trim();p&&l.push(p)}else if(r&&typeof r=="object"){const p=r.content||r.text||r.name||r.item||r.label||"";p&&l.push(...se(p))}}),l.filter(Boolean)}if(typeof t!="string")return[];if(/<[a-z][\s\S]*>/i.test(t))try{const l=new DOMParser().parseFromString(t,"text/html"),r=[],p=m=>{if(m&&m.nodeType===Node.ELEMENT_NODE){const L=m.tagName.toLowerCase();if(["ul","ol"].includes(L))Array.from(m.childNodes).forEach(p);else if(["p","h1","h2","h3","h4","h5","h6","li","blockquote","div"].includes(L)){const C=(m.textContent||"").replace(/^\d+[\.\)]\s*/,"").trim();C&&!r.includes(C)&&r.push(C)}else Array.from(m.childNodes).forEach(p)}};return Array.from(l.body.childNodes).forEach(p),r.length>0?r:(l.body.textContent||"").trim().split(`
`).map(m=>m.replace(/^\d+[\.\)]\s*/,"").trim()).filter(Boolean)}catch{return t.replace(/<br\s*[\/]?>/gi,`
`).replace(/<\/p>/gi,`
`).replace(/<\/li>/gi,`
`).replace(/<[^>]+>/g,"").split(`
`).map(r=>r.replace(/^\d+[\.\)]\s*/,"").trim()).filter(Boolean)}return t.split(`
`).map(l=>l.replace(/^\d+[\.\)]\s*/,"").trim()).filter(Boolean)},Te=(t=[],l=!1)=>{const r=(t||[]).filter(v=>!String(v?.title||v?.name||"").trim()),p=(t||[]).filter(v=>{const m=String(v?.confirmation||"").trim().toLowerCase();return!m||m==="pending"});return t.length?r.length&&p.length?{tone:"red",title:"Services And Confirmations Missing",message:"Some voucher services are missing and some DMC confirmation numbers are still pending. Client sharing will stay blocked until both are complete.",canSend:!1}:r.length?{tone:"red",title:"Service Details Missing",message:"Some voucher services are missing. Complete all service names before sending the voucher to the client.",canSend:!1}:p.length?{tone:"red",title:"DMC Confirmation Pending",message:"Some DMC confirmation numbers are still pending. Client sharing will stay blocked until all confirmations are updated.",canSend:!1}:l?{tone:"green",title:"Voucher Already Shared",message:"This voucher has already been sent successfully. You can review or download the final shared copy here.",canSend:!1}:{tone:"green",title:"Client Ready To Send",message:"All services and DMC confirmation numbers are available. This voucher is ready to share with the client.",canSend:!0}:{tone:"red",title:"Voucher Services Missing",message:"No services are mapped in this voucher yet. Add services before sending it to the client.",canSend:!1}},Ce=(t,l,r={})=>{const p=l==="with",v=t?.travelDate||t?.startDate||t?.date||null,m=String(t?.voucherFooterImage||t?.footerBanner||t?.pdfFooterImage||t?.agentFooterImage||"").trim(),L=(e,s="Holiday Circuit")=>{const a=String(e||"").trim();return a||s},C=String(r?.name||r?.brandingName||r?.companyName||t?.agentName||t?.agencyName||"").trim(),w=C?L(C,"Holiday Circuit"):"",J=!w||w.toLowerCase()==="holiday circuit",U=J?"":String(r?.logo||t?.agentLogo||"").trim(),K=p&&!J&&!!(U||w),E=e=>{if(!e||isNaN(new Date(e).getTime()))return"-";const s=new Date(e),a=s.getDate(),f=s.toLocaleString("en-US",{month:"short"}),d=s.getFullYear();let n="th";return a%10===1&&a!==11?n="st":a%10===2&&a!==12?n="nd":a%10===3&&a!==13&&(n="rd"),`${a}${n} ${f}, ${d}`},Z=e=>{if(!e||isNaN(new Date(e).getTime()))return"-";const s=new Date(e),a=s.getDate(),f=s.toLocaleString("en-US",{month:"short"}),d=s.getFullYear();return`${a} ${f}, ${d}`},ae=e=>{let s=String(e).replace(/\(.*?\)/g,"").trim();return s=s.replace(/^(standard|deluxe|executive|superior|suite|family|classic)\s*room$/i,"$1 Room"),s||"Standard Room"},le=(e={})=>{const s=[e.mealPlan,e.meal_plan,e.meal,e.meals,e.mealType].filter(d=>typeof d=="string"&&d.trim().length>0);for(const d of s){const n=d.trim().toUpperCase();if(n==="EP"||n.includes("ROOM ONLY")||n.includes("ONLY ROOM")||n.includes("NO MEAL"))return"EP ( Room Only )";if(n==="MAP"||n.includes("HALF BOARD")||n.includes("BREAKFAST & DINNER")||n.includes("BREAKFAST AND DINNER")||n.includes("BREAKFAST + DINNER"))return"MAP ( Breakfast & Dinner Included )";if(n==="AP"||n.includes("FULL BOARD")||n.includes("ALL MEAL"))return"AP ( Breakfast, Lunch & Dinner Included )";if(n==="AI"||n.includes("ALL INCLUSIVE"))return"AI ( All Inclusive )";if(n==="CP"||n.includes("BREAKFAST")||n.includes("BED & BREAKFAST")||n.includes("B&B"))return"CP ( Breakfast Included )"}const a=[e.description,e.roomDescription,e.hotelDescription,e.roomType,e.roomCategory,e.inclusions,e.notes].filter(Boolean);for(const d of a){const n=String(d).split("|").map(o=>o.trim().toUpperCase());for(const o of n){if(o==="EP"||o==="ROOM ONLY"||o==="ONLY ROOM"||o==="NO MEALS"||o==="NO MEAL")return"EP ( Room Only )";if(o==="MAP"||o==="HALF BOARD"||o==="BREAKFAST & DINNER"||o==="BREAKFAST AND DINNER"||o==="BREAKFAST + DINNER")return"MAP ( Breakfast & Dinner Included )";if(o==="AP"||o==="FULL BOARD"||o==="ALL MEALS"||o==="ALL MEAL")return"AP ( Breakfast, Lunch & Dinner Included )";if(o==="AI"||o==="ALL INCLUSIVE")return"AI ( All Inclusive )";if(o==="CP"||o==="BREAKFAST INCLUDED"||o==="BREAKFAST"||o==="BED & BREAKFAST"||o==="B&B")return"CP ( Breakfast Included )"}}const f=a.join(" ");return/\b(EP|ROOM\s*ONLY|ONLY\s*ROOM|EUROPEAN\s*PLAN|NO\s*MEALS?)\b/i.test(f)?"EP ( Room Only )":/\b(MAP|HALF\s*BOARD|BREAKFAST\s*(?:AND|&|\+)\s*DINNER)\b/i.test(f)?"MAP ( Breakfast & Dinner Included )":/\b(AP|FULL\s*BOARD|ALL\s*MEALS?)\b/i.test(f)?"AP ( Breakfast, Lunch & Dinner Included )":/\b(AI|ALL\s*INCLUSIVE)\b/i.test(f)?"AI ( All Inclusive )":/\b(CP|BREAKFAST(?:\s*INCLUDED)?|BED\s*&\s*BREAKFAST)\b/i.test(f)?"CP ( Breakfast Included )":"EP ( Room Only )"},b=v?new Date(v):new Date,Y=isNaN(b.getTime())?"22nd Dec, 2026":E(b),de=isNaN(b.getTime())?"22 Dec, 2026":Z(b),N=Number(t?.nights||t?.numberOfNights||4),ce=Number(t?.days||t?.numberOfDays||N+1),ee=t?.endDate?new Date(t.endDate):new Date(b.getTime()+N*864e5),pe=isNaN(ee.getTime())?"26th Dec, 2026":E(ee),te=t?.queryId||t?.tripId||t?.query||t?.queryNumber||t?.quotationNumber;let z="QRY-4304633";if(te){const e=String(te).replace(/^#\s*/,"").trim();z=e.toUpperCase().startsWith("QRY-")?e.toUpperCase():`QRY-${e}`}else if(t?.voucherNumber){const e=String(t.voucherNumber).replace(/^VCH-?/i,"").trim();z=e?`QRY-${e}`:"QRY-001"}const D=t?.destination||"India",fe=t?.duration||`${N} Night${N>1?"s":""} / ${ce} Days`,ge=t?.name||t?.guestName||t?.clientName||t?.leadTraveler||"Valued Client",O=t?.clientPhone||t?.guestPhone||t?.phone||"",me=!O||String(O).includes("8287725270")||String(O).trim()===""||String(O).trim()==="-"?"-":String(O).trim(),S=t?.passengers||t?.travelerSummary||`${t?.adults||2} Adults${Number(t?.children||0)>0?`, ${t.children} Children`:""}`,ie=w||"Holiday Circuit",j=t?.issuedBy||t?.agencyName||w||"Holiday Circuit",ue=j.toLowerCase().includes("user")||j.toLowerCase().includes("guest")?ie:L(j,ie),xe=t?.agencyPhone||"+91-8851346665",G=Array.isArray(t?.services)&&t.services.length>0?t.services:[],oe=G.filter(e=>String(e.type||e.category||"").toLowerCase().includes("hotel")),be=G.filter(e=>!String(e.type||e.category||"").toLowerCase().includes("hotel")),F=oe.length>0?oe:G.length===0?[{title:`${D} Heritage Resort & Spa`,rating:"5 star",address:`${D}, India`,confirmation:"97739SG008801",roomType:"Superior King Room",mealPlan:"Breakfast",numberOfRooms:1,pax:S,nights:N}]:[];let ne=b&&!isNaN(b.getTime())?new Date(b.getTime()):new Date;const he=F.map((e,s)=>{const a=String(e.title||"").trim(),f=String(e.hotelName||e.hotel||"").trim(),d=String(e.serviceName||e.name||"").trim(),n=f||(a&&!a.toLowerCase().includes("hotel stay")&&!a.toLowerCase().includes("service")?a:d||`${D} Heritage Resort`),o=d&&d!==n?d:a&&a!==n?a:"",$=e.rating||e.starRating||e.hotelCategory||e.category||"5 star",M=e.address||e.hotelAddress||e.location||(e.city?`${e.city}, ${D}`:`${D}, India`),P=e.description||e.hotelDescription||e.details||"",g=e.confirmationNumber||e.cnfNumber||e.supplierConfirmation||e.voucherNumber||(e.confirmation&&e.confirmation!=="Confirmed(Confirmed)"&&e.confirmation!=="Confirmed"&&e.confirmation!=="Pending"?e.confirmation:null),u=!!(g||e.status&&String(e.status).toLowerCase()==="confirmed"||e.confirmation&&!String(e.confirmation).toLowerCase().includes("pending")||e.isVoucherGenerated),h=u?"Confirmed":"Pending",A=g?String(g).trim():u?"Confirmed":"Pending",y=Number(e.nights||e.numberOfNights||(F.length>1?2:N)||2);let c;e.checkIn?c=new Date(e.checkIn):e.startDate&&s===0?c=new Date(e.startDate):e.startDate&&e.startDate!==t?.startDate&&e.startDate!==t?.travelDate?c=new Date(e.startDate):s>0?c=new Date(ne.getTime()):c=b&&!isNaN(b.getTime())?b:new Date;let x;e.checkOut?x=new Date(e.checkOut):e.endDate&&s===F.length-1&&F.length===1?x=new Date(e.endDate):e.endDate&&e.endDate!==t?.endDate?x=new Date(e.endDate):x=new Date(c.getTime()+y*864e5),ne=new Date(x.getTime());const T=c&&!isNaN(c.getTime())?E(c):Y,R=c&&!isNaN(c.getTime())?Z(c):de,V=e.checkInTime||"14:00 hrs",k=x&&!isNaN(x.getTime())?E(x):pe,q=e.checkOutTime||"12:00 hrs",B=le(e),Q=`${R} (${y>1?`${y} Nights`:"1 Night"}) - ${B}`,_=e.roomType||e.roomCategory||"Standard Room",W=ae(_),X=`${e.numberOfRooms||e.rooms||1} x ${W}`,i=e.pax||S||"2 Adults",re=e.roomDescription||e.roomDetails||"";return`
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
                ${n}
              </div>
              ${o?`<div style="font-size: 12px; font-weight: 700; color: #2B5083; margin-bottom: 3px;">Service: ${o}</div>`:""}
              <div style="font-size: 12px; color: #334155; margin-bottom: 3px;">
                ${$}
              </div>
              <div style="font-size: 12px; color: #1e293b; line-height: 1.4; margin-bottom: ${P?"6px":"12px"};">
                ${M}
              </div>
              ${P?`<div style="font-size: 11px; color: #475569; line-height: 1.4; margin-bottom: 12px;">${P}</div>`:""}
              <div style="font-size: 13px; font-weight: 800; color: #713f12; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-bottom: 12px;">
                Confirmation: ${A} <span style="font-style: italic; font-size: 12px; color: ${h==="Confirmed"?"#15803d":"#e11d48"}; font-weight: 700; margin-left: 6px;">( ${h} )</span>
              </div>

              <!-- CHECK-IN & CHECK-OUT HIGHLIGHT BOX -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #b3cae8;">
                <tr>
                  <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                    Check-in
                  </td>
                  <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                    <strong style="color: #000000;">${T}</strong> <span style="font-style: italic; font-size: 11px; color: #334155;">at ${V}</span>
                  </td>
                  <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                    Check-out
                  </td>
                  <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                    <strong style="color: #000000;">${k} ( ${y} Night${y>1?"s":""} )</strong> <span style="font-style: italic; font-size: 11px; color: #334155;">at ${q}</span> <span style="font-style: italic; font-size: 11px; color: ${h==="Confirmed"?"#15803d":"#e11d48"}; font-weight: 700; margin-left: 4px;">( ${h} )</span>
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
                      <div style="font-weight: 600; color: #000000;">${Q}</div>
                      ${e.mealDescription?`<div style="font-size: 11px; color: #475569; margin-top: 4px;">${e.mealDescription}</div>`:""}
                    </td>
                    <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                      <div style="font-weight: 700; color: #000000;">${X}</div>
                      <div style="font-size: 11px; color: #475569; margin-top: 4px;">${i}</div>
                      ${re?`<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${re}</div>`:""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    `}).join(""),ye=be.map(e=>{const s=String(e.type||e.category||"Service").toLowerCase(),a=e.title||e.name||e.serviceName||`${D} Service`,f=e.description||e.details||e.notes||"",d=s.includes("transfer")||s.includes("transport")||s.includes("cab")||s.includes("car"),n=String(e.usageType||e.transferType||e.tripType||e.serviceMode||e.direction||"").trim();let o="";if(n){const i=n.toLowerCase();i.includes("point")||i.includes("oneway")||i.includes("one-way")||i.includes("one way")?o="One Way (Point to Point)":i.includes("round")?o="Round Trip":i.includes("full")||i.includes("day")?o="Full Day Disposal":i.includes("half")?o="Half Day Disposal":i.includes("pickup")||i.includes("pick-up")?o="Airport / Station Pickup":i.includes("drop")?o="Airport / Station Drop":o=n}else{const i=String(a||"").toLowerCase();i.includes("round trip")||i.includes("round-trip")?o="Round Trip":i.includes("disposal")||i.includes("full day")?o="Full Day Disposal":i.includes("half day")?o="Half Day Disposal":o="One Way Transfer"}const $=e.vehicleType||e.carType||e.vehicle||(d?"Private AC Vehicle":"Standard Vehicle"),M=e.vehicleCount||e.numberOfVehicles||e.quantity||1,P=`${M>1?`${M} x `:""}${$}`;let g=e.passengerCapacity||e.maxPassengers||e.maxPax||e.seatingCapacity||e.seats||e.paxCapacity||null,u=e.luggageCapacity||e.maxLuggage||e.luggage||e.baggageCapacity||e.bags||null;if(!g&&d){const i=String($).toLowerCase();i.includes("sedan")||i.includes("etios")||i.includes("dzire")||i.includes("car")?g="Max 4 Pax":i.includes("innova")||i.includes("suv")||i.includes("ertiga")||i.includes("crysta")?g="Max 6 Pax":i.includes("tempo")||i.includes("van")||i.includes("minivan")?g="Max 12 Pax":i.includes("coach")||i.includes("bus")?g="Max 25 Pax":g="Max 4 Pax"}else g&&!String(g).toLowerCase().includes("pax")&&(g=`Max ${g} Pax`);if(!u&&d){const i=String($).toLowerCase();i.includes("sedan")||i.includes("etios")||i.includes("dzire")||i.includes("car")?u="2 Bags":i.includes("innova")||i.includes("suv")||i.includes("ertiga")||i.includes("crysta")?u="4 Bags":i.includes("tempo")||i.includes("van")||i.includes("minivan")?u="8 Bags":i.includes("coach")||i.includes("bus")?u="20 Bags":u="2-3 Bags"}else u&&!String(u).toLowerCase().includes("bag")&&(u=`${u} Bags`);let h="Service",A="Service Date",y="Service Type",c=e.transferType||e.vehicleType||e.category||"Standard Service",x="Service Details",T="Pax / Vehicle Details";d?(h="Transfer",A="Transfer Date",y="Vehicle & Trip",c=`${$} (${o})`,x="Transfer Description & Route",T="Vehicle & Capacity Details"):s.includes("activity")?(h="Activity",A="Activity Date",y="Timing / Duration",c=e.timing||e.duration||e.slot||"As per schedule",x="Activity Description",T="Pax Details"):s.includes("sightseeing")?(h="Sightseeing",A="Tour Date",y="Tour Type",c=e.tourType||"Sightseeing Tour",x="Sightseeing Description",T="Pax Details"):s.includes("flight")&&(h="Flight",A="Flight Date",y="Flight / Sector",c=e.flightNumber||e.sector||"Flight Service",x="Flight Details",T="Pax Details");const R=e.confirmationNumber||e.cnfNumber||e.supplierConfirmation||e.voucherNumber||(e.confirmation&&e.confirmation!=="Confirmed(Confirmed)"&&e.confirmation!=="Confirmed"&&e.confirmation!=="Pending"?e.confirmation:null),V=!!(R||e.status&&String(e.status).toLowerCase()==="confirmed"||e.confirmation&&!String(e.confirmation).toLowerCase().includes("pending")||e.isVoucherGenerated),k=V?"Confirmed":"Pending",q=R?String(R).trim():V?"Confirmed":"Pending",B=e.serviceDate?new Date(e.serviceDate):e.date?new Date(e.date):e.startDate?new Date(e.startDate):b,Q=B&&!isNaN(B.getTime())?E(B):Y,_=e.time||e.pickupTime||e.serviceDate||"10:00 hrs",W=e.vehicleType?`${e.vehicleType} • ${S}`:e.pax||S||"2 Pax",X=`${a} - ${k==="Confirmed"?"Confirmed Service":"Service"}`;return`
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; border: 1px solid #b3cae8; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #dce8f6;">
            <th colspan="2" style="padding: 9px 14px; font-size: 13px; font-weight: 800; color: #000000; text-align: left; border: 1px solid #b3cae8; letter-spacing: 0.2px;">
              ${h}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="2" style="padding: 14px; background-color: #ffffff; border: 1px solid #b3cae8;">
              <div style="font-size: 14px; font-weight: 800; color: #000000; margin-bottom: 3px; line-height: 1.3;">
                ${a}
              </div>
              <div style="font-size: 12px; color: #334155; margin-bottom: 3px;">
                ${h} • ${D}
              </div>
              ${f?`<div style="font-size: 12px; color: #1e293b; line-height: 1.4; margin-bottom: 12px;">${f}</div>`:'<div style="margin-bottom: 8px;"></div>'}
              
              <div style="font-size: 13px; font-weight: 800; color: #713f12; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-bottom: 12px;">
                Confirmation: ${q}
              </div>

              <!-- SERVICE DATE & DETAILS HIGHLIGHT BOX -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #b3cae8;">
                <tr>
                  <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                    ${A}
                  </td>
                  <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                    <strong style="color: #000000;">${Q}</strong> <span style="font-style: italic; font-size: 11px; color: #334155;">at ${_}</span>
                  </td>
                  <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                    ${y}
                  </td>
                  <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                    <strong style="color: #000000;">${c}</strong> <span style="font-style: italic; font-size: 11px; color: ${k==="Confirmed"?"#15803d":"#334155"}; font-weight: 600;">( ${k} )</span>
                  </td>
                </tr>
              </table>

              <!-- SERVICE SUB-TABLE -->
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #b3cae8;">
                <thead>
                  <tr style="background-color: #dce8f6;">
                    <th style="width: 58%; padding: 8px 12px; font-size: 13px; font-weight: 700; color: #000000; text-align: left; border: 1px solid #b3cae8;">
                      ${x}
                    </th>
                    <th style="width: 42%; padding: 8px 12px; font-size: 13px; font-weight: 700; color: #000000; text-align: left; border: 1px solid #b3cae8;">
                      ${T}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                      <div style="font-weight: 600; color: #000000;">${X}</div>
                      ${d?`
                        <div style="margin-top: 4px; font-size: 11px; color: #1e40af; font-weight: 600;">
                          ${o}${e.pickupLocation||e.dropLocation?` &nbsp;•&nbsp; ${e.pickupLocation||"Pickup"} ➔ ${e.dropLocation||"Drop"}`:""}
                        </div>
                      `:""}
                      ${f?`<div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">${f}</div>`:""}
                    </td>
                    <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                      ${d?`
                        <div style="font-weight: 700; color: #000000; font-size: 12px; margin-bottom: 6px;">${P}</div>
                        <table style="width: 100%; border-collapse: collapse; font-size: 11px; color: #1e293b;">
                          <tr>
                            <td style="padding: 2px 0; color: #475569;"><strong>Passenger Capacity:</strong></td>
                            <td style="padding: 2px 0; font-weight: 700; color: #0f172a; text-align: right;">${g}</td>
                          </tr>
                          <tr>
                            <td style="padding: 2px 0; color: #475569;"><strong>Luggage Capacity:</strong></td>
                            <td style="padding: 2px 0; font-weight: 700; color: #0f172a; text-align: right;">${u}</td>
                          </tr>
                          <tr>
                            <td style="padding: 2px 0; color: #475569;"><strong>Booked Pax:</strong></td>
                            <td style="padding: 2px 0; font-weight: 700; color: #0f172a; text-align: right;">${S}</td>
                          </tr>
                        </table>
                      `:`
                        <div style="font-weight: 600; color: #000000;">${W}</div>
                        <div style="font-size: 11px; color: #475569; margin-top: 4px;"><strong>Booked Pax:</strong> ${S}</div>
                      `}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    `}).join(""),I=t?.termsAndConditions||t?.terms||[];let H=[];Array.isArray(I)?H=I.filter(e=>typeof e=="string"&&e.trim().length>0):typeof I=="string"&&I.trim()&&(H=I.split(`
`).map(e=>e.trim()).filter(e=>e.length>0));const ve=H.length>0?`
    <!-- TERMS & CONDITIONS SECTION -->
    <div style="margin-top: 18px; margin-bottom: 18px; font-family: Arial, sans-serif;">
      <div style="font-size: 13.5px; font-weight: 800; color: #9a3412; margin-bottom: 8px;">
        Terms &amp; Conditions:
      </div>
      <ol style="margin: 0; padding-left: 20px; font-size: 11.5px; color: #1e293b; line-height: 1.65;">
        ${H.map(e=>`<li style="margin-bottom: 5px;">${e.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</li>`).join("")}
      </ol>
    </div>
  `:"";return`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Travel Voucher - ${z}</title>
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
              ${K&&U?`<img src="${U}" alt="${w||"Agent"} Logo" class="brand-logo">`:K?`<div style="font-size: 24px; font-weight: 800; color: #0f1d32;">${(w||"A").charAt(0).toUpperCase()}</div>`:p?`<img src="${we}" alt="Holiday Circuit Logo" class="brand-logo">`:'<div style="font-size: 24px; font-weight: 800; color: #0f1d32;">TV</div>'}
            </div>
            <div class="brand-name">${K?w||"Travel Voucher":p?"Holiday Circuit":"Travel Voucher"}</div>
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
                    Trip ID: ${z}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; width: 18%; font-weight: 500; border: 1px solid #b3cae8;">Start Date</td>
                  <td style="padding: 8px 12px; color: #000000; width: 32%; font-weight: 700; border: 1px solid #b3cae8;">${Y}</td>
                  <td style="padding: 8px 12px; color: #1e293b; width: 20%; font-weight: 500; border: 1px solid #b3cae8;">Trip Duration</td>
                  <td style="padding: 8px 12px; color: #000000; width: 30%; font-weight: 700; border: 1px solid #b3cae8;">${fe}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Destination</td>
                  <td colspan="3" style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">${D}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Guest Name</td>
                  <td style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">${ge}</td>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Guest Ph.</td>
                  <td style="padding: 8px 12px; color: #000000; font-weight: 600; border: 1px solid #b3cae8;">${me}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Pax Details</td>
                  <td colspan="3" style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">${S}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">Issued By</td>
                  <td colspan="3" style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">${ue}</td>
                </tr>
              </tbody>
            </table>

            <!-- HOTELS SECTION -->
            ${he}

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
                <div class="footer-item">Phone: ${t.agencyPhone||xe} | Email: ${t.agencyEmail||"ops@holidaycircuit.com"}</div>
              </div>
              <div class="footer-address">
                ${t.agencyAddress||"2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058"}
              </div>
            </div>
          `}
        </div>
      </body>
    </html>
  `};export{Ce as b,Ae as f,Te as g,se as p};
