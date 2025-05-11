/* eslint-disable @typescript-eslint/no-unused-vars */
// src/lib/pdfQuotation.ts
import { ToWords } from 'to-words';
import { jsPDF, GState } from 'jspdf';
import autoTable from 'jspdf-autotable'; // Import the autoTable plugin
import { Patient, BillItem } from '@/types';

// Extend jsPDF interface to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Function to format number to 2 decimal places
const formatCurrency = (value: number): string => value.toFixed(2);

export const generateQuotationPdf = (
  patient: Patient,
  items: BillItem[],
  subtotal: number,
  cgstAmount: number,
  sgstAmount: number,
  discount: number,
  totalAmount: number
) => {
  try {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    let currentY = 15;

    // --- Header ---
    const shopAddress = process.env.NEXT_PUBLIC_SHOP_ADDRESS || "Plot-34, Sarwasukhi Colony, West Marredpally, Secunderabad Telangana - 500026.";
    const shopContact = process.env.NEXT_PUBLIC_SHOP_CONTACT || "9059990616, 7207675777";
    const shopEmail = process.env.NEXT_PUBLIC_SHOP_EMAIL || "absoluteprostheticsandorthotic@gmail.com";
    const shopGst = process.env.NEXT_PUBLIC_SHOP_GST || "36ABBCA8257A1ZX";

    // Add Logo
    try {
      doc.addImage('/ABSOLUTE_PROSTHETICS_AND_ORTHOTICS_logo.png', 'PNG', pageWidth - 50, 10, 40, 35);
    } catch (e) {
      console.error("Error adding logo:", e);
    }

    // Add Shop Name (ABSOLUTE)
    try {
      doc.addImage('/Shopname.png', 'PNG', 15, currentY - 5, 70, 15);
    } catch (e) {
      console.error("Error adding shop name image:", e);
    }
    currentY += 15;

    // Add Shop Tagline and Slogan on same line
    try {
      // Add PROSTHETICS & ORTHOTICS
      doc.addImage('/shoptagline.png', 'PNG', 15, currentY - 5, 100, 12);
      // Add A NEW BEGINNING... (positioned right after the tagline)
      doc.addImage('/shopslogan.png', 'PNG', 115, currentY, 35, 5);
    } catch (e) {
      console.error("Error adding shop tagline and slogan images:", e);
    }
    currentY += 12;

    // Shop Details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(shopAddress, 15, currentY);
    currentY += 5;

    // Contact and Email in one line
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`CELL : ${shopContact}    ${shopEmail}`, 15, currentY);
    currentY += 5;

    // GST Number
    doc.setFont('helvetica', 'bold');
    doc.text(`GST NO : ${shopGst}`, 15, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 15;

    // QUOTATION heading with borders
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    
    // Draw line above QUOTATION
    doc.line(15, currentY - 2, pageWidth - 15, currentY - 2);
    doc.text('QUOTATION', pageWidth / 2, currentY + 8, { align: 'center' });
    // Draw line below QUOTATION
    doc.line(15, currentY + 12, pageWidth - 15, currentY + 12);
    currentY += 25;

    // Quotation Number and Date on right side
    doc.setFontSize(10);
    const quotationNumber = `QT-${patient.serialNo}`;
    doc.text('S.No :', pageWidth - 60, currentY);
    doc.text(quotationNumber, pageWidth - 40, currentY);
    doc.text('Date :', pageWidth - 60, currentY + 15);
    const currentDate = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY format
    doc.text(currentDate, pageWidth - 40, currentY + 15);

    // Patient Details Form - Very compact
    doc.setFont('helvetica', 'normal');
    
    // To
    doc.text('To :', 15, currentY);
    doc.text(patient.name, 35, currentY);
    currentY += 6;
    
    // Address
    doc.text('Address :', 15, currentY);
    doc.text(patient.address, 35, currentY);
    currentY += 6;
    
    // Contact
    doc.text('Contact :', 15, currentY);
    doc.text(patient.contact, 35, currentY);
    currentY += 6;
    
    // Age on one line
    doc.text('Age :', 15, currentY);
    doc.text(patient.age, 35, currentY);
    currentY += 6;
    
    // Sex on next line
    doc.text('Sex :', 15, currentY);
    doc.text(patient.gender, 35, currentY);
    currentY += 8;

    // Items Table
    const tableHeaders = [['Date', 'S.NO', 'Product', 'QTY', 'Rate', 'Amount']];
    
    const itemRows = items.map(item => {
        // Split description into lines and filter out any that match the type
        const descriptions = item.description?.split('\n')
            .filter(desc => desc.trim() !== item.type)
            .map(desc => `${desc.trim()}`)
            .join('\n') || '';
        let rate, amount;
        if (item.isPriceInclGst) {
          const basePrice = item.price / 1.05;
          rate = formatCurrency(basePrice);
          amount = formatCurrency(basePrice * item.quantity);
        } else {
          rate = formatCurrency(item.price);
          amount = formatCurrency(item.price * item.quantity);
        }
        return [
            item.date || '',
            item.srNo.toString(),
            `${item.type}${descriptions ? '\n' + descriptions : ''}`,
            item.quantity.toString(),
            rate,
            amount,
        ];
    });

    // Calculate CGST and SGST for all items (reverse-calculate for GST-inclusive)
    let totalCgst = 0;
    let totalSgst = 0;
    let totalAmount = 0;
    items.forEach(item => {
      if (item.isPriceInclGst) {
        const base = item.price / 1.05;
        const cgst = base * 0.025 * item.quantity;
        const sgst = base * 0.025 * item.quantity;
        totalCgst += cgst;
        totalSgst += sgst;
        totalAmount += item.price * item.quantity;
      } else {
        const cgst = item.price * 0.025 * item.quantity;
        const sgst = item.price * 0.025 * item.quantity;
        totalCgst += cgst;
        totalSgst += sgst;
        totalAmount += (item.price + item.price * 0.05) * item.quantity;
      }
    });
    let finalTotal = totalAmount - discount;
    // Always round to 2 decimals for currency
    const roundedTotal = Math.round(finalTotal * 100) / 100;
    const toWords = new ToWords();
    let rupees = Math.floor(roundedTotal);
    let paise = Math.round((roundedTotal - rupees) * 100);
    if (paise === 100) {
      rupees += 1;
      paise = 0;
    }
    let inWords = toWords.convert(rupees) + ' Rupees';
    if (paise > 0) {
      inWords += ' and ' + toWords.convert(paise) + ' Paise';
    }
    // Generate table
    autoTable(doc, {
        startY: currentY + 5,
        head: tableHeaders,
        body: [...itemRows, 
            [
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: 'CGST 2.5 % (+)', styles: { fontStyle: 'bold' }}, 
                { content: formatCurrency(totalCgst), styles: { fontStyle: 'bold' }}
            ],
            [
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: 'SGST 2.5 % (+)', styles: { fontStyle: 'bold' }}, 
                { content: formatCurrency(totalSgst), styles: { fontStyle: 'bold' }}
            ],
            [
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: 'Total', styles: { fontStyle: 'bold' }}, 
                { content: formatCurrency(finalTotal), styles: { fontStyle: 'bold' }}
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
        didDrawCell: function(data) {
            // Draw vertical lines for all columns, but only up to the Total row
            const totalRowIndex = itemRows.length + 3; // Index of the Total row
            if (data.row.index >= itemRows.length && data.row.index <= totalRowIndex) {
                const x = data.cell.x;
                const y = data.cell.y;
                const height = data.cell.height;
                
                // Draw vertical lines
                if (data.column.index < 5) {  // Draw for all columns except the last
                    doc.line(
                        x + data.cell.width,  // x1
                        y,                    // y1
                        x + data.cell.width,  // x2
                        y + height            // y2
                    );
                }
            }
        },
        didDrawPage: function(data) {
            // Draw bottom border after the table is complete
            const lastRow = data.table.body[data.table.body.length - 1];
            if (lastRow) {
                const y = lastRow.cells[0].y + lastRow.cells[0].height;
                doc.line(
                    15,                                // x1 (left margin)
                    y,                                // y1
                    doc.internal.pageSize.width - 20,  // x2 (page width minus right margin)
                    y                                 // y2
                );
            }

            // Add footer on each page
            const footerY = doc.internal.pageSize.height - 85;
            
            // Terms and Conditions
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text('Terms and Conditions :', 20, footerY);
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text('1.  50% advance payment during the booking and balance amount on fitment', 15, footerY + 5);
            doc.text('2.  The Cheque or NEFT should be made in the name of "Absolute Prosthetics & Orthotics"', 15, footerY + 10);
            doc.text('3.  The quotation is valid for 3 months from date of issue', 15, footerY + 15);
            doc.text('4.  GST will be applicable @ 5% as per the government norms', 15, footerY + 20);

            // Bank details
            doc.setFontSize(10);
            doc.text("Best Regards,", 15, footerY + 30);
            doc.text("Absolute Prosthetics & Orthotics", 15, footerY + 35);
            doc.setFontSize(8);
            doc.text("Plot-34, Sarwasukhi Colony, West Marredpally", 15, footerY + 40);
            doc.text("Secunderabad, Telangana, India", 15, footerY + 43);
            doc.setFontSize(10);
            doc.text("Account Number: 142511010000096", 15, footerY + 48);
            doc.text("BRANCH: WEST MARREDPAILLI", 15, footerY + 53);
            doc.text("IFSC: UBIN0814253", 15, footerY + 58);
            doc.text("MICR: 500026101", 15, footerY + 63);
            doc.text("PHONE: 23468726", 15, footerY + 68);

            // Signature and stamp
            doc.setFont("helvetica", "bold");
            doc.text('For Absolute Prosthetics & Orthotics', doc.internal.pageSize.width - 20, footerY + 30, { align: 'right' });
            try {
                doc.addImage('/stamp.png', 'PNG', doc.internal.pageSize.width - 50, footerY + 33, 32, 30);
            } catch (e) {
                console.error("Error adding stamp:", e);
            }
            doc.setFont("helvetica", "normal");
            doc.text('Authorized Signature', doc.internal.pageSize.width - 20, footerY + 68, { align: 'right' });
        },
        margin: { left: 15, right: 20, bottom: 100 }, // Add bottom margin to ensure space for footer
        tableLineWidth: 0.1,
        tableLineColor: [0, 0, 0]
    });

    // Add logo image on top of the table (overlapping)
    try {
      // Try to add the image with error handling
      try {
        // Save the current graphics state
        doc.saveGraphicsState();
        // Set transparency
        const gState = new GState({ opacity: 0.2 });
        doc.setGState(gState);
        // Add the image
        doc.addImage('/ABSOLUTE_PROSTHETICS_AND_ORTHOTICS_logo.png', 'PNG', 65, currentY + 5, 70, 60);
        // Restore the graphics state
        doc.restoreGraphicsState();
      } catch (imgError) {
        console.error("Failed to add watermark image:", imgError);
      }
    } catch (e) {
      console.error("Error in watermark process:", e);
    }

    // Save PDF
    doc.save(`Quotation_${quotationNumber}_${patient.name || 'Patient'}.pdf`);
  } catch(error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate quotation PDF. Please try again.");
  }
};

// Helper function (Example - you might need a robust library for this)
// function amountToWords(amount: number): string {
//   // Implementation needed - search for 'javascript number to words' libraries
//   return "Amount in Words Placeholder";
// }