import { jsPDF } from 'jspdf';
import { apiUrl } from '../config/api';
import { formatModelName, resolveModelName } from './diagnosisDisplay';

// Load NotoSans font at runtime from a remote TTF file.
// This function fetches the font, registers it with jsPDF, and sets it as the active font.
// It falls back to Helvetica if loading fails.
const loadVietnameseFonts = async (pdf) => {
    const fetchFont = async (url) => {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        } catch (e) {
            console.error('Error fetching font', e);
            return null;
        }
    };
    try {
        const regular = await fetchFont('https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Regular.ttf');
        const bold = await fetchFont('https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Bold.ttf');
        if (regular) {
            pdf.addFileToVFS('NotoSans-Regular.ttf', regular);
            pdf.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
        }
        if (bold) {
            pdf.addFileToVFS('NotoSans-Bold.ttf', bold);
            pdf.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
        }
        // Load italic variant if available
        const italic = await fetchFont('https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Italic.ttf');
        if (italic) {
            pdf.addFileToVFS('NotoSans-Italic.ttf', italic);
            pdf.addFont('NotoSans-Italic.ttf', 'NotoSans', 'italic');
        }
        // End of font loading
        pdf.setFont('NotoSans', 'normal');
    } catch (e) {
        console.error('Failed to load Vietnamese fonts', e);
        pdf.setFont('helvetica', 'normal');
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
    pdf.setFont('NotoSans', 'bold');
    pdf.setFontSize(18);
    pdf.text(title, pageWidth / 2, 16, { align: 'center' });
    pdf.setFontSize(9);
    pdf.setFont('NotoSans', 'normal');
    pdf.text(subtitle, pageWidth / 2, 23, { align: 'center' });
    pdf.setFontSize(8);
    pdf.setTextColor(224, 242, 254);
    pdf.text(`MÃ BÁO CÁO: ${reportId}`, pageWidth - 15, 32, { align: 'right' });
    pdf.text(`NGÀY PHÁT HÀNH: ${issuedDate}`, 15, 32);
};

