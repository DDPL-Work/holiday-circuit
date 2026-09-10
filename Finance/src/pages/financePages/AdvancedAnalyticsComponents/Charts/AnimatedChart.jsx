import React, { useRef, useEffect, useCallback } from "react";
import { formatCompactCurrency } from "../utils/formatter";

export default function AnimatedChart({ chartData, onPointClick }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const scriptLoaded = useRef(false);
  const buildChartRef = useRef(() => {});

  const buildChart = useCallback(() => {
    if (!canvasRef.current || !window.Chart) return;

    const labels = chartData?.labels?.length ? chartData.labels : [];
    const inward = chartData?.inward?.length ? chartData.inward : labels.map(() => 0);
    const outward = chartData?.outward?.length ? chartData.outward : labels.map(() => 0);
    const ctx = canvasRef.current.getContext("2d");

    const inGrad = ctx.createLinearGradient(0, 0, 0, 260);
    inGrad.addColorStop(0, "rgba(22,163,74,0.20)");
    inGrad.addColorStop(1, "rgba(22,163,74,0)");

    const outGrad = ctx.createLinearGradient(0, 0, 0, 260);
    outGrad.addColorStop(0, "rgba(220,38,38,0.15)");
    outGrad.addColorStop(1, "rgba(220,38,38,0)");

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new window.Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Inward (Agents)",
            data: inward,
            borderColor: "#16a34a",
            backgroundColor: inGrad,
            borderWidth: 2.5,
            pointRadius: 5,
            pointBackgroundColor: "#16a34a",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointHoverRadius: 7,
            tension: 0.42,
            fill: true,
          },
          {
            label: "Outward (DMC)",
            data: outward,
            borderColor: "#dc2626",
            backgroundColor: outGrad,
            borderWidth: 2.5,
            pointRadius: 5,
            pointBackgroundColor: "#dc2626",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointHoverRadius: 7,
            tension: 0.42,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
          if (elements && elements.length > 0 && onPointClick) {
            const clickY = event.y;
            let nearestElement = elements[0];
            let minDist = Infinity;
            elements.forEach((el) => {
              const meta = chartRef.current.getDatasetMeta(el.datasetIndex);
              const view = meta.data[el.index];
              if (view) {
                const dist = Math.abs(view.y - clickY);
                if (dist < minDist) {
                  minDist = dist;
                  nearestElement = el;
                }
              }
            });
            onPointClick(chartData.labels[nearestElement.index], nearestElement.datasetIndex);
          }
        },
        animation: {
          duration: 900,
          easing: "easeInOutCubic",
          y: { from: (context) => context.chart.scales.y.bottom },
        },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#fff",
            borderColor: "#e2e8f0",
            borderWidth: 1,
            titleColor: "#1e293b",
            bodyColor: "#64748b",
            titleFont: { size: 12, weight: "600" },
            bodyFont: { size: 12 },
            padding: 12,
            callbacks: {
              label: (context) =>
                ` ${context.dataset.label}: ${formatCompactCurrency(context.parsed.y)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { size: 11 }, color: "#94a3b8" },
          },
          y: {
            grid: { color: "rgba(148,163,184,0.12)" },
            border: { display: false },
            ticks: {
              font: { size: 11 },
              color: "#94a3b8",
              callback: (value) => formatCompactCurrency(value),
            },
          },
        },
      },
    });
  }, [chartData, onPointClick]);

  useEffect(() => {
    buildChartRef.current = buildChart;
  }, [buildChart]);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.Chart && !scriptLoaded.current) {
      scriptLoaded.current = true;
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      script.onload = () => buildChartRef.current();
      document.head.appendChild(script);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Chart) {
      buildChart();
    }
  }, [buildChart]);

  return (
    <div style={{ position: "relative", width: "100%", height: 260 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
