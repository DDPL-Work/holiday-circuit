import {
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  Users,
  ShieldCheck
} from "lucide-react";

import { motion } from "framer-motion";

export default function OpsDashboardContent() {
  return (

<motion.div
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.5 }}
className="p-2.5 bg-[#F5F7FB] min-h-[calc(100vh-64px)]"
>

  <div className="mb-3">
   <h1 className="font-bold"> OPS-DASHBOARD</h1>
  </div> 

{/* ACCESS LEVEL CARD */}

<motion.div
initial={{ opacity: 0, y: 40, scale: 0.96 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={{ duration: 0.6, ease: "easeOut" }}
className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-md transition"
>

  <div className="flex items-start justify-between mb-4">
    <div className="flex items-center gap-3">
      
      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
        <ShieldCheck className="w-5 h-5 text-blue-600" />
      </div>

      <div>
        <h2 className="text-lg font-bold text-[#0F172A]">
          Your Access Level
        </h2>
        <p className="text-sm text-gray-500">
         Access to daily operational tasks and booking management
        </p>
      </div>
    </div>

    <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
      Operations Team
    </span>
  </div>

  <p className="text-sm font-medium text-gray-500 mb-4">
  PERMISSIONS
  </p>

 <motion.ul
initial="hidden"
animate="show"
variants={{
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 }
  }
}}
className="space-y-2 text-sm text-gray-700 mb-4"
>
  {[
    "View booking management hub",
    "Accept and process orders",
    "Generate and manage vouchers",
    "Update booking statuses",
    "View operational reports",
  ].map((item, index) => (
    <motion.li
      key={index}
      variants={{
        hidden: { opacity: 0, x: -20 },
        show: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.4, ease: "easeOut" }
        }
      }}
      whileHover={{ x: 4 }}
      className="flex items-center gap-2"
    >
      <CheckCircle className="w-4 h-4 text-green-500" />
      {item}
    </motion.li>
  ))}
</motion.ul>

  <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
    <AlertCircle className="w-4 h-4" />
    Some advanced permissions are restricted. Contact admin for access.
  </div>

</motion.div>


{/* STATS CARDS */}

<motion.div
initial="hidden"
animate="show"
variants={{
  hidden: {},
  show: {
    transition: { staggerChildren: 0.18 }
  }
}}
className="grid grid-cols-4 gap-3 mb-6 "
>

<StatCard
title="Pending Queries"
value="24"
change="+12% from last week"
icon={<Clock className="w-5 h-5 text-purple-500 " />}
/>

<StatCard
title="Active Bookings"
value="156"
change="+8% from last week"
icon={<CheckCircle className="w-5 h-5 text-blue-500" />}
/>

<StatCard
title="Vouchers Generated"
value="89"
change="+15% from last week"
icon={<FileText className="w-5 h-5 text-green-500 " />}
/>

<StatCard
title="Pending Actions"
value="12"
change="-5% from last week"
icon={<AlertCircle className="w-5 h-5 text-orange-500" />}
danger
/>

</motion.div>


{/* BOTTOM SECTION */}

<div className="grid grid-cols-3 gap-6">
  <RecentActivity />
  <TeamPerformance />
</div>

</motion.div>
);
}

/* ---------------- STAT CARD ---------------- */

function StatCard({ title, value, change, icon, danger }) {
return (

<motion.div
variants={{
hidden:{ opacity:0, y:40, scale:0.9, rotate:-2 },
show:{
opacity:1,
y:0,
scale:1,
rotate:0,
transition:{ type:"spring", stiffness:120, damping:12 }
}
}}
whileHover={{ y:-1, scale:1.015 }}
className="bg-white rounded-xl border border-gray-200 p-4 shadow-md"
>

<div className="flex items-center justify-between mb-2">
<p className="text-sm font-medium text-gray-500">{title}</p>
<span>{icon}</span>
</div>

<p className="text-xl font-bold text-[#0F172A]">{value}</p>

<p
className={`text-xs mt-1 ${
danger ? "text-red-500" : "text-green-500"
}`}
>
{change}
</p>

</motion.div>
);
}


/* ---------------- RECENT ACTIVITY ---------------- */

function RecentActivity() {

const activities = [
{
title: "New Query",
tag: "New",
tagColor: "bg-purple-100 text-purple-600",
company: "Travel World Pvt Ltd",
destination: "Bali",
time: "5 min ago",
},
{
title: "Booking Accepted",
tag: "Accepted",
tagColor: "bg-blue-100 text-blue-600",
company: "Globe Tours",
destination: "Dubai",
time: "15 min ago",
},
{
title: "Voucher Generated",
tag: "Vouchered",
tagColor: "bg-green-100 text-green-600",
company: "Sky Travels",
destination: "Maldives",
time: "32 min ago",
},
{
title: "Confirmation Entered",
tag: "Confirmed",
tagColor: "bg-cyan-100 text-cyan-600",
company: "Wanderlust Holidays",
destination: "Paris",
time: "1 hr ago",
},
{
title: "New Query",
tag: "New",
tagColor: "bg-purple-100 text-purple-600",
company: "Dream Vacations",
destination: "Switzerland",
time: "2 hrs ago",
},
];

return (

<div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-md">

<h3 className="font-bold text-[#0F172A] mb-4">
Recent Activity
</h3>

<motion.div
initial="hidden"
animate="show"
variants={{
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15 }
  }
}}
className="space-y-3 text-sm"
>

{activities.map((item, index) => (
<ActivityItem key={index} {...item}/>
))}

</motion.div>
</div>
);
}


function ActivityItem({
title,
tag,
tagColor,
company,
destination,
time,
}) {

return (

<motion.div
variants={{
hidden:{
opacity:0,
x:120,
scale:0.95,
filter:"blur(4px)"
},
show:{
opacity:1,
x:0,
scale:1,
filter:"blur(0px)",
transition:{
type:"spring",
stiffness:120,
damping:14
}
}
}}
whileHover={{ x:6, scale:1.02 }}
className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition"
>

<div>

<div className="flex items-center gap-2 mb-1">

<span className="font-medium text-[#0F172A]">
{title}
</span>

<span
className={`text-xs px-2 py-0.5 rounded-full ${tagColor}`}
>
{tag}
</span>

</div>

<div className="flex items-center text-xs text-gray-500 gap-1">

<Users className="w-4 h-4" />

<span>{company}</span>

<span className="mx-1">→</span>

<span>{destination}</span>

</div>

</div>

<span className="text-xs text-gray-400 whitespace-nowrap">
{time}
</span>

</motion.div>

);
}


/* ---------------- TEAM PERFORMANCE ---------------- */

function TeamPerformance() {

return (

<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md">

<h3 className="font-bold text-[#0F172A] mb-4">
Team Performance
</h3>

<div className="space-y-4 text-sm">

<Progress
label="Queries Handled"
value="89%"
color="bg-blue-500"
/>

<Progress
label="Avg. Response Time"
value="2.4h"
color="bg-green-500"
/>

<Progress
label="Vouchers / Day"
value="18"
color="bg-purple-500"
/>

</div>

</div>

);
}


/* ---------------- PROGRESS BAR ---------------- */

function Progress({ label, value, color }) {

return (

<div>

<div className="flex justify-between mb-1">

<span className="text-gray-700">
{label}
</span>

<span className="font-medium text-gray-900">
{value}
</span>

</div>

<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">

<motion.div
initial={{ width:0 }}
animate={{ width:"75%" }}
transition={{ duration:1.2, ease:"easeOut" }}
className={`h-2 rounded-full ${color}`}
/>

</div>

</div>

);
}