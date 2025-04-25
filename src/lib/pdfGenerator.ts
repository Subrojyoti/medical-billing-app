// src/lib/pdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Import the autoTable plugin
import { Patient, BillItem } from '@/types';

// Extend jsPDF interface to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
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
    gstAmount: number,
    totalAmount: number
) => {
  try{
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    let currentY = 15; // Start position for content

    // --- Header ---
    const shopName = process.env.NEXT_PUBLIC_SHOP_NAME || "Medical Shop";
    const shopAddress = process.env.NEXT_PUBLIC_SHOP_ADDRESS || "";
    const shopContact = process.env.NEXT_PUBLIC_SHOP_CONTACT || "";
    const shopWebsite = process.env.NEXT_PUBLIC_SHOP_WEBSITE || "";
    const shopSlogan = process.env.NEXT_PUBLIC_SHOP_SLOGAN || "";
    // const logoUrl = '/logo_placeholder.png'; // Replace with your actual logo path if available

    

    // Shop Name (Centered or Left Aligned)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(shopName, pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    // Shop Details (Centered or Left Aligned)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (shopAddress) {
      doc.text(shopAddress, pageWidth / 2, currentY, { align: 'center' });
      currentY += 4;
    }
     if (shopContact) {
      doc.text(`Contact: ${shopContact}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 4;
    }
    if (shopWebsite) {
       doc.text(`Website: ${shopWebsite}`, pageWidth / 2, currentY, { align: 'center' });
       currentY += 4;
    }
     if (shopSlogan) {
       doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
       doc.text(shopSlogan, pageWidth - 15, currentY - 15, { align: 'right'}); // Example position for slogan
     }


    // Add Logo (Optional - requires image handling)
    // Example: Assuming you have a logo file in your public folder
    // try {
    //   const imgData = '/path/to/your/logo.png'; // Needs proper handling for base64 or direct path
    //   doc.addImage(imgData, 'PNG', pageWidth - 40, 10, 25, 15); // Adjust position/size
    // } catch (e) { console.error("Error adding logo:", e); }


    currentY += 10; // Space before Invoice title

    // --- Invoice Title ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    // --- Patient Details & Bill Info ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const patientBoxWidth = (pageWidth - 30) / 2; // Divide space
    const billInfoX = 15 + patientBoxWidth + 5; // Start X for bill info

    // Patient Details Box (drawRect is optional, text placement is key)
    // doc.rect(15, currentY, patientBoxWidth, 30); // Example box
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Details:', 15, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${patient.name || 'N/A'}`, 17, currentY + 10);
    doc.text(`Address: ${patient.address || 'N/A'}`, 17, currentY + 15);
    doc.text(`Contact: ${patient.contact || 'N/A'}`, 17, currentY + 20);
    doc.text(`Gender: ${patient.gender || 'N/A'}`, 17, currentY + 25);
    doc.text(`Age: ${patient.age || 'N/A'}`, 17, currentY + 30);

    // Bill Info (Right side)
    const billDate = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY format
    const billNumber = `INV-${Date.now().toString().slice(-6)}`; // Simple unique number
    doc.text(`Date: ${billDate}`, billInfoX, currentY + 5);
    doc.text(`Invoice #: ${billNumber}`, billInfoX, currentY + 10);
    // doc.text(`Due Date: ${billDate}`, billInfoX, currentY + 15); // Optional

    currentY += 40; // Move below patient/bill info section

    // --- Items Table with Totals ---
    const tableColumnStyles = {
        0: { cellWidth: 15 }, // SR#
        1: { cellWidth: 80 }, // Description
        2: { cellWidth: 15, halign: 'right' as const }, // QTY
        3: { cellWidth: 25, halign: 'right' as const }, // PRICE
        4: { cellWidth: 30, halign: 'right' as const }, // AMOUNT
    };

    const tableHeaders = [['SR#', 'DESCRIPTION', 'QTY', 'PRICE', 'AMOUNT']];
    
    // Regular item rows
    const itemRows = items.map(item => [
        item.srNo.toString(),
        item.description,
        item.quantity.toString(),
        formatCurrency(item.price),
        formatCurrency(item.amount),
    ]);

    // Add empty row for visual separation
    const emptyRow = ['', '', '', '', ''];

    // Add totals rows
    const gstRatePercent = (Number(process.env.NEXT_PUBLIC_GST_RATE) || 0.18) * 100;
    const totalsRows = [
        ['', '', '', 'Sub-total:', formatCurrency(subtotal)],
        ['', '', '', `GST (${gstRatePercent}%):`, formatCurrency(gstAmount)],
        ['', '', '', 'Total Amount Due:', formatCurrency(totalAmount)]
    ];

    // Combine all rows
    const tableBody = [
        ...itemRows,
        emptyRow,
        ...totalsRows
    ];

    // Generate table
    autoTable(doc, {
        startY: currentY,
        head: tableHeaders,
        body: tableBody,
        theme: 'grid',
        headStyles: { 
            fillColor: [22, 160, 133], 
            textColor: [255, 255, 255], 
            fontStyle: 'bold' 
        },
        columnStyles: tableColumnStyles,
        bodyStyles: {
            lineWidth: 0.1
        },
        // Style for totals rows
        didParseCell: function(data) {
            // Check if it's a totals row (one of the last 3 rows)
            const isEmptyRow = data.row.index === tableBody.length - 4;
            const isTotalsRow = data.row.index > tableBody.length - 4;
            
            if (isEmptyRow) {
                data.cell.styles.lineWidth = 0;
            }
            
            if (isTotalsRow) {
                // Remove borders and background for empty cells in totals rows
                if (data.column.index < 3) {
                    data.cell.styles.lineWidth = 0;
                    data.cell.styles.fillColor = [255, 255, 255];
                }
                
                // Style for the label (4th column)
                if (data.column.index === 3) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.halign = 'right';
                    // Add right border only
                    data.cell.styles.lineWidth = 0.1;
                    data.cell.styles.cellPadding = 2;
                }
                
                // Style for the amount (last column)
                if (data.column.index === 4) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.lineWidth = 0.1;
                    data.cell.styles.cellPadding = 2;
                }
                
                // Make the final row (Total Amount Due) more prominent
                if (data.row.index === tableBody.length - 1) {
                    if (data.column.index >= 3) {
                        data.cell.styles.fontSize = 11;
                        // Add bottom border for the last row
                        data.cell.styles.lineWidth = 0.1;
                    }
                }
            }
        },
        margin: { top: 10, right: 15, bottom: 40, left: 15 },
    });

    // --- Footer Notes / Signature ---
    // Example: Add total amount in words (requires a library or custom function)
    // doc.text(`Amount in words: ${amountToWords(totalAmount)}`, 15, currentY); // Add this if needed
    // currentY += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Terms and Conditions: Goods once sold will not be taken back.', 15, pageHeight - 30); // Example Terms

    doc.text('Signature:', pageWidth - 60, pageHeight - 30);
    doc.text('Prepared by: Admin', pageWidth - 60, pageHeight - 25); // Or dynamically add user
    // doc.text('Designation: Pharmacist', pageWidth - 60, pageHeight - 20);

    // --- Save PDF ---
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