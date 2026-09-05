import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { buildVoucherHtml } from "./voucherTemplate";

/**
 * Converts image elements to base64 Data URLs so html2canvas avoids any cross-origin taint.
 */
const convertImageToBase64 = async (img) => {
  try {
    const src = img.src;
    if (!src || src.startsWith("data:")) return;
    const res = await fetch(src, { mode: "cors" });
    const blob = await res.blob();
    await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          img.src = reader.result;
        }
        resolve();
      };
      reader.onerror = resolve;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    // If CORS or network fetch fails, fallback to keeping existing img.src with useCORS: true
  }
};

/**
 * Generates and downloads a high-resolution A4 PDF of the travel voucher.
 * Preserves the exact UI/layout from buildVoucherHtml with complete CSS isolation.
 *
 * @param {Object} voucherData - The enriched voucher data object
 * @param {string} branding - "with" or "without"
 * @param {Object} [opsBranding] - Optional ops branding override { name, logo }
 * @returns {Promise<{ success: boolean, fileName: string }>}
 */
export const exportVoucherAsPdf = async (
  voucherData,
  branding = "with",
  opsBranding = { name: "Holiday Circuit", logo: "" }
) => {
  if (!voucherData) {
    throw new Error("No voucher data provided for PDF export");
  }

  const rawHtml = buildVoucherHtml(voucherData, branding, opsBranding);

  // Create isolated off-screen iframe
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-99999px";
  iframe.style.top = "0";
  iframe.style.width = "800px";
  iframe.style.height = "1200px";
  iframe.style.border = "none";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.zIndex = "-99999";
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(rawHtml);
    iframeDoc.close();

    // Target the voucher card container
    const voucherElem =
      iframeDoc.querySelector(".voucher-container") || iframeDoc.body;

    // Reset outer padding/margin in the iframe so voucher fills exactly without gray backdrop
    if (iframeDoc.body) {
      iframeDoc.body.style.backgroundColor = "#ffffff";
      iframeDoc.body.style.padding = "0";
      iframeDoc.body.style.margin = "0";
    }
    if (voucherElem) {
      voucherElem.style.maxWidth = "800px";
      voucherElem.style.width = "800px";
      voucherElem.style.margin = "0 auto";
      voucherElem.style.border = "none";
      voucherElem.style.borderRadius = "0";
      voucherElem.style.boxShadow = "none";
    }

    // Pre-flight: Wait for all images and convert to base64 if possible
    const images = Array.from(iframeDoc.querySelectorAll("img"));
    await Promise.all(
      images.map(async (img) => {
        img.crossOrigin = "anonymous";
        await convertImageToBase64(img);
        if (img.complete && img.naturalHeight !== 0) return;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 3000);
        });
      })
    );

    // Wait for fonts
    if (iframeDoc.fonts && iframeDoc.fonts.ready) {
      try {
        await iframeDoc.fonts.ready;
      } catch (e) {
        // ignore font readiness errors
      }
    }

    // Ensure iframe height accommodates the entire voucher content
    const fullContentHeight = Math.max(
      voucherElem.scrollHeight || 0,
      voucherElem.offsetHeight || 0,
      iframeDoc.body?.scrollHeight || 0,
      1200
    );
    iframe.style.height = `${fullContentHeight + 100}px`;

    // Allow browser layout and paint tick
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Capture high-DPI canvas
    const canvas = await html2canvas(voucherElem, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: 800,
      windowWidth: 800,
      height: fullContentHeight,
      windowHeight: fullContentHeight,
    });

    // Initialize A4 Portrait jsPDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Canvas height corresponding to 1 A4 page
    const pxPageHeight = Math.floor((canvasWidth * pageHeight) / pageWidth);
    const totalPages = Math.ceil(canvasHeight / pxPageHeight);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      const sY = page * pxPageHeight;
      const sHeight = Math.min(pxPageHeight, canvasHeight - sY);

      // Create one-page canvas to slice from full canvas
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvasWidth;
      pageCanvas.height = pxPageHeight;
      const pageCtx = pageCanvas.getContext("2d");

      pageCtx.fillStyle = "#ffffff";
      pageCtx.fillRect(0, 0, canvasWidth, pxPageHeight);

      pageCtx.drawImage(
        canvas,
        0,
        sY,
        canvasWidth,
        sHeight,
        0,
        0,
        canvasWidth,
        sHeight
      );

      const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.98);
      pdf.addImage(pageImgData, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
    }

    const cleanVoucherName = String(
      voucherData.voucherNumber || voucherData.query || "Travel_Voucher"
    ).replace(/[^a-zA-Z0-9-_]/g, "_");
    const fileName = `${cleanVoucherName}-${branding || "with"}.pdf`;

    pdf.save(fileName);

    return { success: true, fileName };
  } finally {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
};