const addKeyValueLine = (pdf, label, value, x, y) => {
    pdf.setTextColor(71, 85, 105);
    pdf.setFont('NotoSans', 'normal');
    pdf.text(label, x, y);
    pdf.setFont('NotoSans', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(value, x + 50, y);
};

const createImageSection = async (pdf, title, src, x, y, width, height) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('NotoSans', 'bold');
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
        pdf.setFont('NotoSans', 'italic');
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
    pdf.setFont('NotoSans', 'bold');
    pdf.setFontSize(11);
    pdf.text('BẰNG CHỨNG Y KHOA', 15, y);
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
        pdf.setFont('NotoSans', 'italic');
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
        pdf.setFont('NotoSans', 'italic');
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

    pdf.setFont('NotoSans', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(146, 64, 14);
    pdf.text('LƯU Ý QUAN TRỌNG:', x + 4, y + 5);

    pdf.setFont('NotoSans', 'normal');
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
    pdf.setFont('NotoSans', 'italic');
    pdf.setTextColor(148, 163, 184);
    pdf.text(text, 15, pageHeight - 7);
    pdf.text('TRANG 1 / 1', pageWidth - 15, pageHeight - 7, { align: 'right' });
};

export const exportHomeDiagnosisPdf = async ({ result, displayConfidence, preview, gradcamImg, patientId }) => {
    if (!result) return;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    await loadVietnameseFonts(pdf);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const reportId = `#RPT${Date.now().toString().slice(-6)}`;
    const issuedDate = new Date().toLocaleString('en-US');
    const modelName = formatModelName(resolveModelName(result.model));
    const diagnosisText = result.label === 'Pneumonia' ? 'VIÊM PHỔI' : 'BÌNH THƯỜNG';

    createHeader(
        pdf,
        'BÁO CÁO CHẨN ĐOÁN HỖ TRỢ AI',
        'HỆ THỐNG X-QUANG TỰ ĐỘNG - PNEUVISION AI',
        reportId,
        issuedDate
    );

    let y = 48;
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('NotoSans', 'normal');
    pdf.setFontSize(10);
    addKeyValueLine(pdf, 'THỜI GIAN PHÂN TÍCH:', new Date().toLocaleString('vi-VN'), 15, y);
    y += 8;
    addKeyValueLine(pdf, 'MÔ HÌNH CHẨN ĐOÁN:', modelName, 15, y);
    y += 10;

    pdf.setDrawColor(226, 232, 240);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(15, y, pageWidth - 30, 20, 4, 4, 'FD');
    pdf.setFont('NotoSans', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text('KẾT LUẬN LÂM SÀNG AI:', 22, y + 6);
    pdf.setFontSize(14);
    pdf.setTextColor(result.label === 'Pneumonia' ? 225 : 22, result.label === 'Pneumonia' ? 29 : 163, result.label === 'Pneumonia' ? 72 : 74);
    pdf.text(diagnosisText, 22, y + 14);
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(10);
    pdf.text(`ĐỘ TIN CẬY: ${displayConfidence.toFixed(1)}%`, pageWidth - 70, y + 6);
    y += 34;

    if (preview || gradcamImg) {
        y = await createSideBySideImageSection(pdf, 'X-Quang Gốc', preview, 'Bản đồ Grad-CAM', gradcamImg, y);
    }

    createDisclaimerSection(pdf, [
        '- Kết quả trên được tạo tự động bằng thuật toán Trí Tuệ Nhân Tạo (AI).',
        '- Độ chính xác chẩn đoán phụ thuộc vào chất lượng ảnh X-Quang tải lên.',
        '- Báo cáo này không thay thế cho quyết định lâm sàng của bác sĩ.',
        '- Bệnh nhân nên tham khảo ý kiến bác sĩ để được chẩn đoán đầy đủ.'
    ], 15, pageHeight - 50);

    createFooter(pdf, 'BÁO CÁO Y KHOA KỸ THUẬT - PneuVision Lab 2026');
    pdf.save(`AI_Report_PneuVision_${result.label}_${Date.now().toString().slice(-5)}.pdf`);
};

export const exportHistoryDiagnosisPdf = async (record) => {
    if (!record) return;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    await loadVietnameseFonts(pdf);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const modelName = formatModelName(resolveModelName(record.modelName, record.model, record.aiModel, record.model_name));
    const reportId = `#RPT${String(record.id || Date.now()).slice(-6)}`;
    const issuedDate = new Date().toLocaleString('en-US');
    const diagnosisText = record.label === 'Pneumonia' ? 'VIÊM PHỔI' : 'BÌNH THƯỜNG';
    const doctorText = record.finalLabel === 'Pneumonia' ? 'VIÊM PHỔI' : 'BÌNH THƯỜNG';
    const reviewedAt = record.createdAt ? new Date(record.createdAt).toLocaleString('en-US') : 'N/A';
    const confidence = Number.isFinite(record.confidence) ? (record.confidence * 100).toFixed(1) : 'N/A';
    let y = 48;


    createHeader(
        pdf,
        'BÁO CÁO CHẨN ĐOÁN HỖ TRỢ AI',
        'HỆ THỐNG X-QUANG TỰ ĐỘNG - PNEUVISION AI',
        reportId,
        issuedDate
    );


    pdf.setTextColor(30, 41, 59);
    pdf.setFont('NotoSans', 'normal');
    pdf.setFontSize(10);
    addKeyValueLine(pdf, 'THỜI GIAN PHÂN TÍCH:', reviewedAt, 15, y);
    y += 8;
    addKeyValueLine(pdf, 'MÔ HÌNH CỐ SỐ:', modelName, 15, y);
    y += 10;

    pdf.setDrawColor(226, 232, 240);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(15, y, pageWidth - 30, 20, 4, 4, 'FD');
    pdf.setFont('NotoSans', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text('KẾT LUẬN LÂM SÀNG AI:', 22, y + 6);
    pdf.setFontSize(14);
    pdf.setTextColor(record.label === 'Pneumonia' ? 225 : 22, record.label === 'Pneumonia' ? 29 : 163, record.label === 'Pneumonia' ? 72 : 74);
    pdf.text(diagnosisText, 22, y + 14);
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(10);
    pdf.text(`ĐỘ TIN CẬY: ${confidence}%`, pageWidth - 70, y + 6);
    y += 34;

    if (record.imagePath || record.gradcamPath) {
        y = await createSideBySideImageSection(pdf, 'X-Quang Gốc', apiUrl(record.imagePath), 'Bản đồ Grad-CAM', apiUrl(record.gradcamPath), y);
    }
    // Doctor vs AI comparison (after images)
    if (record.doctorName) {
        pdf.setDrawColor(226, 232, 240);
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(15, y, pageWidth - 30, 20, 4, 4, 'FD');
        pdf.setFont('NotoSans', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text('SO SÁNH TRƯỜNG HỢP:', 22, y + 6);
        pdf.setFontSize(10);
        pdf.setTextColor(30, 41, 59);
        pdf.text(`AI: ${diagnosisText}`, 22, y + 14);
        pdf.text(`DOCTOR: ${doctorText}`, pageWidth / 2 + 10, y + 14);
        y += 34;
        // Optional doctor comment
        if (record.doctorComment) {
            pdf.setFont('NotoSans', 'normal');
            pdf.setFontSize(10);
            pdf.setTextColor(30, 41, 59);
            pdf.text(`NHẬN XÉT BÁC SĨ: ${record.doctorComment}`, 15, y);
            y += 8;
        }
    }

    createDisclaimerSection(pdf, [
        '- Kết quả trên được tạo tự động bằng thuật toán Trí Tuệ Nhân Tạo (AI).',
        '- Độ chính xác chẩn đoán phụ thuộc vào chất lượng ảnh X-Quang tải lên.',
        '- Báo cáo này không thay thế cho quyết định lâm sàng của bác sĩ.',
        '- Bệnh nhân nên tham khảo ý kiến bác sĩ để được chẩn đoán đầy đủ.'
    ], 15, pageHeight - 50);

    createFooter(pdf, 'BÁO CÁO Y KHOA KỸ THUẬT - PneuVision Lab 2026');
    pdf.save(`BaoCao_ChanDoan_${record.id || Date.now()}.pdf`);
};

export const viewDoctorReport = async (record) => {
    if (!record) return;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    await loadVietnameseFonts(pdf);

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
        'BÁO CÁO ĐÁNH GIÁ BÁC SĨ',
        'HỆ THỐNG X-QUANG TỰ ĐỘNG - PNEUVISION AI',
        reportId,
        issuedDate
    );

    let y = 48;
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('NotoSans', 'normal');
    pdf.setFontSize(10);
    addKeyValueLine(pdf, 'REVIEW TIME:', reviewedAt, 15, y);
    y += 8;
    addKeyValueLine(pdf, 'DOCTOR:', record.doctorName || 'Không xác định', 15, y);
    y += 8;
    addKeyValueLine(pdf, 'AI MODEL:', modelName, 15, y);
    y += 10;

    pdf.setDrawColor(226, 232, 240);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(15, y, pageWidth - 30, 20, 4, 4, 'FD');
    pdf.setFont('NotoSans', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text('SO SÁNH TRƯỜNG HỢP:', 22, y + 6);
    pdf.setFontSize(10);
    pdf.setTextColor(30, 41, 59);
    pdf.text(`AI: ${diagnosisText}`, 22, y + 14);
    pdf.text(`DOCTOR: ${doctorText}`, pageWidth / 2 + 10, y + 14);
    y += 34;

    if (record.diagnosis?.imagePath || record.diagnosis?.gradcamPath) {
        y = await createSideBySideImageSection(pdf, 'X-Quang Gốc', apiUrl(record.diagnosis.imagePath), 'Bản đồ Grad-CAM', apiUrl(record.diagnosis.gradcamPath), y);
    }

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('NotoSans', 'bold');
    pdf.setFontSize(11);
    pdf.text('GHI CHÚ LÂM SÀNG', 15, y);
    pdf.setDrawColor(148, 163, 184);
    pdf.line(15, y + 2, pageWidth - 15, y + 2);
    y += 8;

    pdf.setFont('NotoSans', 'normal');
    pdf.setFontSize(9);
    const notes = [
        `- ĐỘ TIN CẬY AI: ${confidence}%`,
        `- KẾT LUẬN BÁC SĨ: ${doctorText}`,
        `- NHẬN XÉT BÁC SĨ: ${record.doctorComment || 'N/A'}`,
        `- TRẠNG THÁI: ${record.diagnosis?.label === record.finalLabel ? 'Đồng ý với AI' : 'Khác với AI'}`
    ];

    notes.forEach((line) => {
        const wrapped = pdf.splitTextToSize(line, pageWidth - 28);
        wrapped.forEach((textLine) => {
            pdf.text(textLine, 15, y);
            y += 5;
        });
    });

    createDisclaimerSection(pdf, [
        '- Kết quả trên được tạo tự động bằng thuật toán Trí Tuệ Nhân Tạo (AI).',
        '- Độ chính xác chẩn đoán phụ thuộc vào chất lượng ảnh X-Quang tải lên.',
        '- Báo cáo này không thay thế cho quyết định lâm sàng của bác sĩ.',
        '- Bệnh nhân nên tham khảo ý kiến bác sĩ để được chẩn đoán đầy đủ.'
    ], 15, pageHeight - 50);

    // Return blob URL for inline viewing
    createFooter(pdf, 'BÁO CÁO Y KHOA KỸ THUẬT - PneuVision Lab 2026');
    const blobUrl = pdf.output('bloburl');
    return blobUrl;
};

export const exportDoctorReviewPdf = async (record) => {
    if (!record) return;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    await loadVietnameseFonts(pdf);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const reportId = `#RPT${String(record.id || Date.now()).slice(-6)}`;
    const issuedDate = new Date().toLocaleString('en-US');
    const modelName = formatModelName(resolveModelName(record.diagnosis?.modelName, record.diagnosis?.model, record.diagnosis?.aiModel, record.diagnosis?.model_name));
    const diagnosisText = record.diagnosis?.label === 'Pneumonia' ? 'VIÊM PHỔI' : 'BÌNH THƯỜNG';
    const doctorText = record.finalLabel === 'Pneumonia' ? 'VIÊM PHỔI' : 'BÌNH THƯỜNG';
    const confidence = Number.isFinite(record.diagnosis?.confidence) ? (record.diagnosis.confidence * 100).toFixed(1) : 'N/A';
    const reviewedAt = record.reviewedAt ? new Date(record.reviewedAt).toLocaleString('en-US') : 'N/A';

    createHeader(
        pdf,
        'BÁO CÁO ĐÁNH GIÁ BÁC SĨ',
        'HỆ THỐNG X-QUANG TỰ ĐỘNG - PNEUVISION AI',
        reportId,
        issuedDate
    );

    let y = 48;
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('NotoSans', 'normal');
    pdf.setFontSize(10);
    addKeyValueLine(pdf, 'REVIEW TIME:', reviewedAt, 15, y);
    y += 8;
    addKeyValueLine(pdf, 'DOCTOR:', record.doctorName || 'Không xác định', 15, y);
    y += 8;
    addKeyValueLine(pdf, 'AI MODEL:', modelName, 15, y);
    y += 10;

    pdf.setDrawColor(226, 232, 240);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(15, y, pageWidth - 30, 20, 4, 4, 'FD');
    pdf.setFont('NotoSans', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text('SO SÁNH TRƯỜNG HỢP:', 22, y + 6);
    pdf.setFontSize(10);
    pdf.setTextColor(30, 41, 59);
    pdf.text(`AI: ${diagnosisText}`, 22, y + 14);
    pdf.text(`DOCTOR: ${doctorText}`, pageWidth / 2 + 10, y + 14);
    y += 34;

    if (record.diagnosis?.imagePath || record.diagnosis?.gradcamPath) {
        y = await createSideBySideImageSection(pdf, 'X-Quang Gốc', apiUrl(record.diagnosis.imagePath), 'Bản đồ Grad-CAM', apiUrl(record.diagnosis.gradcamPath), y);
    }

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('NotoSans', 'bold');
    pdf.setFontSize(11);
    pdf.text('GHI CHÚ LÂM SÀNG', 15, y);
    pdf.setDrawColor(148, 163, 184);
    pdf.line(15, y + 2, pageWidth - 15, y + 2);
    y += 8;

    pdf.setFont('NotoSans', 'normal');
    pdf.setFontSize(9);
    const notes = [
        `- ĐỘ TIN CẬY AI: ${confidence}%`,
        `- KẾT LUẬN BÁC SĨ: ${doctorText}`,
        `- NHẬN XÉT BÁC SĨ: ${record.doctorComment || 'Bác sĩ không để lại nhận xét nào.'}`,
        `- TRẠNG THÁI: ${record.diagnosis?.label === record.finalLabel ? 'Đồng ý với AI' : 'Khác với AI'}`
    ];

    notes.forEach((line) => {
        const wrapped = pdf.splitTextToSize(line, pageWidth - 28);
        wrapped.forEach((textLine) => {
            pdf.text(textLine, 15, y);
            y += 5;
        });
    });

    createDisclaimerSection(pdf, [
        '- Kết quả trên được tạo tự động bằng thuật toán Trí Tuệ Nhân Tạo (AI).',
        '- Độ chính xác chẩn đoán phụ thuộc vào chất lượng ảnh X-Quang tải lên.',
        '- Báo cáo này không thay thế cho quyết định lâm sàng của bác sĩ.',
        '- Bệnh nhân nên tham khảo ý kiến bác sĩ để được chẩn đoán đầy đủ.'
    ], 15, pageHeight - 50);

    createFooter(pdf, 'BÁO CÁO Y KHOA KỸ THUẬT - PneuVision Lab 2026');
    pdf.save(`BaoCao_BacSi_${record.id || Date.now()}.pdf`);
};
