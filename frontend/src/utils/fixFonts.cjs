const fs = require('fs');
const path = 'd:/TieuLuan/pneumonia-diagnosis-system/frontend/src/utils/diagnosisReportPdf.js';
let content = fs.readFileSync(path, 'utf8');

const loadFontFunc = `const loadVietnameseFonts = async (pdf) => {
    const fetchFont = async (url) => {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            let binary = '';
            const bytes = new Uint8Array(arrayBuffer);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        } catch(e) {
            console.error('Error fetching font', e);
            return null;
        }
    };

    try {
        const regularBase64 = await fetchFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf');
        const boldBase64 = await fetchFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf');
        const italicBase64 = await fetchFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Italic.ttf');
        
        if (regularBase64) {
            pdf.addFileToVFS('Roboto-Regular.ttf', regularBase64);
            pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        }
        if (boldBase64) {
            pdf.addFileToVFS('Roboto-Medium.ttf', boldBase64);
            pdf.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');
        }
        if (italicBase64) {
            pdf.addFileToVFS('Roboto-Italic.ttf', italicBase64);
            pdf.addFont('Roboto-Italic.ttf', 'Roboto', 'italic');
        }
        pdf.setFont('Roboto', 'normal');
    } catch (error) {
        console.error('Lỗi tải font tiếng Việt:', error);
    }
};`;

content = content.replace(/const applyFontFallback = \(pdf\) => \{[\s\S]*?\};\n/, loadFontFunc + '\n');
content = content.replace(/applyFontFallback\(pdf\);/g, 'await loadVietnameseFonts(pdf);');
content = content.replace(/'helvetica'/g, "'Roboto'");

fs.writeFileSync(path, content, 'utf8');
console.log('Done replacement!');
