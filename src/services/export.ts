import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export function downloadEnhancedPdf(text: string, filename = 'enhanced-resume.pdf') {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
  const lines = doc.splitTextToSize(text, pageWidth);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(lines, margin, margin);
  doc.save(filename);
}

export async function downloadEnhancedDocx(text: string, filename = 'enhanced-resume.docx') {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) =>
      new Paragraph({
        children: [new TextRun({ text: paragraph.replace(/\n/g, ' ') })],
        spacing: { after: 180 },
      }),
    );

  const docxDocument = new Document({
    sections: [
      {
        children: paragraphs.length
          ? paragraphs
          : [
              new Paragraph({
                children: [new TextRun({ text })],
              }),
            ],
      },
    ],
  });

  const blob = await Packer.toBlob(docxDocument);
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
