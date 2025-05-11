import { jsPDF, GState } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToWords } from 'to-words';
import fs from 'fs';
import path from 'path';

// Helper to load image from public folder and convert to base64
function getImageBase64(imageName: string) {
  try {
    const imagePath = path.join(process.cwd(), 'public', imageName);
    if (!fs.existsSync(imagePath)) {
      return null;
    }
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Data = imageBuffer.toString('base64');
    const ext = path.extname(imageName).slice(1).toUpperCase();
    const mimeType = ext === 'JPG' ? 'JPEG' : ext;
    return `data:image/${mimeType.toLowerCase()};base64,${base64Data}`;
  } catch (error) {
    return null;
  }
}

// Server-side PDF generation for API route
export async function generateBillPdfBuffer(bill: any): Promise<Uint8Array> {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
  let currentY = 15;

  // Create ToWords instance
  const toWordsInstance = new ToWords();

  // --- Header Images ---
  try {
    const logoBase64 = getImageBase64('ABSOLUTE_PROSTHETICS_AND_ORTHOTICS_logo.png');
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', pageWidth - 50, 10, 40, 35);
    }
  } catch (e) {}

  try {
    const shopNameBase64 = getImageBase64('Shopname.png');
    if (shopNameBase64) {
      doc.addImage(shopNameBase64, 'PNG', 15, currentY - 5, 70, 15);
    }
  } catch (e) {}
  currentY += 15;

  try {
    const taglineBase64 = getImageBase64('shoptagline.png');
    const sloganBase64 = getImageBase64('shopslogan.png');
    if (taglineBase64) {
      doc.addImage(taglineBase64, 'PNG', 15, currentY - 5, 100, 12);
    }
    if (sloganBase64) {
      doc.addImage(sloganBase64, 'PNG', 115, currentY, 35, 5);
    }
  } catch (e) {}
  currentY += 12;

  // Shop Details
  const shopAddress = process.env.NEXT_PUBLIC_SHOP_ADDRESS || "Plot-34, Sarwasukhi Colony, West Marredpally, Secunderabad Telangana - 500026.";
  const shopContact = process.env.NEXT_PUBLIC_SHOP_CONTACT || "9059990616, 7207675777";
  const shopEmail = process.env.NEXT_PUBLIC_SHOP_EMAIL || "absoluteprostheticsandorthotic@gmail.com";
  const shopGst = process.env.NEXT_PUBLIC_SHOP_GST || "36ABBCA8257A1ZX";
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(shopAddress, 15, currentY);
  currentY += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`CELL : ${shopContact}    ${shopEmail}`, 15, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`GST NO : ${shopGst}`, 15, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 15;

  // TAX INVOICE heading with borders
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.line(15, currentY - 2, pageWidth - 15, currentY - 2);
  doc.text('TAX - INVOICE', pageWidth / 2, currentY + 8, { align: 'center' });
  doc.line(15, currentY + 12, pageWidth - 15, currentY + 12);
  currentY += 25;

  // S.NO and Date on right side
  doc.setFontSize(10);
  const serialNumber = `INV-${bill.serialNo}`;
  doc.text('S.NO :', pageWidth - 60, currentY);
  doc.text(serialNumber, pageWidth - 40, currentY);
  doc.text('Date :', pageWidth - 60, currentY + 15);
  doc.text(bill.date ? new Date(bill.date).toLocaleDateString('en-GB') : '', pageWidth - 40, currentY + 15);

  // Patient Details
  doc.setFont('helvetica', 'normal');
  doc.text('To :', 15, currentY);
  doc.text(bill.patientName || '', 35, currentY);
  currentY += 6;
  doc.text('Address :', 15, currentY);
  doc.text(bill.patientAddress || '', 35, currentY);
  currentY += 6;
  doc.text('Contact :', 15, currentY);
  doc.text(bill.patientContact || '', 35, currentY);
  currentY += 6;
  doc.text('Age :', 15, currentY);
  doc.text(bill.patientAge ? String(bill.patientAge) : '', 35, currentY);
  currentY += 6;
  doc.text('Sex :', 15, currentY);
  doc.text(bill.patientGender || '', 35, currentY);
  currentY += 8;

  // Table columns
  const tableHeaders = [['Date', 'S.NO', 'Product', 'QTY', 'Rate', 'Amount']];
  const itemRows = (bill.items || []).map((item: any, idx: number) => {
    const descriptions = item.description?.split('\n')
      .filter((desc: string) => desc.trim() !== item.type)
      .map((desc: string) => `${desc.trim()}`)
      .join('\n') || '';
    let rate, amount;
    if (item.isPriceInclGst) {
      const basePrice = item.rate / 1.05;
      rate = basePrice.toFixed(2);
      amount = (basePrice * item.quantity).toFixed(2);
    } else {
      rate = (item.rate || 0).toFixed(2);
      amount = ((item.rate || 0) * item.quantity).toFixed(2);
    }
    // Use item.date if present, otherwise use bill.date
    const rowDate = item.date ? new Date(item.date).toLocaleDateString('en-GB') : (bill.date ? new Date(bill.date).toLocaleDateString('en-GB') : '');
    return [
      rowDate,
      (item.srNo || idx + 1).toString(),
      `${item.type || ''}${descriptions ? '\n' + descriptions : ''}`,
      item.quantity?.toString() || '',
      rate,
      amount,
    ];
  });

  // Summary rows
  const modeOfPayment = bill.modeOfPayment || 'Cash';
  const discount = bill.discount || 0;
  const cgstAmount = bill.cgstAmount || 0;
  const sgstAmount = bill.sgstAmount || 0;
  const totalAmount = bill.totalAmount || 0;
  const roundedTotal = Math.round(totalAmount * 100) / 100;
  let rupees = Math.floor(roundedTotal);
  let paise = Math.round((roundedTotal - rupees) * 100);
  let inWords = toWordsInstance.convert(rupees) + ' Rupees';
  if (paise > 0) {
    inWords += ' and ' + toWordsInstance.convert(paise) + ' Paise';
  }

  // Table with summary rows
  autoTable(doc, {
    startY: currentY + 5,
    head: tableHeaders,
    body: [
      ...itemRows,
      [
        { content: '', styles: { lineWidth: 0 }},
        { content: '', styles: { lineWidth: 0 }},
        { content: '', styles: { lineWidth: 0 }},
        { content: '', styles: { lineWidth: 0 }},
        { content: 'Mode of payment', styles: { fontStyle: 'bold' }},
        { content: modeOfPayment, styles: { fontStyle: 'bold' }}
      ],
      [
        { content: '', styles: { lineWidth: 0 }},
        { content: '', styles: { lineWidth: 0 }},
        { content: '', styles: { lineWidth: 0 }},
        { content: '', styles: { lineWidth: 0 }},
        { content: 'Discount (-)', styles: { fontStyle: 'bold' }},
        { content: discount.toFixed(2), styles: { fontStyle: 'bold' }}
      ],
      [
        { content: '', styles: { lineWidth: 0 }},
        { content: '', styles: { lineWidth: 0 }},
        { content: '', styles: { lineWidth: 0 }},
        { content: '', styles: { lineWidth: 0 }},
        { content: 'CGST 2.5 % (+)', styles: { fontStyle: 'bold' }},
        { content: cgstAmount.toFixed(2), styles: { fontStyle: 'bold' }}
      ],
      [
        { content: '', styles: { lineWidth: 0 }},
        { content: '', styles: { lineWidth: 0 }},
        { content: '', styles: { lineWidth: 0 }},
        { content: '', styles: { lineWidth: 0 }},
        { content: 'SGST 2.5 % (+)', styles: { fontStyle: 'bold' }},
        { content: sgstAmount.toFixed(2), styles: { fontStyle: 'bold' }}
      ],
      [
        { content: '', styles: { lineWidth: 0 }},
        { content: '', styles: { lineWidth: 0 }},
        { content: '', styles: { lineWidth: 0 }},
        { content: '', styles: { lineWidth: 0 }},
        { content: 'Total', styles: { fontStyle: 'bold' }},
        { content: roundedTotal.toFixed(2), styles: { fontStyle: 'bold' }}
      ],
      ['Rs. (In Words)', { content: inWords, styles: { fontStyle: 'bold' }, colSpan: 5 }]
    ],
    theme: 'grid',
    styles: {
      fontSize: 9,
      lineWidth: 0.1,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 25 },  // Date
      1: { cellWidth: 15 },  // S.NO
      2: { cellWidth: 70 },  // Product
      3: { cellWidth: 15, halign: 'right' },  // QTY
      4: { cellWidth: 25, halign: 'right' },  // Rate
      5: { cellWidth: 25, halign: 'right' }   // Amount
    },
    bodyStyles: {
      lineWidth: 0.1
    },
    didDrawCell: function(data: any) {
      // Draw vertical lines for all columns, but only up to the Total row
      const totalRowIndex = itemRows.length + 4; // Index of the Total row
      if (data.row.index >= itemRows.length && data.row.index <= totalRowIndex) {
        const x = data.cell.x;
        const y = data.cell.y;
        const height = data.cell.height;
        if (data.column.index < 5) {
          doc.line(
            x + data.cell.width,
            y,
            x + data.cell.width,
            y + height
          );
        }
      }
    },
    didDrawPage: function(data: any) {
      // Draw bottom border after the table is complete
      const lastRow = data.table.body[data.table.body.length - 1];
      if (lastRow) {
        const y = lastRow.cells[0].y + lastRow.cells[0].height;
        doc.line(
          15,
          y,
          doc.internal.pageSize.width - 20,
          y
        );
      }
    },
    margin: { left: 15, right: 20 },
    tableLineWidth: 0.1,
    tableLineColor: [0, 0, 0]
  });

  // Add watermark after table is drawn
  try {
    const watermarkBase64 = getImageBase64('ABSOLUTE_PROSTHETICS_AND_ORTHOTICS_logo.png');
    if (watermarkBase64) {
      doc.saveGraphicsState();
      const gState = new GState({ opacity: 0.2 });
      doc.setGState(gState);
      // Position watermark in the middle of the table area
      // const tableStartY = currentY + 5;  // This was the original table start position
      // const tableEndY = doc.lastAutoTable.finalY || (tableStartY + 200);  // Get table end position
      // const watermarkY = tableStartY + (tableEndY - tableStartY) / 2 - 30;  // Center vertically
      doc.addImage(watermarkBase64, 'PNG', 65, currentY + 5, 70, 60);
      doc.restoreGraphicsState();
    }
  } catch (e) {
    console.error('Error adding watermark:', e);
  }

  // Footer
  doc.setFontSize(8);
  doc.text('• Goods Once sold will not be taken back.', 15, pageHeight - 30);
  doc.text('• Subject to Hyderabad Jurisdiction', 15, pageHeight - 25);

  // Add stamp image and signature/date
  try {
    const stampBase64 = getImageBase64('stamp.png');
    if (stampBase64) {
      doc.addImage(stampBase64, 'PNG', pageWidth - 50, pageHeight - 52, 32, 30);
    }
  } catch (e) {}

  // Add date above signature (right-aligned)
  doc.setFontSize(9);
  
  // Add signature and company name (right-aligned)
  doc.setFont('helvetica', 'bold');
  doc.text('For Absolute Prosthetics & Orthotics', pageWidth - 20, pageHeight - 55, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signature', pageWidth - 20, pageHeight - 20, { align: 'right' });

  // Return as Uint8Array
  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
} 