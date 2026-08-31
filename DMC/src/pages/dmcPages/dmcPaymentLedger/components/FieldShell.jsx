import React, { createElement } from "react";

export const FieldShell = ({
  icon,
  children,
  iconWrapClassName = "bg-slate-100 text-slate-600",
}) => (
  <div className="relative">
    <div
      className={`pointer-events-none absolute left-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md ${iconWrapClassName}`}
    >
      {icon ? createElement(icon, { size: 14 }) : null}
    </div>
    {children}
  </div>
);
