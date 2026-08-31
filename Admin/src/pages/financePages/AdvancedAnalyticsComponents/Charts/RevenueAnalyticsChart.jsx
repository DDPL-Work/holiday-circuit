import React, { useRef, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { TrendingUp } from "lucide-react";
import {
  MONTH_SEQUENCE,
  yearlyPieColors,
  yearlyPieLabelSlots,
  describeSvgPieArc,
  getPiePoint,
  formatCompactCurrency,
  formatOneDecimalPercent,
  parseInvoiceCreateDate,
  getInvoiceTotalAmount,
  getInvoiceMonthVerifiedPayment,
} from "../utils/formatter";

export default function RevenueAnalyticsChart({
  loading,
  period,
  effectiveSelectedTaxMonth,
  effectiveSelectedTaxYear,
  appliedCustomRange,
  travelDateEntries,
  groups = {},
  previousMonthRevenueTotal = 0,
}) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState(null);
  const pastCircleRef = useRef(null);
  const currentCircleRef = useRef(null);
  const upcomingCircleRef = useRef(null);

  const pastTotal = useMemo(
    () =>
      (groups?.past || []).reduce(
        (sum, inv) => sum + getInvoiceMonthVerifiedPayment(inv, effectiveSelectedTaxMonth),
        0
      ),
    [groups, effectiveSelectedTaxMonth]
  );
  const currentTotal = useMemo(
    () =>
      (groups?.current || []).reduce(
        (sum, inv) => sum + getInvoiceMonthVerifiedPayment(inv, effectiveSelectedTaxMonth),
        0
      ),
    [groups, effectiveSelectedTaxMonth]
  );
  const upcomingTotal = useMemo(
    () =>
      (groups?.upcoming || []).reduce(
        (sum, inv) => sum + getInvoiceMonthVerifiedPayment(inv, effectiveSelectedTaxMonth),
        0
      ),
    [groups, effectiveSelectedTaxMonth]
  );
  const totalSum = pastTotal + currentTotal + upcomingTotal;
  const comparisonPreviousTotal = Number(previousMonthRevenueTotal || 0);

  const comparison = useMemo(() => {
    const diff = currentTotal - comparisonPreviousTotal;
    const isUp = diff >= 0;
    const absDiff = Math.abs(diff);
    const percentage =
      comparisonPreviousTotal > 0
        ? ((diff / comparisonPreviousTotal) * 100).toFixed(1)
        : diff > 0
        ? "100"
        : "0";
    return { isUp, absDiff, percentage };
  }, [currentTotal, comparisonPreviousTotal]);

  const donutData = useMemo(() => {
    const rPast = 39;
    const rCurrent = 45;
    const rUpcoming = 33;

    const cPast = 2 * Math.PI * rPast;
    const cCurrent = 2 * Math.PI * rCurrent;
    const cUpcoming = 2 * Math.PI * rUpcoming;

    const gapAngle = totalSum === 0 ? 0 : 6;
    const activeSegmentsCount =
      (pastTotal > 0 ? 1 : 0) + (currentTotal > 0 ? 1 : 0) + (upcomingTotal > 0 ? 1 : 0);
    const activeAngleSpace = 360 - activeSegmentsCount * gapAngle;

    const pastAngle = pastTotal > 0 ? (pastTotal / totalSum) * activeAngleSpace : 0;
    const currentAngle = currentTotal > 0 ? (currentTotal / totalSum) * activeAngleSpace : 0;
    const upcomingAngle = upcomingTotal > 0 ? (upcomingTotal / totalSum) * activeAngleSpace : 0;

    let currentAngleOffset = 0;

    let pastStartAngle = 0;
    if (pastTotal > 0) {
      pastStartAngle = currentAngleOffset;
      currentAngleOffset += pastAngle + gapAngle;
    }

    let currentStartAngle = 0;
    if (currentTotal > 0) {
      currentStartAngle = currentAngleOffset;
      currentAngleOffset += currentAngle + gapAngle;
    }

    let upcomingStartAngle = 0;
    if (upcomingTotal > 0) {
      upcomingStartAngle = currentAngleOffset;
      currentAngleOffset += upcomingAngle + gapAngle;
    }

    const pastDash = (pastAngle / 360) * cPast;
    const pastDashArray = `${pastDash} ${cPast - pastDash}`;
    const pastOffset = (0.25 - pastStartAngle / 360) * cPast;

    const currentDash = (currentAngle / 360) * cCurrent;
    const currentDashArray = `${currentDash} ${cCurrent - currentDash}`;
    const currentOffset = (0.25 - currentStartAngle / 360) * cCurrent;

    const upcomingDash = (upcomingAngle / 360) * cUpcoming;
    const upcomingDashArray = `${upcomingDash} ${cUpcoming - upcomingDash}`;
    const upcomingOffset = (0.25 - upcomingStartAngle / 360) * cUpcoming;

    return {
      cPast,
      cCurrent,
      cUpcoming,
      rPast,
      rCurrent,
      rUpcoming,
      pastDashArray,
      pastOffset,
      currentDashArray,
      currentOffset,
      upcomingDashArray,
      upcomingOffset,
    };
  }, [pastTotal, currentTotal, upcomingTotal, totalSum]);

  const [displayValue, setDisplayValue] = useState(0);

  const currentTargetVal = useMemo(() => {
    return hoveredSegment === "past"
      ? pastTotal
      : hoveredSegment === "current"
      ? currentTotal
      : hoveredSegment === "upcoming"
      ? upcomingTotal
      : totalSum;
  }, [hoveredSegment, pastTotal, currentTotal, upcomingTotal, totalSum]);

  // Smooth number count-up animation
  useEffect(() => {
    const obj = { val: displayValue };
    const tween = gsap.to(obj, {
      val: currentTargetVal,
      duration: 0.65,
      ease: "power2.out",
      onUpdate: () => {
        setDisplayValue(Math.round(obj.val));
      },
    });
    return () => tween.kill();
  }, [currentTargetVal]);

  // Entry / Data Change Animation
  useEffect(() => {
    if (totalSum <= 0) return;

    if (pastCircleRef.current) {
      gsap.to(pastCircleRef.current, {
        strokeDashoffset: donutData.pastOffset,
        duration: 1.25,
        ease: "power3.out",
      });
    }

    if (currentCircleRef.current) {
      gsap.to(currentCircleRef.current, {
        strokeDashoffset: donutData.currentOffset,
        duration: 1.25,
        ease: "power3.out",
      });
    }

    if (upcomingCircleRef.current) {
      gsap.to(upcomingCircleRef.current, {
        strokeDashoffset: donutData.upcomingOffset,
        duration: 1.25,
        ease: "power3.out",
      });
    }
  }, [pastTotal, currentTotal, upcomingTotal, totalSum, donutData]);

  // Hover animations using GSAP
  useEffect(() => {
    if (pastCircleRef.current) {
      gsap.to(pastCircleRef.current, {
        strokeWidth: hoveredSegment === "past" ? 9.5 : 6.5,
        scale: hoveredSegment === "past" ? 1.04 : 1,
        duration: 0.35,
        ease: "power2.out",
      });
    }

    if (currentCircleRef.current) {
      gsap.to(currentCircleRef.current, {
        strokeWidth: hoveredSegment === "current" ? 11.5 : 8.5,
        scale: hoveredSegment === "current" ? 1.04 : 1,
        duration: 0.35,
        ease: "power2.out",
      });
    }

    if (upcomingCircleRef.current) {
      gsap.to(upcomingCircleRef.current, {
        strokeWidth: hoveredSegment === "upcoming" ? 8 : 5,
        scale: hoveredSegment === "upcoming" ? 1.04 : 1,
        duration: 0.35,
        ease: "power2.out",
      });
    }
  }, [hoveredSegment]);

  const chartDataCombined = useMemo(() => {
    let labels = [];
    let revenueData = [];
    let receivedData = [];
    let upcomingData = [];

    if (period === "yearly") {
      labels = MONTH_SEQUENCE;
      revenueData = Array(12).fill(0);
      receivedData = Array(12).fill(0);
      upcomingData = Array(12).fill(0);

      travelDateEntries.forEach((entry) => {
        if (!entry.date) return;
        const parts = entry.date.split("-");
        if (parts.length >= 2) {
          const monthIdx = Number(parts[1]) - 1;
          if (monthIdx >= 0 && monthIdx < 12) {
            revenueData[monthIdx] += Number(entry.revenue || 0);
            receivedData[monthIdx] += Number(entry.receivedPayment || 0);
          }
        }
      });

      (groups.upcoming || []).forEach((invoice) => {
        const createDate = parseInvoiceCreateDate(invoice);
        if (!createDate) return;
        const monthIdx = createDate.getMonth();
        if (monthIdx >= 0 && monthIdx < 12) {
          upcomingData[monthIdx] += getInvoiceTotalAmount(invoice);
        }
      });
    } else if (period === "monthly") {
      const monthStr =
        effectiveSelectedTaxMonth ||
        `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
      const [yearNum, monthNum] = monthStr.split("-").map(Number);
      const daysCount = new Date(yearNum, monthNum, 0).getDate();

      labels = Array.from({ length: daysCount }, (_, i) => String(i + 1).padStart(2, "0"));
      revenueData = Array(daysCount).fill(0);
      receivedData = Array(daysCount).fill(0);
      upcomingData = Array(daysCount).fill(0);

      travelDateEntries.forEach((entry) => {
        if (!entry.date) return;
        const day = Number(entry.date.split("-")[2]);
        if (day >= 1 && day <= daysCount) {
          revenueData[day - 1] = Number(entry.revenue || 0);
          receivedData[day - 1] = Number(entry.receivedPayment || 0);
        }
      });

      (groups.upcoming || []).forEach((invoice) => {
        const createDate = parseInvoiceCreateDate(invoice);
        if (!createDate) return;
        const day = createDate.getDate();
        if (day >= 1 && day <= daysCount) {
          upcomingData[day - 1] += getInvoiceTotalAmount(invoice);
        }
      });
    } else {
      const start = appliedCustomRange.start ? new Date(appliedCustomRange.start) : new Date();
      const end = appliedCustomRange.end ? new Date(appliedCustomRange.end) : new Date();

      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const dates = [];
      for (let i = 0; i < diffDays; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d);
      }

      labels = dates.map((d) => d.toLocaleDateString("en-US", { day: "2-digit", month: "short" }));
      revenueData = Array(diffDays).fill(0);
      receivedData = Array(diffDays).fill(0);
      upcomingData = Array(diffDays).fill(0);

      travelDateEntries.forEach((entry) => {
        if (!entry.date) return;
        const entryParts = entry.date.split("-").map(Number);
        const entryTime = new Date(entryParts[0], entryParts[1] - 1, entryParts[2]).toDateString();

        const idx = dates.findIndex((d) => d.toDateString() === entryTime);
        if (idx !== -1) {
          revenueData[idx] = Number(entry.revenue || 0);
          receivedData[idx] = Number(entry.receivedPayment || 0);
        }
      });

      (groups.upcoming || []).forEach((invoice) => {
        const createDate = parseInvoiceCreateDate(invoice);
        if (!createDate) return;
        const idx = dates.findIndex((d) => d.toDateString() === createDate.toDateString());
        if (idx !== -1) {
          upcomingData[idx] += getInvoiceTotalAmount(invoice);
        }
      });
    }

    return { labels, revenueData, receivedData, upcomingData };
  }, [period, effectiveSelectedTaxMonth, travelDateEntries, appliedCustomRange, groups.upcoming]);

  const yearlyPieData = useMemo(() => {
    if (period !== "yearly") return { months: [], total: 0, bestMonth: null };

    const revenueValues = chartDataCombined.revenueData.map((value) => Number(value || 0));
    const total = revenueValues.reduce((sum, value) => sum + value, 0);
    let cursor = 0;

    const months = MONTH_SEQUENCE.map((label, index) => {
      const labelSlot = yearlyPieLabelSlots[index] || yearlyPieLabelSlots[0];
      const revenue = revenueValues[index] || 0;
      const previousRevenue = index > 0 ? revenueValues[index - 1] || 0 : 0;
      const revenueDiff = revenue - previousRevenue;
      const profit = Math.max(revenueDiff, 0);
      const loss = Math.max(-revenueDiff, 0);
      const margin =
        previousRevenue > 0
          ? (revenueDiff / previousRevenue) * 100
          : revenue > 0
          ? 100
          : 0;
      const percentage = total > 0 ? (revenue / total) * 100 : 0;
      const startAngle = cursor;
      const endAngle = total > 0 ? cursor + (percentage / 100) * 360 : cursor;
      const midAngle = startAngle + (endAngle - startAngle) / 2;
      cursor = endAngle;

      return {
        key: `${label}-${index}`,
        label,
        revenue,
        previousRevenue,
        profit,
        loss,
        margin,
        percentage,
        color: yearlyPieColors[index % yearlyPieColors.length],
        startAngle,
        endAngle,
        midAngle,
        path:
          revenue > 0
            ? describeSvgPieArc(70, 70, 52, startAngle, Math.min(endAngle, 359.99))
            : "",
        labelPoint: getPiePoint(70, 70, 34, midAngle),
        tooltipPoint: getPiePoint(70, 70, 47, midAngle),
        leaderStartPoint: getPiePoint(70, 70, 54, revenue > 0 ? midAngle : labelSlot.dotAngle),
        leaderEndPoint: getPiePoint(70, 70, 63, labelSlot.dotAngle),
        outerLabelPoint: {
          x: labelSlot.x,
          y: labelSlot.y,
          anchor: labelSlot.anchor,
          valueOffset: labelSlot.valueOffset,
        },
      };
    });

    return {
      months,
      total,
      bestMonth: months.reduce((best, item) => (item.revenue > (best?.revenue || 0) ? item : best), null),
    };
  }, [period, chartDataCombined.revenueData]);

  useEffect(() => {
    if (!canvasRef.current || !window.Chart) return;

    const ctx = canvasRef.current.getContext("2d");

    const revenueGrad = ctx.createLinearGradient(0, 0, 0, 200);
    revenueGrad.addColorStop(0, "rgba(99, 102, 241, 0.28)");
    revenueGrad.addColorStop(1, "rgba(99, 102, 241, 0)");

    const receivedGrad = ctx.createLinearGradient(0, 0, 0, 200);
    receivedGrad.addColorStop(0, "rgba(16, 185, 129, 0.28)");
    receivedGrad.addColorStop(1, "rgba(16, 185, 129, 0)");

    const upcomingGrad = ctx.createLinearGradient(0, 0, 0, 200);
    upcomingGrad.addColorStop(0, "rgba(249, 115, 22, 0.28)");
    upcomingGrad.addColorStop(1, "rgba(249, 115, 22, 0)");

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: chartDataCombined.labels,
        datasets: [
          {
            label: "Total Revenue",
            data: chartDataCombined.revenueData,
            borderColor: "#6366f1",
            borderWidth: 2.5,
            backgroundColor: revenueGrad,
            fill: true,
            tension: 0.38,
            pointBackgroundColor: "#6366f1",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 5.5,
            pointHoverBorderWidth: 2.5,
            pointHoverBackgroundColor: "#6366f1",
            pointHoverBorderColor: "#ffffff",
          },
          {
            label: "Verified Payment",
            data: chartDataCombined.receivedData,
            borderColor: "#10b981",
            borderWidth: 2.5,
            backgroundColor: receivedGrad,
            fill: true,
            tension: 0.38,
            pointBackgroundColor: "#10b981",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 5.5,
            pointHoverBorderWidth: 2.5,
            pointHoverBackgroundColor: "#10b981",
            pointHoverBorderColor: "#ffffff",
          },
          {
            label: "Upcoming Month",
            data: chartDataCombined.upcomingData,
            borderColor: "#f97316",
            borderWidth: 2.5,
            backgroundColor: upcomingGrad,
            fill: true,
            tension: 0.38,
            pointBackgroundColor: "#f97316",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 5.5,
            pointHoverBorderWidth: 2.5,
            pointHoverBackgroundColor: "#f97316",
            pointHoverBorderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        layout: {
          padding: {
            top: 5,
            bottom: period === "monthly" ? 12 : 5,
            left: 5,
            right: 15,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            backgroundColor: "#0f172a",
            titleColor: "#ffffff",
            titleFont: {
              size: 11,
              weight: "bold",
            },
            bodyColor: "#e2e8f0",
            bodyFont: {
              size: 11,
            },
            padding: 10,
            cornerRadius: 10,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.1)",
            callbacks: {
              title: (items) => {
                const label = items[0].label;
                if (period === "yearly") {
                  return `Month: ${label} ${effectiveSelectedTaxYear || new Date().getFullYear()}`;
                } else if (period === "monthly") {
                  const monthName = new Date(effectiveSelectedTaxMonth + "-01").toLocaleDateString(
                    "en-US",
                    { month: "short" }
                  );
                  const dayNum = parseInt(label, 10);
                  const monthStr =
                    effectiveSelectedTaxMonth ||
                    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
                  const [yearNum, monthNum] = monthStr.split("-").map(Number);
                  const date = new Date(yearNum, monthNum - 1, dayNum);
                  let weekdayFull = "";
                  if (!isNaN(date.getTime())) {
                    weekdayFull = ` (${date.toLocaleDateString("en-US", { weekday: "long" })})`;
                  }
                  return `Day: ${label} ${monthName} ${yearNum}${weekdayFull}`;
                }
                return `Date: ${label}`;
              },
              label: (context) => {
                const datasetLabel = context.dataset.label;
                const value = context.parsed.y;
                return ` ${datasetLabel}: ₹${value.toLocaleString("en-IN")}`;
              },
              footer: (items) => {
                const rev = items[0].parsed.y;
                const rec = items[1] ? items[1].parsed.y : 0;
                if (rev > 0) {
                  const rate = ((rec / rev) * 100).toFixed(1);
                  return ` Collection Rate: ${rate}%`;
                }
                return null;
              },
            },
            footerColor: "#34d399",
            footerFont: {
              size: 10,
              weight: "bold",
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            border: {
              color: "rgba(148,163,184,0.15)",
              width: 1.5,
            },
            ticks: {
              font: {
                size: 9,
                weight: "600",
              },
              color: (context) => {
                const chart = context.chart;
                const x = chart.scales.x;
                if (!x || x.left === undefined || x.right === undefined) {
                  return "#94a3b8";
                }
                const ctx = chart.ctx;
                const gradient = ctx.createLinearGradient(x.left, 0, x.right, 0);
                gradient.addColorStop(0, "#38bdf8"); // Sky blue
                gradient.addColorStop(0.5, "#6366f1"); // Indigo
                gradient.addColorStop(1, "#ec4899"); // Pink
                return gradient;
              },
              callback: function (val) {
                const label = this.getLabelForValue(val);
                if (period === "monthly" && typeof label === "string" && /^\d+$/.test(label)) {
                  const dayNum = parseInt(label, 10);
                  const monthStr =
                    effectiveSelectedTaxMonth ||
                    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
                  const [yearNum, monthNum] = monthStr.split("-").map(Number);
                  const date = new Date(yearNum, monthNum - 1, dayNum);
                  if (!isNaN(date.getTime())) {
                    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
                    return `${label} ${weekday}`;
                  }
                }
                return label;
              },
            },
          },
          y: {
            grid: {
              color: "rgba(148,163,184,0.12)",
              drawTicks: false,
              borderDash: [4, 4],
            },
            border: {
              display: false,
            },
            min: 0,
            ticks: {
              stepSize: 10000,
              font: (context) => {
                const val = context.tick ? context.tick.value : 0;
                if (val === 50000 || val === 100000) {
                  return { size: 10.5, weight: "bold" };
                }
                if (val === 60000) {
                  return { size: 7.5 };
                }
                return { size: 9 };
              },
              color: (context) => {
                const val = context.tick ? context.tick.value : 0;
                if (val === 50000 || val === 100000) {
                  return "#64748b";
                }
                return "#94a3b8";
              },
              callback: (value) => formatCompactCurrency(value),
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [chartDataCombined, period, effectiveSelectedTaxMonth, effectiveSelectedTaxYear]);

  const [hoveredYearlyMonth, setHoveredYearlyMonth] = useState(null);
  const activeYearlyMonth = hoveredYearlyMonth;
  const summaryYearlyMonth = hoveredYearlyMonth || yearlyPieData.bestMonth;
  const summaryYearlyChange =
    summaryYearlyMonth?.previousRevenue > 0
      ? ((summaryYearlyMonth.revenue - summaryYearlyMonth.previousRevenue) /
          summaryYearlyMonth.previousRevenue) *
        100
      : summaryYearlyMonth?.revenue > 0
      ? 100
      : 0;
  const visibleYearlyMonths = yearlyPieData.months.filter((item) => item.revenue > 0);
  const hoveredYearlyCallout = hoveredYearlyMonth
    ? (() => {
        const boxWidth = 58;
        const boxHeight = 42;
        const isRightSide = hoveredYearlyMonth.leaderEndPoint.x >= 70;
        const boxX = isRightSide ? 105 : -24;
        const boxY = Math.max(4, Math.min(94, hoveredYearlyMonth.leaderEndPoint.y - 21));
        const lineEndX = isRightSide ? boxX : boxX + boxWidth;
        const lineEndY = boxY + 10;
        const previousRevenue = Number(hoveredYearlyMonth.previousRevenue || 0);
        const thisRevenue = Number(hoveredYearlyMonth.revenue || 0);
        const revenueDelta = thisRevenue - previousRevenue;
        const profit = Math.max(revenueDelta, 0);
        const loss = Math.max(-revenueDelta, 0);
        const margin =
          previousRevenue > 0
            ? (revenueDelta / previousRevenue) * 100
            : thisRevenue > 0
            ? 100
            : 0;

        return {
          boxX,
          boxY,
          boxWidth,
          boxHeight,
          lineEndX,
          lineEndY,
          margin,
          rows: [
            ["Prev", formatCompactCurrency(previousRevenue)],
            ["This", formatCompactCurrency(thisRevenue)],
            ["Profit", formatCompactCurrency(profit)],
            ["Loss", formatCompactCurrency(loss)],
            ["Margin", `${formatOneDecimalPercent(margin)}%`],
          ],
        };
      })()
    : null;

  return (
    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
      <div
        style={{
          background:
            "linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, rgba(224, 242, 254, 0.45) 100%)",
        }}
        className="flex min-w-0 flex-col rounded-2xl border border-sky-100/80 p-3.5 select-none shadow-[0_10px_25px_rgba(186,230,253,0.12)] text-slate-800"
      >
        <div className="flex items-center justify-between mb-2.5 select-none">
          <div className="flex items-center gap-1.5">
            <span className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-wider">
              {period === "yearly" ? "Monthly Trend" : "Daily Trend (Days)"}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[9.5px] font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
              <span>Total Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              <span>Verified Payment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]" />
              <span>Upcoming Month</span>
            </div>
          </div>
        </div>

        <div className="relative h-[220px] w-full sm:h-[235px] lg:h-[245px]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50/20 backdrop-blur-[1px] rounded-2xl">
              <div className="flex flex-col items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-650" />
                <span className="text-[10px] font-semibold text-slate-400">
                  Loading chart data...
                </span>
              </div>
            </div>
          ) : (
            <canvas ref={canvasRef} />
          )}
        </div>
      </div>

      <div
        style={{
          background:
            "linear-gradient(135deg, #ffffff 0%, rgba(219, 234, 254, 0.55) 50%, rgba(238, 242, 255, 0.7) 100%)",
        }}
        className="flex min-w-0 flex-col rounded-2xl border border-blue-100/80 p-3.5 select-none shadow-[0_10px_25px_rgba(148,163,184,0.12)] text-slate-800"
      >
        <div className="flex items-center gap-1.5 text-[9.5px] font-extrabold text-slate-450 uppercase tracking-wider mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
          <span>Sales Reports</span>
        </div>

        {period === "yearly" ? (
          <>
            <div className="relative my-1.5 flex h-[245px] w-full items-center justify-center">
              {loading ? (
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white/40">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                </div>
              ) : yearlyPieData.total > 0 ? (
                <div className="relative h-full w-full max-w-[380px]">
                  <svg viewBox="-20 -6 190 158" className="h-full w-full overflow-visible drop-shadow-sm">
                    <defs>
                      <filter id="yearly-pie-shadow" x="-25%" y="-25%" width="150%" height="150%">
                        <feDropShadow
                          dx="0"
                          dy="2"
                          stdDeviation="2"
                          floodColor="#0f172a"
                          floodOpacity="0.16"
                        />
                      </filter>
                    </defs>
                    <circle cx="70" cy="70" r="53" fill="#eef2ff" />
                    {visibleYearlyMonths.map((month) => {
                      const isActive = activeYearlyMonth?.key === month.key;
                      return (
                        <motion.path
                          key={month.key}
                          d={month.path}
                          fill={month.color}
                          stroke="#f8fafc"
                          strokeWidth="0.9"
                          filter={isActive ? "url(#yearly-pie-shadow)" : undefined}
                          initial={{ opacity: 0.65, scale: 0.94 }}
                          animate={{ opacity: isActive ? 1 : 0.86, scale: isActive ? 1.06 : 1 }}
                          transition={{ duration: 0.18 }}
                          style={{ transformOrigin: "70px 70px", cursor: "pointer" }}
                          onMouseEnter={() => setHoveredYearlyMonth(month)}
                          onMouseLeave={() => setHoveredYearlyMonth(null)}
                        />
                      );
                    })}
                    {yearlyPieData.months.map((month) => {
                      const isActive = activeYearlyMonth?.key === month.key;
                      return (
                        <g
                          key={`${month.key}-outer-label`}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredYearlyMonth(month)}
                          onMouseLeave={() => setHoveredYearlyMonth(null)}
                        >
                          <line
                            x1={month.leaderStartPoint.x}
                            y1={month.leaderStartPoint.y}
                            x2={month.leaderEndPoint.x}
                            y2={month.leaderEndPoint.y}
                            stroke={month.revenue > 0 ? month.color : "#cbd5e1"}
                            strokeWidth={isActive ? 0.9 : 0.55}
                            strokeLinecap="round"
                            opacity={month.revenue > 0 ? 0.72 : 0.38}
                          />
                          <circle
                            cx={month.leaderEndPoint.x}
                            cy={month.leaderEndPoint.y}
                            r={isActive ? 1.6 : 1.15}
                            fill={month.revenue > 0 ? month.color : "#94a3b8"}
                            opacity={month.revenue > 0 ? 0.95 : 0.5}
                          />
                          <text
                            x={month.outerLabelPoint.x}
                            y={month.outerLabelPoint.y}
                            textAnchor={month.outerLabelPoint.anchor}
                            dominantBaseline="middle"
                            fill={isActive ? "#0f172a" : "#64748b"}
                            className="text-[6.4px] font-black"
                          >
                            {month.label}
                          </text>
                          <text
                            x={month.outerLabelPoint.x}
                            y={month.outerLabelPoint.y + month.outerLabelPoint.valueOffset}
                            textAnchor={month.outerLabelPoint.anchor}
                            dominantBaseline="middle"
                            fill={month.revenue > 0 ? month.color : "#94a3b8"}
                            className="text-[4.9px] font-extrabold"
                          >
                            {formatCompactCurrency(month.revenue)}
                          </text>
                        </g>
                      );
                    })}
                    {visibleYearlyMonths
                      .filter((month) => month.percentage >= 7)
                      .map((month) => (
                        <text
                          key={`${month.key}-label`}
                          x={month.labelPoint.x}
                          y={month.labelPoint.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="pointer-events-none fill-white text-[6px] font-black"
                        >
                          {Math.round(month.percentage)}%
                        </text>
                      ))}
                    {hoveredYearlyMonth && hoveredYearlyCallout && (
                      <g className="pointer-events-none">
                        <line
                          x1={hoveredYearlyMonth.leaderEndPoint.x}
                          y1={hoveredYearlyMonth.leaderEndPoint.y}
                          x2={hoveredYearlyCallout.lineEndX}
                          y2={hoveredYearlyCallout.lineEndY}
                          stroke="#020617"
                          strokeWidth="0.85"
                          strokeLinecap="round"
                        />
                        <circle
                          cx={hoveredYearlyMonth.leaderEndPoint.x}
                          cy={hoveredYearlyMonth.leaderEndPoint.y}
                          r="1.7"
                          fill="#020617"
                        />
                        <rect
                          x={hoveredYearlyCallout.boxX}
                          y={hoveredYearlyCallout.boxY}
                          width={hoveredYearlyCallout.boxWidth}
                          height={hoveredYearlyCallout.boxHeight}
                          rx="3.5"
                          fill="#020617"
                          filter="url(#yearly-pie-shadow)"
                        />
                        <text
                          x={hoveredYearlyCallout.boxX + 4}
                          y={hoveredYearlyCallout.boxY + 7}
                          fill="#ffffff"
                          fontSize="4.9"
                          fontWeight="900"
                        >
                          {hoveredYearlyMonth.label} {effectiveSelectedTaxYear || new Date().getFullYear()}
                        </text>
                        <text
                          x={hoveredYearlyCallout.boxX + hoveredYearlyCallout.boxWidth - 4}
                          y={hoveredYearlyCallout.boxY + 7}
                          fill="#ffffff"
                          fontSize="4.8"
                          fontWeight="900"
                          textAnchor="end"
                        >
                          {hoveredYearlyMonth.percentage.toFixed(1)}%
                        </text>
                        {hoveredYearlyCallout.rows.map(([label, value], rowIndex) => {
                          const isProfit = label === "Profit";
                          const isLoss = label === "Loss";
                          const isMargin = label === "Margin";
                          return (
                            <g key={label}>
                              <text
                                x={hoveredYearlyCallout.boxX + 4}
                                y={hoveredYearlyCallout.boxY + 16 + rowIndex * 4.8}
                                fill="#cbd5e1"
                                fontSize="4.15"
                                fontWeight="800"
                              >
                                {label}
                              </text>
                              <text
                                x={hoveredYearlyCallout.boxX + hoveredYearlyCallout.boxWidth - 4}
                                y={hoveredYearlyCallout.boxY + 16 + rowIndex * 4.8}
                                fill={
                                  isMargin
                                    ? hoveredYearlyCallout.margin >= 0
                                      ? "#34d399"
                                      : "#fb7185"
                                    : isProfit
                                    ? "#34d399"
                                    : isLoss
                                    ? "#fb7185"
                                    : "#ffffff"
                                }
                                fontSize="4.15"
                                fontWeight="900"
                                textAnchor="end"
                              >
                                {value}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    )}
                  </svg>
                </div>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/45 text-center">
                  <span className="text-[11px] font-black text-slate-500">No yearly revenue</span>
                  <span className="text-[9px] font-semibold text-slate-400">
                    Select another year to view month-wise split
                  </span>
                </div>
              )}
            </div>

            <div className="mt-2 border-t border-slate-200/60 pt-3">
              <div className="flex items-center justify-between text-[9.5px] font-black text-slate-500">
                <span>Total Yearly Sales</span>
                <span className="font-mono text-slate-850">
                  {formatCompactCurrency(yearlyPieData.total)}
                </span>
              </div>
              {summaryYearlyMonth && (
                <div className="mt-1 flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <span>
                    {hoveredYearlyMonth ? "Hovered Month" : "Best Month"}:{" "}
                    <span className="text-slate-700">{summaryYearlyMonth.label}</span>
                  </span>
                  <span className={summaryYearlyChange >= 0 ? "text-emerald-600" : "text-rose-600"}>
                    {summaryYearlyChange >= 0 ? "+" : ""}
                    {formatOneDecimalPercent(summaryYearlyChange)}%
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="relative my-3 flex w-full items-center justify-center">
              <svg
                width="120"
                height="120"
                viewBox="0 0 100 100"
                className="-rotate-90 transform overflow-visible"
              >
                <defs>
                  <filter id="donut-shadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow
                      dx="0"
                      dy="1.5"
                      stdDeviation="1.8"
                      floodColor="#1e1b4b"
                      floodOpacity="0.16"
                    />
                  </filter>
                  <linearGradient id="past-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                  <linearGradient id="current-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="upcoming-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>

                {/* blueprint technical concentric circular background guides */}
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="rgba(148, 163, 184, 0.05)"
                  strokeWidth="0.5"
                  fill="transparent"
                  strokeDasharray="1, 3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="rgba(148, 163, 184, 0.05)"
                  strokeWidth="0.5"
                  fill="transparent"
                  strokeDasharray="1, 3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="34"
                  stroke="rgba(148, 163, 184, 0.05)"
                  strokeWidth="0.5"
                  fill="transparent"
                  strokeDasharray="1, 3"
                />

                {/* Inactive backings/tracks for all active radii */}
                {totalSum > 0 ? (
                  <>
                    <circle
                      cx="50"
                      cy="50"
                      r={donutData.rPast}
                      stroke="rgba(148, 163, 184, 0.08)"
                      strokeWidth="6.5"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r={donutData.rCurrent}
                      stroke="rgba(148, 163, 184, 0.08)"
                      strokeWidth="8.5"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r={donutData.rUpcoming}
                      stroke="rgba(148, 163, 184, 0.08)"
                      strokeWidth="5"
                      fill="transparent"
                    />
                  </>
                ) : (
                  <circle
                    cx="50"
                    cy="50"
                    r={38}
                    stroke="rgba(148, 163, 184, 0.12)"
                    strokeWidth="7"
                    fill="transparent"
                  />
                )}

                {totalSum > 0 && (
                  <>
                    {pastTotal > 0 && (
                      <circle
                        ref={pastCircleRef}
                        cx="50"
                        cy="50"
                        r={donutData.rPast}
                        stroke="url(#past-gradient)"
                        strokeWidth="6.5"
                        fill="transparent"
                        strokeDasharray={donutData.pastDashArray}
                        strokeDashoffset={donutData.cPast}
                        strokeLinecap="round"
                        filter="url(#donut-shadow)"
                        style={{ transformOrigin: "50px 50px", cursor: "pointer" }}
                        onMouseEnter={() => {
                          setHoveredSegment("past");
                          setHoveredDonutSegment("past");
                        }}
                        onMouseLeave={() => {
                          setHoveredSegment(null);
                          setHoveredDonutSegment(null);
                        }}
                      />
                    )}
                    {currentTotal > 0 && (
                      <circle
                        ref={currentCircleRef}
                        cx="50"
                        cy="50"
                        r={donutData.rCurrent}
                        stroke="url(#current-gradient)"
                        strokeWidth="8.5"
                        fill="transparent"
                        strokeDasharray={donutData.currentDashArray}
                        strokeDashoffset={donutData.cCurrent}
                        strokeLinecap="round"
                        filter="url(#donut-shadow)"
                        style={{ transformOrigin: "50px 50px", cursor: "pointer" }}
                        onMouseEnter={() => {
                          setHoveredSegment("current");
                          setHoveredDonutSegment("current");
                        }}
                        onMouseLeave={() => {
                          setHoveredSegment(null);
                          setHoveredDonutSegment(null);
                        }}
                      />
                    )}
                    {upcomingTotal > 0 && (
                      <circle
                        ref={upcomingCircleRef}
                        cx="50"
                        cy="50"
                        r={donutData.rUpcoming}
                        stroke="url(#upcoming-gradient)"
                        strokeWidth="5"
                        fill="transparent"
                        strokeDasharray={donutData.upcomingDashArray}
                        strokeDashoffset={donutData.cUpcoming}
                        strokeLinecap="round"
                        filter="url(#donut-shadow)"
                        style={{ transformOrigin: "50px 50px", cursor: "pointer" }}
                        onMouseEnter={() => {
                          setHoveredSegment("upcoming");
                          setHoveredDonutSegment("upcoming");
                        }}
                        onMouseLeave={() => {
                          setHoveredSegment(null);
                          setHoveredDonutSegment(null);
                        }}
                      />
                    )}
                  </>
                )}
              </svg>

              {/* Glassmorphic dynamic center core circle */}
              <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none w-[64px] h-[64px] rounded-full bg-white/70 backdrop-blur-md border border-white/50 shadow-[0_8px_32px_rgba(148,163,184,0.18),inset_0_2px_8px_rgba(255,255,255,0.85)]">
                <span className="text-[11px] font-black tracking-tight text-slate-850 leading-none">
                  {formatCompactCurrency(displayValue)}
                </span>
                <span className="mt-1.5 text-[5px] font-extrabold uppercase tracking-widest text-slate-400">
                  {hoveredSegment === "past"
                    ? "Past Month"
                    : hoveredSegment === "current"
                    ? "Current Month"
                    : hoveredSegment === "upcoming"
                    ? "Upcoming Month"
                    : "Total Amount"}
                </span>
              </div>

              <AnimatePresence>
                {hoveredDonutSegment && groups[hoveredDonutSegment]?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-20 bottom-[125px] left-1/2 -translate-x-1/2 w-[220px] bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-xl p-2.5 shadow-2xl text-white select-none pointer-events-none"
                    style={{ transformOrigin: "center bottom" }}
                  >
                    <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700/60 rotate-45" />

                    <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5 mb-1.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shadow-[0_0_6px_rgba(255,255,255,0.25)] ${
                          hoveredDonutSegment === "past"
                            ? "bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.4)]"
                            : hoveredDonutSegment === "current"
                            ? "bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.4)]"
                            : "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.4)]"
                        }`}
                      />
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {hoveredDonutSegment === "past"
                          ? "Past Month Payments"
                          : hoveredDonutSegment === "current"
                          ? "Current Month Payments"
                          : "Upcoming Month Payments"}
                      </span>
                    </div>
                    <div className="max-h-[140px] overflow-y-auto pr-0.5 space-y-1.5 [scrollbar-width:thin] text-[9.5px]">
                      {groups[hoveredDonutSegment].map((inv, index) => {
                        const destination =
                          inv.tripSnapshot?.destination ||
                          inv.query?.destination ||
                          "Unknown Destination";
                        const paymentAmt = getInvoiceMonthVerifiedPayment(
                          inv,
                          effectiveSelectedTaxMonth
                        );
                        return (
                          <div
                            key={inv._id || index}
                            className="flex justify-between items-center gap-1 bg-white/5 p-1.5 rounded-lg border border-white/5"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-extrabold text-[9.5px] text-white truncate leading-tight">
                                {inv.query?.queryId || inv.invoiceNumber || "Draft Query"}
                              </p>
                              <p className="text-[8.5px] text-slate-400 font-bold truncate leading-none mt-0.5">
                                {destination}
                              </p>
                            </div>
                            <span className="font-black text-emerald-400 shrink-0 font-mono text-[9.5px] pl-1.5">
                              {formatCompactCurrency(paymentAmt)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-4 flex w-full flex-col gap-1.5 border-t border-slate-200/60 pt-3">
              <div
                className={`flex items-center justify-between text-[9px] font-bold p-1 rounded-lg transition-all duration-200 cursor-pointer ${
                  hoveredSegment === "past" ? "bg-slate-100/70" : ""
                }`}
              >
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500 shadow-[0_0_4px_rgba(168,85,247,0.4)]" />
                  <span className={hoveredSegment === "past" ? "text-slate-850 font-black" : ""}>
                    Past Month
                  </span>
                </div>
                <span
                  className={`font-extrabold text-slate-700 font-mono ${
                    hoveredSegment === "past" ? "text-purple-650" : ""
                  }`}
                >
                  {formatCompactCurrency(pastTotal)}
                </span>
              </div>
              <div
                className={`flex items-center justify-between text-[9px] font-bold p-1 rounded-lg transition-all duration-200 cursor-pointer ${
                  hoveredSegment === "current" ? "bg-slate-100/70" : ""
                }`}
              >
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-[0_0_4px_rgba(14,165,233,0.4)]" />
                  <span className={hoveredSegment === "current" ? "text-slate-850 font-black" : ""}>
                    Current Month
                  </span>
                </div>
                <span
                  className={`font-extrabold text-slate-700 font-mono ${
                    hoveredSegment === "current" ? "text-sky-650" : ""
                  }`}
                >
                  {formatCompactCurrency(currentTotal)}
                </span>
              </div>
              <div
                className={`flex items-center justify-between text-[9px] font-bold p-1 rounded-lg transition-all duration-200 cursor-pointer ${
                  hoveredSegment === "upcoming" ? "bg-slate-100/70" : ""
                }`}
              >
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_4px_rgba(249,115,22,0.4)]" />
                  <span className={hoveredSegment === "upcoming" ? "text-slate-850 font-black" : ""}>
                    Upcoming Month
                  </span>
                </div>
                <span
                  className={`font-extrabold text-slate-700 font-mono ${
                    hoveredSegment === "upcoming" ? "text-orange-600" : ""
                  }`}
                >
                  {formatCompactCurrency(upcomingTotal)}
                </span>
              </div>
            </div>

            <div className="mt-3 flex w-full items-center justify-center gap-1 border-t border-slate-200/60 pt-2.5 text-[9.5px] font-bold text-slate-450">
              <span
                className={`inline-flex items-center gap-0.5 font-black ${
                  comparison.isUp ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {comparison.percentage}% {comparison.isUp ? "▲" : "▼"}
              </span>
              <span>vs previous month</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
