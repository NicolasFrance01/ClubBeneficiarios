import { jsPDF } from 'jspdf';
import atlascoreLogo from '../assets/V1 (1).png';

const RECEIPT_SEQ_KEY = 'atlascore_receipt_sequence';

// Number to Spanish words converter
export function numeroALetras(monto) {
  const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  function convertirSeccion(n) {
    if (n === 0) return '';
    if (n === 100) return 'cien';
    let res = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c > 0) res += centenas[c] + ' ';

    const resto = n % 100;
    if (resto >= 10 && resto <= 19) {
      res += especiales[resto - 10];
    } else if (resto === 20) {
      res += 'veinte';
    } else if (resto > 20 && resto < 30) {
      res += 'veinti' + unidades[u];
    } else if (d > 0) {
      res += decenas[d];
      if (u > 0) res += ' y ' + unidades[u];
    } else if (u > 0) {
      res += unidades[u];
    }
    return res.trim();
  }

  const num = Math.floor(Math.abs(monto));
  if (num === 0) return 'Cero pesos';

  let resultado = '';
  const millones = Math.floor(num / 1000000);
  const miles = Math.floor((num % 1000000) / 1000);
  const cientos = num % 1000;

  if (millones > 0) {
    if (millones === 1) resultado += 'un millón ';
    else resultado += convertirSeccion(millones) + ' millones ';
  }

  if (miles > 0) {
    if (miles === 1) resultado += 'mil ';
    else resultado += convertirSeccion(miles) + ' mil ';
  }

  if (cientos > 0) {
    resultado += convertirSeccion(cientos);
  }

  resultado = resultado.trim();
  resultado = resultado.charAt(0).toUpperCase() + resultado.slice(1);
  return resultado + ' pesos';
}

export function formatCurrency(amount, withDecimals = false) {
  const num = Number(amount) || 0;
  if (withDecimals) {
    const parts = num.toFixed(2).split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `$ ${intPart},${parts[1]}`;
  }
  return `$ ${num.toLocaleString('es-AR')}`;
}

export function formatDate(dateStr) {
  if (!dateStr) {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }
  } catch {}
  return String(dateStr).slice(0, 10);
}

// Sequential Receipt Number Generator (Stored in Neon PostgreSQL DB so it never resets across days/devices/incognito)
export async function getOrAssignReceiptNumber(transaction, explicitReceiptNumber = null) {
  if (explicitReceiptNumber) {
    return explicitReceiptNumber;
  }
  if (transaction?.receipt_number) {
    return transaction.receipt_number;
  }
  if (transaction?.receiptNumber) {
    return transaction.receiptNumber;
  }

  // Check if comprobante_url already embeds a receipt number like Comprobante_0001-00000103
  if (transaction?.comprobante_url) {
    const m = transaction.comprobante_url.match(/Comprobante_0001-(\d{8})/i);
    if (m) {
      return `[0001-${m[1]}]`;
    }
  }

  const txId = transaction?.id;
  if (txId) {
    try {
      const cached = localStorage.getItem(`atlascore_receipt_tx_${txId}`);
      if (cached) return cached;
    } catch {}
  }

  // 1. Fetch next sequence atomically from Neon Database
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'GET_NEXT_RECEIPT_NUMBER' })
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.receiptNumber) {
        try {
          localStorage.setItem(RECEIPT_SEQ_KEY, json.sequence.toString());
          if (txId) {
            localStorage.setItem(`atlascore_receipt_tx_${txId}`, json.receiptNumber);
          }
        } catch {}
        return json.receiptNumber;
      }
    }
  } catch (err) {
    console.warn('Could not contact DB for receipt sequence, falling back:', err);
  }

  // 2. Fallback if offline / network error (ensures >= 107)
  let currentSeq = 107;
  try {
    const stored = localStorage.getItem(RECEIPT_SEQ_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 107) {
        currentSeq = parsed;
      }
    }
  } catch {}

  const nextSeq = currentSeq + 1;
  try {
    localStorage.setItem(RECEIPT_SEQ_KEY, nextSeq.toString());
  } catch {}

  const formattedNum = `[0001-${String(nextSeq).padStart(8, '0')}]`;
  if (txId) {
    try {
      localStorage.setItem(`atlascore_receipt_tx_${txId}`, formattedNum);
    } catch {}
  }

  return formattedNum;
}

