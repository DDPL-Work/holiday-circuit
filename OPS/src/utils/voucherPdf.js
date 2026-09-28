import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { buildVoucherHtml } from "./voucherTemplate.js";

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
 * Renders each .voucher-page independently so:
 * 1. ZERO text/tables/cards are ever cut in half.
 * 2. Every single page gets a complete header and bottom-pinned footer.
 * 3. Exact A4 1:1 proportion without any distortion.
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
  iframe.style.width = "850px";
  iframe.style.height = "3000px";
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

    // Pre-flight: Wait for all images and convert to base64
    const images = Array.from(iframeDoc.querySelectorAll("img"));
    await Promise.all(
      images.map(async (img) => {
        if (img.src && !img.src.startsWith("data:")) {
          img.crossOrigin = "anonymous";
          await convertImageToBase64(img);
        }
        if (img.complete && img.naturalHeight !== 0) return;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 500);
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

    // Allow browser layout and paint tick
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Find all discrete voucher pages
    let pageElements = Array.from(iframeDoc.querySelectorAll(".voucher-page"));
    if (pageElements.length === 0) {
      const fallbackContainer = iframeDoc.querySelector(".voucher-container") || iframeDoc.body;
      pageElements = [fallbackContainer];
    }

    // Initialize A4 Portrait jsPDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;

    for (let pageIndex = 0; pageIndex < pageElements.length; pageIndex++) {
      const pageElem = pageElements[pageIndex];

      // Clean element styles for capture
      pageElem.style.border = "none";
      pageElem.style.boxShadow = "none";
      pageElem.style.margin = "0";
      pageElem.style.borderRadius = "0";

      const pageCanvas = await html2canvas(pageElem, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 794,
        windowWidth: 794,
      });

      if (pageIndex > 0) {
        pdf.addPage();
      }

      const imgData = pageCanvas.toDataURL("image/jpeg", 0.98);
      pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
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
