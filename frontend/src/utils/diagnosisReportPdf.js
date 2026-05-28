import { jsPDF } from 'jspdf';
import { apiUrl } from '../config/api';
import { formatModelName, resolveModelName } from './diagnosisDisplay';

const applyFontFallback = (pdf) => {
    try {
        pdf.setFont('helvetica', 'normal');
    } catch (error) {
        console.warn('PDF font fallback failed:', error);
    }
};

const getDataUrl = async (src) => {
    if (!src) return null;

    const response = await fetch(src);
    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const createHeader = (pdf, title, subtitle, reportId, issuedDate) => {
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFillColor(2, 132, 199);
    pdf.rect(0, 0, pageWidth, 38, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text(title, pageWidth / 2, 16, { align: 'center' });
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(subtitle, pageWidth / 2, 23, { align: 'center' });
    pdf.setFontSize(8);
    pdf.setTextColor(224, 242, 254);
    pdf.text(`Report ID: ${reportId}`, pageWidth - 15, 32, { align: 'right' });
    pdf.text(`Issued Date: ${issuedDate}`, 15, 32);
};

const addKeyValueLine = (pdf, label, value, x, y) => {
    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'normal');
    pdf.text(label, x, y);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(value, x + 50, y);
};

const createImageSection = async (pdf, title, src, x, y, width, height) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(title, x, y);
    pdf.setDrawColor(226, 232, 240);
    pdf.line(x, y + 2, pageWidth - x, y + 2);

    let nextY = y + 8;

    try {
        const dataUrl = await getDataUrl(src);
        if (!dataUrl) {
            throw new Error('Missing image source');
        }

        pdf.addImage(dataUrl, 'JPEG', x, nextY, width, height);
        nextY += height + 8;
    } catch (error) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.text('Unable to embed image into the PDF.', x, nextY);
        nextY += 8;
    }

    if (nextY > pageHeight - 20) {
        pdf.addPage();
        nextY = 16;
    }

    return nextY;
};

const createSideBySideImageSection = async (pdf, title1, src1, title2, src2, y) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('VISUAL MEDICAL EVIDENCE', 15, y);
    pdf.setDrawColor(226, 232, 240);
    pdf.line(15, y + 2, pageWidth - 15, y + 2);

    let nextY = y + 8;
    const imgWidth = 85;
    const imgHeight = 85;
    const leftX = 15;
    const rightX = pageWidth - 15 - imgWidth;

    try {
        const dataUrl1 = await getDataUrl(src1);
        if (dataUrl1) {
            pdf.addImage(dataUrl1, 'JPEG', leftX, nextY, imgWidth, imgHeight);
            pdf.setFontSize(8.5);
            pdf.setTextColor(100, 116, 139);
            pdf.text(title1, leftX, nextY + imgHeight + 4);
        }
    } catch (error) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text('Unable to embed X-ray image', leftX, nextY + 40);
    }

    try {
        const dataUrl2 = await getDataUrl(src2);
        if (dataUrl2) {
            pdf.addImage(dataUrl2, 'JPEG', rightX, nextY, imgWidth, imgHeight);
            pdf.setFontSize(8.5);
            pdf.setTextColor(100, 116, 139);
            pdf.text(title2, rightX, nextY + imgHeight + 4);
        }
    } catch (error) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text('Unable to embed Grad-CAM', rightX, nextY + 40);
    }

    nextY = nextY + imgHeight + 10;

    if (nextY > pageHeight - 20) {
        pdf.addPage();
        nextY = 16;
    }

    return nextY;
};

const createDisclaimerSection = (pdf, lines, x, y) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setFillColor(254, 243, 199);
    pdf.rect(x, y, pageWidth - x * 2, 28, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(146, 64, 14);
    pdf.text('IMPORTANT LEGAL DISCLAIMER:', x + 4, y + 5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(180, 83, 9);

    let lineY = y + 10;
    lines.forEach((line) => {
        pdf.text(line, x + 4, lineY);
        lineY += 4;
    });

    if (lineY > pageHeight - 20) {
        pdf.addPage();
    }
};

const createFooter = (pdf, text) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setDrawColor(241, 245, 249);
    pdf.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(148, 163, 184);
    pdf.text(text, 15, pageHeight - 7);
    pdf.text('Page 1 / 1', pageWidth - 15, pageHeight - 7, { align: 'right' });
};

