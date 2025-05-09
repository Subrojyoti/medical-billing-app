/* eslint-disable @typescript-eslint/no-unused-vars */
// src/lib/pdfGenerator.ts
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
// const handleGenerateBill = (
//   patient: Patient,
//   items: BillItem[],
//   subtotal: number,
//   gstAmount: number,
//   totalAmount: number
// ) => {
//   try {
//       // Validation before generating PDF
//       if (!patient.name || !patient.contact || !patient.address || !patient.gender || !patient.age) {
//           console.error('Please fill in all patient details.');
//           window.scrollTo(0, 0);
//           return;
//       }
//       if (items.length === 0) {
//           console.error('Please add at least one product to the bill.');
//           return;
//       }

//       console.log('No errors in form.');
//       generateBillPdf(patient, items, subtotal, gstAmount, totalAmount);
//   } catch (error) {
//       console.error('Failed to generate bill. Please try again.');
//       console.error('Bill generation error:', error);
//   }
// };


export const generateBillPdf = (
    patient: Patient,
    items: BillItem[],
    subtotal: number,
    cgstAmount: number,
    sgstAmount: number,
    discount: number,
    modeOfPayment: string,
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

    // TAX INVOICE heading with borders
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    
    // Draw line above TAX - INVOICE
    doc.line(15, currentY - 2, pageWidth - 15, currentY - 2);
    doc.text('TAX - INVOICE', pageWidth / 2, currentY + 8, { align: 'center' });
    // Draw line below TAX - INVOICE
    doc.line(15, currentY + 12, pageWidth - 15, currentY + 12);
    currentY += 25;

    // S.NO and Date on right side
    doc.setFontSize(10);
    const serialNumber = `INV-${patient.serialNo}`;
    doc.text('S.NO :', pageWidth - 60, currentY);
    doc.text(serialNumber, pageWidth - 40, currentY);
    doc.text('Date :', pageWidth - 60, currentY + 15);
    const currentDate = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY format
    doc.text(currentDate, pageWidth - 40, currentY + 15);

    // Patient Details Form - Very compact
    doc.setFont('helvetica', 'normal');
    
    // To
    doc.text('To :', 15, currentY);
    doc.text(patient.name, 35, currentY);
    currentY += 6; // Reduced from 8
    
    // Address
    doc.text('Address :', 15, currentY);
    doc.text(patient.address, 35, currentY);
    currentY += 6; // Reduced from 8
    
    // Contact
    doc.text('Contact :', 15, currentY);
    doc.text(patient.contact, 35, currentY);
    currentY += 6; // Reduced from 8
    
    // Age on one line
    doc.text('Age :', 15, currentY);
    doc.text(patient.age, 35, currentY);
    currentY += 6; // Reduced from 8
    
    // Sex on next line
    doc.text('Sex :', 15, currentY);
    doc.text(patient.gender, 35, currentY);
    currentY += 8; // Reduced from 15

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

    // Calculate tax amounts based on subtotal before discount
    const baseSubtotal = subtotal - cgstAmount - sgstAmount;
    const cgstOnSubtotal = baseSubtotal * 0.025; // 2.5% CGST on base subtotal
    const sgstOnSubtotal = baseSubtotal * 0.025; // 2.5% SGST on base subtotal

    // Add totals rows
    // const totalsRows = [
    //     ['', '', '', '', 'Mode of payment', modeOfPayment],
    //     ['', '', '', '', 'Discount (-)', formatCurrency(discount)],
    //     ['', '', '', '', 'CGST 2.5 % (+)', formatCurrency(cgstAmount)],
    //     ['', '', '', '', 'SGST 2.5 % (+)', formatCurrency(sgstAmount)],
    //     ['', '', '', '', 'Total', formatCurrency(totalAmount)]
    // ];

    // Combine all rows
    // const tableBody = [
    //     ...itemRows,
    //     ...totalsRows
    // ];

    // Generate table
    const toWords = new ToWords();
    // Always round to 2 decimals for currency
    const roundedTotal = Math.round(totalAmount * 100) / 100;
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
    autoTable(doc, {
        startY: currentY + 5,
        head: tableHeaders,
        body: [...itemRows, 
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
                { content: formatCurrency(discount), styles: { fontStyle: 'bold' }}
            ],
            [
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: 'CGST 2.5 % (+)', styles: { fontStyle: 'bold' }}, 
                { content: formatCurrency(cgstAmount), styles: { fontStyle: 'bold' }}
            ],
            [
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: 'SGST 2.5 % (+)', styles: { fontStyle: 'bold' }}, 
                { content: formatCurrency(sgstAmount), styles: { fontStyle: 'bold' }}
            ],
            [
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: '', styles: { lineWidth: 0 }}, 
                { content: 'Total', styles: { fontStyle: 'bold' }}, 
                { content: formatCurrency(roundedTotal), styles: { fontStyle: 'bold' }}
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
            const totalRowIndex = itemRows.length + 4; // Index of the Total row
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
        },
        margin: { left: 15, right: 20 },
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

    // Footer
    doc.setFontSize(8);
    doc.text('• Goods Once sold will not be taken back.', 15, pageHeight - 30);
    doc.text('• Subject to Hyderabad Jurisdiction', 15, pageHeight - 25);

    doc.setFont("helvetica", "bold");
    doc.text('For Absolute Prosthetics', pageWidth - 20, pageHeight - 55, { align: 'right' }); // Right aligned
    // Stamp and Signature with proper alignment
    doc.addImage('/stamp.png', 'PNG', pageWidth - 50, pageHeight - 52, 32, 30);
    doc.setFont("helvetica", "normal");
    doc.text('Authorized Signature', pageWidth - 20, pageHeight - 20, { align: 'right' }); // Right aligned

    // Save PDF
    const billNumber = `${serialNumber}`;
    doc.save(`Invoice_${billNumber}_${patient.name || 'Patient'}.pdf`);
  } catch(error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF bill. Please try again.");
  }
};

// Helper function (Example - you might need a robust library for this)
// function amountToWords(amount: number): string {
//   // Implementation needed - search for 'javascript number to words' libraries
//   return "Amount in Words Placeholder";
// }