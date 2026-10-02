import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToCSV = (filename, headers, rows) => {
  if (!rows || !rows.length) {
    alert('No data available to export');
    return;
  }

  const csvRows = [];
  // Headers row
  csvRows.push(headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(','));

  // Data rows
  rows.forEach(row => {
    const values = headers.map(h => {
      let val = row[h.key];
      if (val === null || val === undefined) val = '';
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    });
    csvRows.push(values.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = ({
  title = 'Report',
  subtitle = 'Just Business Things — JB Tracker',
  headers = [],
  rows = [],
  summary = null,
  filename = 'document',
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('JUST BUSINESS THINGS', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(title, 14, 25);

  doc.setFontSize(9);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 31);
  if (subtitle) {
    doc.text(subtitle, 14, 36);
  }

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 39, 196, 39);

  let startY = 44;

  // Optional key summary metrics block
  if (summary && summary.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    summary.forEach((item, index) => {
      const colX = 14 + (index % 3) * 60;
      const rowY = startY + Math.floor(index / 3) * 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(item.label, colX, rowY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(String(item.value), colX, rowY + 5);
    });
    startY += Math.ceil(summary.length / 3) * 14 + 6;
  }

  // AutoTable
  doc.autoTable({
    startY,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};