export const exportHomeDiagnosisPdf = async ({ result, displayConfidence, preview, gradcamImg, patientId }) => {
    if (!result) return;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    applyFontFallback(pdf);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const reportId = `#RPT${Date.now().toString().slice(-6)}`;
    const issuedDate = new Date().toLocaleString('en-US');
    const modelName = formatModelName(resolveModelName(result.model));
    const diagnosisText = result.label === 'Pneumonia' ? 'PNEUMONIA DETECTED' : 'NORMAL (NO PNEUMONIA)';

    createHeader(
        pdf,
        'AI-ASSISTED DIAGNOSTIC REPORT',
        'AUTOMATED CHEST X-RAY ANALYSIS SYSTEM - PNEUVISION AI',
        reportId,
        issuedDate
    );

    let y = 48;
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    addKeyValueLine(pdf, 'ANALYSIS TIME:', new Date().toLocaleString('en-US'), 15, y);
    y += 8;
    addKeyValueLine(pdf, 'CORE MODEL:', modelName, 15, y);
    y += 10;

    pdf.setDrawColor(226, 232, 240);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(15, y, pageWidth - 30, 20, 4, 4, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text('AI CLINICAL CONCLUSION:', 22, y + 6);
    pdf.setFontSize(14);
    pdf.setTextColor(result.label === 'Pneumonia' ? 225 : 22, result.label === 'Pneumonia' ? 29 : 163, result.label === 'Pneumonia' ? 72 : 74);
    pdf.text(diagnosisText, 22, y + 14);
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(10);
    pdf.text(`CONFIDENCE SCORE: ${displayConfidence.toFixed(1)}%`, pageWidth - 70, y + 6);
    y += 34;

    if (preview || gradcamImg) {
        y = await createSideBySideImageSection(pdf, 'Original Chest X-Ray', preview, 'Grad-CAM Activation Map', gradcamImg, y);
    }

    createDisclaimerSection(pdf, [
        '- The findings above are automatically generated via Artificial Intelligence (AI) algorithms.',
        '- The diagnostic accuracy of this model is strictly dependent on the quality of the uploaded X-Ray image.',
        '- This technical report does NOT substitute for professional clinical judgments or final doctor decisions.',
        '- Patients are requested to consult qualified medical practitioners for full diagnostics.'
    ], 15, pageHeight - 50);

    createFooter(pdf, 'Confidential Technical Medical Report - PneuVision Lab 2026');
    pdf.save(`AI_Report_PneuVision_${result.label}_${Date.now().toString().slice(-5)}.pdf`);
};

export const exportHistoryDiagnosisPdf = async (record) => {
    if (!record) return;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    applyFontFallback(pdf);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const modelName = formatModelName(resolveModelName(record.modelName, record.model, record.aiModel, record.model_name));
    const reportId = `#RPT${String(record.id || Date.now()).slice(-6)}`;
    const issuedDate = new Date().toLocaleString('en-US');
    const diagnosisText = record.label === 'Pneumonia' ? 'PNEUMONIA DETECTED' : 'NORMAL (NO PNEUMONIA)';
    const confidence = Number.isFinite(record.confidence) ? (record.confidence * 100).toFixed(1) : 'N/A';
    const reviewedAt = record.createdAt ? new Date(record.createdAt).toLocaleString('en-US') : 'N/A';

    createHeader(
        pdf,
        'AI-ASSISTED DIAGNOSTIC REPORT',
        'AUTOMATED CHEST X-RAY ANALYSIS SYSTEM - PNEUVISION AI',
        reportId,
        issuedDate
    );

    let y = 48;
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    addKeyValueLine(pdf, 'ANALYSIS TIME:', reviewedAt, 15, y);
    y += 8;
    addKeyValueLine(pdf, 'CORE MODEL:', modelName, 15, y);
    y += 10;

    pdf.setDrawColor(226, 232, 240);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(15, y, pageWidth - 30, 20, 4, 4, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text('AI CLINICAL CONCLUSION:', 22, y + 6);
    pdf.setFontSize(14);
    pdf.setTextColor(record.label === 'Pneumonia' ? 225 : 22, record.label === 'Pneumonia' ? 29 : 163, record.label === 'Pneumonia' ? 72 : 74);
    pdf.text(diagnosisText, 22, y + 14);
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(10);
    pdf.text(`CONFIDENCE SCORE: ${confidence}%`, pageWidth - 70, y + 6);
    y += 34;

    if (record.imagePath || record.gradcamPath) {
        y = await createSideBySideImageSection(pdf, 'Original Chest X-Ray', apiUrl(record.imagePath), 'Grad-CAM Activation Map', apiUrl(record.gradcamPath), y);
    }

    createDisclaimerSection(pdf, [
        '- The findings above are automatically generated via Artificial Intelligence (AI) algorithms.',
        '- The diagnostic accuracy of this model is strictly dependent on the quality of the uploaded X-Ray image.',
        '- This technical report does NOT substitute for professional clinical judgments or final doctor decisions.',
        '- Patients are requested to consult qualified medical practitioners for full diagnostics.'
    ], 15, pageHeight - 50);

    pdf.save(`BaoCao_ChanDoan_${record.id || Date.now()}.pdf`);
};

export const exportDoctorReviewPdf = async (record) => {
    if (!record) return;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    applyFontFallback(pdf);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const reportId = `#RPT${String(record.id || Date.now()).slice(-6)}`;
    const issuedDate = new Date().toLocaleString('en-US');
    const modelName = formatModelName(resolveModelName(record.diagnosis?.modelName, record.diagnosis?.model, record.diagnosis?.aiModel, record.diagnosis?.model_name));
    const diagnosisText = record.diagnosis?.label === 'Pneumonia' ? 'PNEUMONIA DETECTED' : 'NORMAL (NO PNEUMONIA)';
    const doctorText = record.finalLabel === 'Pneumonia' ? 'PNEUMONIA DETECTED' : 'NORMAL (NO PNEUMONIA)';
    const confidence = Number.isFinite(record.diagnosis?.confidence) ? (record.diagnosis.confidence * 100).toFixed(1) : 'N/A';
    const reviewedAt = record.reviewedAt ? new Date(record.reviewedAt).toLocaleString('en-US') : 'N/A';

    createHeader(
        pdf,
        'DOCTOR REVIEW REPORT',
        'AUTOMATED CHEST X-RAY ANALYSIS SYSTEM - PNEUVISION AI',
        reportId,
        issuedDate
    );

    let y = 48;
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    addKeyValueLine(pdf, 'REVIEW TIME:', reviewedAt, 15, y);
    y += 8;
    addKeyValueLine(pdf, 'DOCTOR:', record.doctorName || 'N/A', 15, y);
    y += 8;
    addKeyValueLine(pdf, 'AI MODEL:', modelName, 15, y);
    y += 10;

    pdf.setDrawColor(226, 232, 240);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(15, y, pageWidth - 30, 20, 4, 4, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text('CASE COMPARISON:', 22, y + 6);
    pdf.setFontSize(10);
    pdf.setTextColor(30, 41, 59);
    pdf.text(`AI: ${diagnosisText}`, 22, y + 14);
    pdf.text(`DOCTOR: ${doctorText}`, pageWidth / 2 + 10, y + 14);
    y += 34;

    if (record.diagnosis?.imagePath || record.diagnosis?.gradcamPath) {
        y = await createSideBySideImageSection(pdf, 'Original Chest X-Ray', apiUrl(record.diagnosis.imagePath), 'Grad-CAM Activation Map', apiUrl(record.diagnosis.gradcamPath), y);
    }

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('CLINICAL NOTES', 15, y);
    pdf.setDrawColor(148, 163, 184);
    pdf.line(15, y + 2, pageWidth - 15, y + 2);
    y += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const notes = [
        `- AI CONFIDENCE: ${confidence}%`,
        `- DOCTOR CONCLUSION: ${doctorText}`,
        `- DOCTOR COMMENT: ${record.doctorComment || 'N/A'}`,
        `- STATUS: ${record.diagnosis?.label === record.finalLabel ? 'Agreement with AI' : 'Different from AI'}`
    ];

    notes.forEach((line) => {
        const wrapped = pdf.splitTextToSize(line, pageWidth - 28);
        wrapped.forEach((textLine) => {
            pdf.text(textLine, 15, y);
            y += 5;
        });
    });

    createDisclaimerSection(pdf, [
        '- The findings above are automatically generated via Artificial Intelligence (AI) algorithms.',
        '- The diagnostic accuracy of this model is strictly dependent on the quality of the uploaded X-Ray image.',
        '- This technical report does NOT substitute for professional clinical judgments or final doctor decisions.',
        '- Patients are requested to consult qualified medical practitioners for full diagnostics.'
    ], 15, pageHeight - 50);

    pdf.save(`BaoCao_BacSi_${record.id || Date.now()}.pdf`);
};