// Load image as Base64 Data URL for jsPDF
let cachedLogoBase64 = null;
async function getLogoBase64() {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const res = await fetch(atlascoreLogo);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogoBase64 = reader.result;
        resolve(cachedLogoBase64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Could not load logo for receipt:', err);
    return null;
  }
}

/**
 * Builds and downloads the payment receipt PDF
 */
export async function downloadReceiptPDF({ transaction, beneficiary = null, plan = null, receiptNumber: explicitNum = null }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const marginX = 18;
  const contentWidth = pageWidth - (marginX * 2); // 174mm
  const rightX = marginX + contentWidth;

  const receiptNumber = await getOrAssignReceiptNumber(transaction, explicitNum);
  const logoBase64 = await getLogoBase64();

  // Top header green accent line
  doc.setFillColor(124, 216, 142); // #7cd88e
  doc.rect(170, 0, 40, 2.5, 'F');

  // --- LOGO & COMPANY INFO ---
  if (logoBase64) {
    // Aspect ratio 4412 / 784 = 5.627
    const logoH = 10;
    const logoW = logoH * 5.627;
    doc.addImage(logoBase64, 'PNG', marginX, 18, logoW, logoH);
  } else {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(12, 54, 68);
    doc.text('ATLASCORE', marginX, 25);
  }

  // Company details
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('Atlascore IT Services', marginX, 33);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Córdoba, Argentina', marginX, 38);
  doc.text('contacto@atlascore.com.ar · +54 9 351 322-2709', marginX, 43);

  // --- TOP RIGHT: COMPROBANTE DE PAGO ---
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(12, 54, 68); // #0c3644
  doc.text('Comprobante de pago', rightX, 23, { align: 'right' });

  // Receipt Number
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('N.º', rightX - 42, 31);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(receiptNumber, rightX, 31, { align: 'right' });

  // Dates
  const emisionDate = formatDate(transaction?.date);
  const paymentDate = formatDate(transaction?.date);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Fecha de emisión', rightX - 42, 37);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(emisionDate, rightX, 37, { align: 'right' });

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Fecha de pago', rightX - 42, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(paymentDate, rightX, 42, { align: 'right' });

  // --- DETAILS BOX (RECIBIMOS DE / FORMA DE PAGO) ---
  const boxY = 51;
  const boxH = 34;

  // Box border
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.setLineWidth(0.35);
  doc.roundedRect(marginX, boxY, contentWidth, boxH, 2, 2, 'S');

  // Vertical divider inside box
  const midX = marginX + (contentWidth / 2);
  doc.line(midX, boxY, midX, boxY + boxH);

  // Left Column: RECIBIMOS DE
  const colLeftX = marginX + 6;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('RECIBIMOS DE', colLeftX, boxY + 7);

  const benName = beneficiary?.name || transaction?.beneficiary || 'Beneficiario';
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(benName, colLeftX, boxY + 14);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);

  // Show Domicilio or DNI
  let lineAddress = '';
  if (beneficiary?.domicilio) {
    lineAddress = beneficiary.domicilio;
  } else if (beneficiary?.address) {
    lineAddress = beneficiary.address;
  } else if (beneficiary?.doc) {
    lineAddress = `DNI: ${beneficiary.doc}`;
  } else {
    lineAddress = 'Córdoba, Argentina';
  }
  doc.text(lineAddress, colLeftX, boxY + 20);

  // Contact line: Phone / Email / DNI
  let lineContact = '';
  if (beneficiary?.phone) {
    lineContact = beneficiary.phone;
  } else if (beneficiary?.email) {
    lineContact = beneficiary.email;
  }
  if (beneficiary?.doc && (beneficiary?.domicilio || beneficiary?.address)) {
    lineContact = lineContact ? `${lineContact} · DNI: ${beneficiary.doc}` : `DNI: ${beneficiary.doc}`;
  }
  if (lineContact) {
    doc.text(lineContact, colLeftX, boxY + 26);
  }

  // Right Column: FORMA DE PAGO
  const colRightX = midX + 6;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('FORMA DE PAGO', colRightX, boxY + 7);

  const methodRaw = (transaction?.method || beneficiary?.paymentMethod || 'efectivo').toLowerCase();
  const methodDisplay = methodRaw === 'transferencia' ? 'Transferencia' : methodRaw === 'efectivo' ? 'Efectivo' : 'Mixto';

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(methodDisplay, colRightX, boxY + 14);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Moneda: ARS', colRightX, boxY + 20);

  // --- CONCEPTO TABLE ---
  const tableY = 92;
  const tableHeaderH = 9;

  // Header background
  doc.setFillColor(12, 54, 68); // #0c3644 dark teal
  doc.rect(marginX, tableY, contentWidth, tableHeaderH, 'F');

  // Header labels
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('CONCEPTO', marginX + 5, tableY + 5.8);
  doc.text('CANT.', marginX + 115, tableY + 5.8, { align: 'center' });
  doc.text('PRECIO UNIT.', marginX + 148, tableY + 5.8, { align: 'right' });
  doc.text('IMPORTE', rightX - 5, tableY + 5.8, { align: 'right' });

  // Concept description
  const amount = Number(transaction?.amount || 0);
  let conceptText = transaction?.details || 'Cuota Mensual Club de Beneficios';
  if (plan?.name && !conceptText.toLowerCase().includes(plan.name.toLowerCase())) {
    conceptText = `${conceptText} - ${plan.name}`;
  }

  const items = [
    {
      concept: conceptText,
      cant: 1,
      unitPrice: amount,
      total: amount
    }
  ];

  let currentY = tableY + tableHeaderH;
  const rowHeight = 11;

  items.forEach((item) => {
    currentY += rowHeight;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(item.concept, marginX + 5, currentY - 3.5);

    doc.text(String(item.cant), marginX + 115, currentY - 3.5, { align: 'center' });
    doc.text(formatCurrency(item.unitPrice), marginX + 148, currentY - 3.5, { align: 'right' });
    doc.setFont('Helvetica', 'bold');
    doc.text(formatCurrency(item.total), rightX - 5, currentY - 3.5, { align: 'right' });

    // Row separator
    doc.setDrawColor(241, 245, 249); // #f1f5f9
    doc.setLineWidth(0.3);
    doc.line(marginX, currentY, rightX, currentY);
  });

  // --- SECTION: TOTALS & SON ---
  const totalsY = currentY + 12;

  // Left: SON [En letras]
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SON', marginX, totalsY);

  const letras = numeroALetras(amount);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`[${letras}]`, marginX, totalsY + 6);

  // Right: Subtotal & Descuentos
  const totalsLabelX = marginX + 105;
  const totalsValueX = rightX - 5;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal', totalsLabelX, totalsY);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(amount), totalsValueX, totalsY, { align: 'right' });

  doc.setTextColor(100, 116, 139);
  doc.text('Descuentos', totalsLabelX, totalsY + 7);
  doc.setTextColor(15, 23, 42);
  doc.text('$ 0,00', totalsValueX, totalsY + 7, { align: 'right' });

  // Banner: TOTAL PAGADO (Bright light green background #7cd88e)
  const bannerY = totalsY + 13;
  const bannerW = 82;
  const bannerH = 14;
  const bannerX = rightX - bannerW;

  doc.setFillColor(124, 216, 142); // #7cd88e
  doc.rect(bannerX, bannerY, bannerW, bannerH, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL PAGADO', bannerX + 5, bannerY + 8.8);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(amount, true), rightX - 5, bannerY + 9.2, { align: 'right' });

  // --- OBSERVACIONES ---
  const obsY = bannerY + 24;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('OBSERVACIONES', marginX, obsY);

  const obsText = transaction?.ref ? `Referencia / TRX: ${transaction.ref}` : 'N/A';
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(obsText, marginX, obsY + 6);

  // --- FOOTER LEGAL NOTE ---
  const legalY = 262;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // #94a3b8
  doc.text('Documento no válido como factura. Conserve este comprobante', marginX, legalY);
  doc.text('como constancia de pago.', marginX, legalY + 4);

  // Footer line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX, 275, rightX, 275);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('www.atlascore.com.ar', marginX, 280);
  doc.text('Página 1 de 1', rightX, 280, { align: 'right' });

  // Safe file name
  const cleanNum = receiptNumber.replace(/[[\]]/g, '').trim();
  const safeName = benName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_');
  const filename = `Comprobante_${cleanNum}_${safeName}.pdf`;

  // Save / trigger download in browser
  doc.save(filename);
  return { filename, receiptNumber };
}

