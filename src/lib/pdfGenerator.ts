// src/lib/pdfGenerator.ts
import jsPDF from 'jspdf';
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
    doc.text('S.NO :', pageWidth - 60, currentY);
    doc.text('Date :', pageWidth - 60, currentY + 15);
    const currentDate = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY format
    doc.text(currentDate, pageWidth - 35, currentY + 15);

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
            
        return [
            item.date || '',
            item.srNo.toString(),
            `${item.type}${descriptions ? '\n' + descriptions : ''}`,
            item.quantity.toString(),
            formatCurrency(item.price),
            formatCurrency(item.amount),
        ];
    });

    // Add totals rows
    const totalsRows = [
        ['', '', '', '', 'Mode of payment', modeOfPayment],
        ['', '', '', '', 'Discount (-)', formatCurrency(discount)],
        ['', '', '', '', 'CGST 2.5 % (+)', formatCurrency(cgstAmount)],
        ['', '', '', '', 'SGST 2.5 % (+)', formatCurrency(sgstAmount)],
        ['', '', '', '', 'Total', formatCurrency(totalAmount)]
    ];

    // Combine all rows
    const tableBody = [
        ...itemRows,
        ...totalsRows
    ];

    // Generate table
    autoTable(doc, {
        startY: currentY + 5,
        head: tableHeaders,
        body: tableBody,
        theme: 'grid',
        styles: {
            fontSize: 9
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
            2: { cellWidth: 70 },  // Product (includes type and description)
            3: { cellWidth: 15, halign: 'right' },  // QTY
            4: { cellWidth: 25, halign: 'right' },  // Rate
            5: { cellWidth: 25, halign: 'right' }   // Amount
        },
        bodyStyles: {
            lineWidth: 0.1
        },
        didParseCell: function(data) {
            const isTotalsRow = data.row.index >= itemRows.length;
            
            if (isTotalsRow) {
                if (data.column.index < 4) {
                    data.cell.styles.lineWidth = 0;
                }
                if (data.column.index === 4) {
                    data.cell.styles.fontStyle = 'bold';
                }
                if (data.column.index === 5) {
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        },
        margin: { left: 15, right: 15 }
    });

    // Amount in words
    doc.setFontSize(9);
    doc.text('Rs. (In Words) :', 15, doc.lastAutoTable.finalY + 10);

    // Footer
    doc.setFontSize(8);
    doc.text('• Goods Once sold will not be taken back.', 15, pageHeight - 30);
    doc.text('• Subject to Hyderabad Jurisdiction', 15, pageHeight - 25);

    // Stamp and Signature with proper alignment
    doc.text('Stamp', pageWidth/2, pageHeight - 30, { align: 'center' }); // Center aligned
    doc.text('For Absolute Prosthetics', pageWidth - 15, pageHeight - 30, { align: 'right' }); // Right aligned
    doc.text('Authorized Signature', pageWidth - 15, pageHeight - 20, { align: 'right' }); // Right aligned

    // Save PDF
    const billNumber = `INV-${Date.now().toString().slice(-6)}`;
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