// utils/exportPdf.js - Clean PDF export without emojis (jsPDF compatibility)

export const exportSummaryPdf = (docName, data) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; const margin = 18; const contentW = W - margin * 2;
  let y = 0;

  const addPage = () => { doc.addPage(); y = 24; };
  const checkY = (needed = 10) => { if (y + needed > 272) addPage(); };

  // Header
  doc.setFillColor(109, 40, 217);
  doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17); doc.setFont('helvetica', 'bold');
  doc.text('DocMind', margin, 12);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Smart Document Summary Report', margin, 20);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, W - margin, 20, { align: 'right' });
  y = 38;

  // Document name
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  const nameLines = doc.splitTextToSize(`Document: ${docName}`, contentW);
  doc.text(nameLines, margin, y);
  y += nameLines.length * 6 + 2;

  doc.setDrawColor(109, 40, 217); doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y); y += 6;

  // Metadata
  const chips = [];
  if (data.sentiment) chips.push(`Sentiment: ${data.sentiment}`);
  if (data.difficulty) chips.push(`Difficulty: ${data.difficulty}`);
  if (data.topics?.length) chips.push(`Topics: ${data.topics.slice(0, 3).join(', ')}`);
  if (chips.length) {
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(109, 40, 217);
    const chipText = chips.join('   |   ');
    const chipLines = doc.splitTextToSize(chipText, contentW);
    doc.text(chipLines, margin, y);
    y += chipLines.length * 5 + 8;
    doc.setTextColor(30, 30, 30);
  }

  // Section header helper
  const section = (title, color = [109, 40, 217]) => {
    checkY(16);
    doc.setFillColor(...color);
    doc.roundedRect(margin, y, contentW, 9, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 5, y + 6.2);
    doc.setTextColor(30, 30, 30);
    y += 13;
  };

  // Paragraph text helper
  const paragraph = (text) => {
    doc.setFontSize(9.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(text, contentW - 4);
    checkY(lines.length * 5.5 + 4);
    doc.text(lines, margin + 2, y);
    y += lines.length * 5.5 + 5;
  };

  // Bullet list helper
  const bulletList = (items) => {
    doc.setFontSize(9.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    items.forEach((item) => {
      const text = typeof item === 'string' ? item : String(item);
      const lines = doc.splitTextToSize(text, contentW - 10);
      checkY(lines.length * 5.5 + 4);
      doc.setFillColor(109, 40, 217);
      doc.circle(margin + 2, y - 0.8, 1.2, 'F');
      doc.text(lines, margin + 6, y);
      y += lines.length * 5.5 + 3;
    });
    y += 3;
  };

  // TL;DR
  if (data.tldr) {
    section('TL;DR - Quick Summary');
    const tldrLines = doc.splitTextToSize(data.tldr, contentW - 10);
    checkY(tldrLines.length * 5.5 + 12);
    doc.setFillColor(245, 240, 255);
    doc.roundedRect(margin, y, contentW, tldrLines.length * 5.5 + 10, 2, 2, 'F');
    doc.setTextColor(80, 20, 160);
    doc.setFontSize(9.5); doc.setFont('helvetica', 'italic');
    doc.text(tldrLines, margin + 5, y + 7);
    doc.setTextColor(30, 30, 30);
    y += tldrLines.length * 5.5 + 16;
  }

  // Key Points
  if (data.key_points?.length) {
    section('Key Points');
    bulletList(data.key_points);
  }

  // Action Items
  if (data.action_items?.length) {
    section('Action Items', [16, 120, 60]);
    bulletList(data.action_items);
  }

  // Topics
  if (data.topics?.length) {
    section('Topics Covered', [30, 100, 180]);
    checkY(12);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    let tx = margin;
    data.topics.forEach(topic => {
      const tw = doc.getTextWidth(topic) + 10;
      if (tx + tw > W - margin) { tx = margin; y += 10; }
      checkY(12);
      doc.setFillColor(219, 234, 254);
      doc.roundedRect(tx, y - 5, tw, 7, 2, 2, 'F');
      doc.setTextColor(30, 64, 175);
      doc.text(topic, tx + 5, y);
      doc.setTextColor(30, 30, 30);
      tx += tw + 5;
    });
    y += 14;
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 250);
    doc.rect(0, 285, W, 12, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 140);
    doc.text('DocMind - Document Summary Report', margin, 291);
    doc.text(`Page ${i} of ${pageCount}`, W - margin, 291, { align: 'right' });
  }

  const safeName = docName.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9]/gi, '_');
  doc.save(`Summary_${safeName}.pdf`);
};

