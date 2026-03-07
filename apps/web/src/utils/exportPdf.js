// utils/exportPdf.js
// Browser-side PDF export using jsPDF (loaded via CDN in index.html)
// Usage: exportSummaryPdf(docName, summaryData) | exportQAPdf(docName, qaData)

export const exportSummaryPdf = (docName, data) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; const margin = 18; const contentW = W - margin * 2;
  let y = 0;

  const addPage = () => { doc.addPage(); y = 20; };
  const checkY = (needed = 10) => { if (y + needed > 275) addPage(); };

  // ── Header bar ──
  doc.setFillColor(109, 40, 217); // violet-700
  doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text('AI File Intelligence', margin, 11);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Smart Document Summary Report', margin, 18);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, W - margin, 18, { align: 'right' });
  y = 36;

  // ── Document name ──
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text(`📄 ${docName}`, margin, y); y += 8;
  doc.setDrawColor(109, 40, 217); doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y); y += 8;

  // ── Metadata chips ──
  const chips = [];
  if (data.sentiment) chips.push(`Sentiment: ${data.sentiment}`);
  if (data.difficulty) chips.push(`Difficulty: ${data.difficulty}`);
  if (data.topics?.length) chips.push(`Topics: ${data.topics.slice(0, 3).join(', ')}`);
  if (chips.length) {
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.setTextColor(109, 40, 217);
    doc.text(chips.join('   •   '), margin, y); y += 10;
    doc.setTextColor(30, 30, 30);
  }

  // ── Section helper ──
  const section = (title, color = [109, 40, 217]) => {
    checkY(14);
    doc.setFillColor(...color);
    doc.roundedRect(margin, y, contentW, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 4, y + 5.5);
    doc.setTextColor(30, 30, 30);
    y += 12;
  };

  const paragraph = (text) => {
    doc.setFontSize(9.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(text, contentW);
    checkY(lines.length * 5.5 + 4);
    doc.text(lines, margin, y);
    y += lines.length * 5.5 + 4;
  };

  const bulletList = (items) => {
    doc.setFontSize(9.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    items.forEach((item, i) => {
      const text = typeof item === 'string' ? item : item.text || item;
      const lines = doc.splitTextToSize(`• ${text}`, contentW - 5);
      checkY(lines.length * 5.5 + 3);
      doc.setFillColor(109, 40, 217);
      doc.circle(margin + 1.5, y - 0.5, 1, 'F');
      doc.text(doc.splitTextToSize(text, contentW - 6), margin + 5, y);
      y += lines.length * 5.5 + 2;
    });
    y += 2;
  };

  // ── TL;DR ──
  if (data.tldr) {
    section('💡 TL;DR — Quick Summary');
    doc.setFillColor(245, 240, 255);
    const tldrLines = doc.splitTextToSize(data.tldr, contentW - 8);
    doc.roundedRect(margin, y, contentW, tldrLines.length * 5.5 + 8, 2, 2, 'F');
    doc.setTextColor(80, 20, 160);
    doc.setFontSize(9.5); doc.setFont('helvetica', 'italic');
    doc.text(tldrLines, margin + 4, y + 6);
    doc.setTextColor(30, 30, 30);
    y += tldrLines.length * 5.5 + 14;
  }

  // ── Key Points ──
  if (data.key_points?.length) {
    section('✅ Key Points');
    bulletList(data.key_points);
  }

  // ── Action Items ──
  if (data.action_items?.length) {
    section('🎯 Action Items', [16, 120, 60]);
    bulletList(data.action_items);
  }

  // ── Topics ──
  if (data.topics?.length) {
    section('🏷️ Topics Covered', [30, 100, 180]);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    let tx = margin;
    data.topics.forEach(topic => {
      const tw = doc.getTextWidth(topic) + 8;
      if (tx + tw > W - margin) { tx = margin; y += 9; }
      checkY(10);
      doc.setFillColor(219, 234, 254);
      doc.roundedRect(tx, y - 5, tw, 7, 2, 2, 'F');
      doc.setTextColor(30, 64, 175);
      doc.text(topic, tx + 4, y);
      doc.setTextColor(30, 30, 30);
      tx += tw + 4;
    });
    y += 12;
  }

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 250);
    doc.rect(0, 285, W, 12, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 140);
    doc.text('AI File Intelligence — Document Summary Report', margin, 291);
    doc.text(`Page ${i} of ${pageCount}`, W - margin, 291, { align: 'right' });
  }

  doc.save(`Summary_${docName.replace(/\.[^/.]+$/, '')}_${Date.now()}.pdf`);
};

export const exportQAPdf = (docName, questions) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; const margin = 18; const contentW = W - margin * 2;
  let y = 0;

  const addPage = () => { doc.addPage(); y = 20; };
  const checkY = (needed = 10) => { if (y + needed > 275) addPage(); };

  // ── Header ──
  doc.setFillColor(109, 40, 217);
  doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text('AI File Intelligence', margin, 11);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Auto-Generated Q&A Flashcards', margin, 18);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, W - margin, 18, { align: 'right' });
  y = 36;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text(`📄 ${docName}`, margin, y); y += 8;
  doc.setDrawColor(109, 40, 217); doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y); y += 6;

  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 120);
  doc.text(`${questions.length} questions generated`, margin, y); y += 10;

  const diffColors = {
    easy:   { bg: [220, 252, 231], text: [22, 101, 52],  label: '🟢 Easy'   },
    medium: { bg: [254, 243, 199], text: [120, 80, 0],   label: '🟡 Medium' },
    hard:   { bg: [254, 226, 226], text: [153, 27, 27],  label: '🔴 Hard'   },
  };

  questions.forEach((q, i) => {
    const diff = (q.difficulty || 'medium').toLowerCase();
    const dc = diffColors[diff] || diffColors.medium;

    const qLines = doc.splitTextToSize(`Q${i+1}. ${q.question}`, contentW - 8);
    const aLines = doc.splitTextToSize(`A: ${q.answer}`, contentW - 12);
    const cardH = qLines.length * 5.5 + aLines.length * 5 + 22;
    checkY(cardH);

    // Card background
    doc.setFillColor(250, 248, 255);
    doc.setDrawColor(200, 180, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentW, cardH, 3, 3, 'FD');

    // Difficulty badge
    doc.setFillColor(...dc.bg);
    doc.roundedRect(W - margin - 22, y + 3, 20, 6, 2, 2, 'F');
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...dc.text);
    doc.text(dc.label, W - margin - 12, y + 7.2, { align: 'center' });

    // Question
    doc.setTextColor(40, 10, 100);
    doc.setFontSize(9.5); doc.setFont('helvetica', 'bold');
    doc.text(qLines, margin + 4, y + 9);

    // Divider
    const divY = y + 9 + qLines.length * 5.5 + 1;
    doc.setDrawColor(220, 200, 250); doc.setLineWidth(0.3);
    doc.line(margin + 4, divY, W - margin - 4, divY);

    // Answer
    doc.setTextColor(50, 50, 70);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(aLines, margin + 8, divY + 6);

    y += cardH + 5;
  });

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 250);
    doc.rect(0, 285, W, 12, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 140);
    doc.text('AI File Intelligence — Q&A Flashcards Report', margin, 291);
    doc.text(`Page ${i} of ${pageCount}`, W - margin, 291, { align: 'right' });
  }

  doc.save(`QA_${docName.replace(/\.[^/.]+$/, '')}_${Date.now()}.pdf`);
};