export const exportQAPdf = (docName, questions) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; const margin = 18; const contentW = W - margin * 2;
  let y = 0;

  const addPage = () => { doc.addPage(); y = 24; };
  const checkY = (needed = 10) => { if (y + needed > 272) addPage(); };

  // Header
  doc.setFillColor(109, 40, 217);
  doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17); doc.setFont('helvetica', 'bold');
  doc.text('DocMind', margin, 12);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Auto-Generated Q&A Flashcards', margin, 20);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, W - margin, 20, { align: 'right' });
  y = 38;

  // Document name
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  const nameLines = doc.splitTextToSize(`Document: ${docName}`, contentW);
  doc.text(nameLines, margin, y);
  y += nameLines.length * 6 + 2;

  doc.setDrawColor(109, 40, 217); doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y); y += 4;

  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 120);
  doc.text(`${questions.length} questions generated`, margin, y + 5);
  y += 12;

  const diffColors = {
    easy:   { bg: [220, 252, 231], text: [22, 101, 52],  label: 'Easy'   },
    medium: { bg: [254, 243, 199], text: [120, 80, 0],   label: 'Medium' },
    hard:   { bg: [254, 226, 226], text: [153, 27, 27],  label: 'Hard'   },
  };

  questions.forEach((q, i) => {
    const diff = (q.difficulty || 'medium').toLowerCase();
    const dc = diffColors[diff] || diffColors.medium;

    const qLines = doc.splitTextToSize(`Q${i+1}. ${q.question}`, contentW - 30);
    const aLines = doc.splitTextToSize(`Answer: ${q.answer}`, contentW - 12);
    const cardH = qLines.length * 5.5 + aLines.length * 5 + 24;
    checkY(cardH + 6);

    // Card background
    doc.setFillColor(250, 248, 255);
    doc.setDrawColor(200, 180, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentW, cardH, 3, 3, 'FD');

    // Difficulty badge
    doc.setFillColor(...dc.bg);
    doc.roundedRect(W - margin - 24, y + 3, 22, 7, 2, 2, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...dc.text);
    doc.text(dc.label, W - margin - 13, y + 7.8, { align: 'center' });

    // Question number badge
    doc.setFillColor(109, 40, 217);
    doc.circle(margin + 6, y + 9, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text(String(i + 1), margin + 6, y + 10.5, { align: 'center' });

    // Question text
    doc.setTextColor(40, 10, 100);
    doc.setFontSize(9.5); doc.setFont('helvetica', 'bold');
    doc.text(qLines, margin + 14, y + 9);

    // Divider
    const divY = y + 9 + qLines.length * 5.5 + 2;
    doc.setDrawColor(220, 200, 250); doc.setLineWidth(0.3);
    doc.line(margin + 5, divY, W - margin - 5, divY);

    // Answer
    doc.setTextColor(50, 50, 70);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(aLines, margin + 8, divY + 6);

    y += cardH + 6;
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 250);
    doc.rect(0, 285, W, 12, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 140);
    doc.text('DocMind - Q&A Flashcards Report', margin, 291);
    doc.text(`Page ${i} of ${pageCount}`, W - margin, 291, { align: 'right' });
  }

  const safeName = docName.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9]/gi, '_');
  doc.save(`QA_${safeName}.pdf`);
};
