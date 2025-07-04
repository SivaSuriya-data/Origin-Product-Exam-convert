const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const marked = require('marked');

async function generatePDF() {
    try {
        console.log('📄 Generating PDF documentation...');
        
        // Read the markdown file
        const markdownPath = path.join(__dirname, '..', 'COMPLETE-DOCUMENTATION.md');
        const markdownContent = fs.readFileSync(markdownPath, 'utf8');
        
        // Convert markdown to HTML
        const htmlContent = marked.parse(markdownContent);
        
        // Create complete HTML document
        const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>getConvertedExams.io - Complete Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        h1 {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
            page-break-before: always;
        }
        
        h1:first-child {
            page-break-before: auto;
        }
        
        h2 {
            color: #1e40af;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-top: 2em;
        }
        
        h3 {
            color: #1f2937;
            margin-top: 1.5em;
        }
        
        h4 {
            color: #374151;
            margin-top: 1.2em;
        }
        
        h5 {
            color: #4b5563;
            margin-top: 1em;
        }
        
        code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.9em;
        }
        
        pre {
            background: #1f2937;
            color: #f9fafb;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 16px 0;
            page-break-inside: avoid;
        }
        
        pre code {
            background: none;
            padding: 0;
            color: inherit;
        }
        
        blockquote {
            border-left: 4px solid #2563eb;
            margin: 16px 0;
            padding: 8px 16px;
            background: #eff6ff;
            border-radius: 0 8px 8px 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            page-break-inside: avoid;
        }
        
        th, td {
            border: 1px solid #d1d5db;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background: #f3f4f6;
            font-weight: 600;
        }
        
        tr:nth-child(even) {
            background: #f9fafb;
        }
        
        ul, ol {
            margin: 16px 0;
            padding-left: 24px;
        }
        
        li {
            margin: 4px 0;
        }
        
        a {
            color: #2563eb;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        .no-break {
            page-break-inside: avoid;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2em;
            padding: 2em 0;
            border-bottom: 3px solid #2563eb;
        }
        
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            color: #1e40af;
            border: none;
            page-break-before: auto;
        }
        
        .header p {
            margin: 0.5em 0 0 0;
            font-size: 1.2em;
            color: #6b7280;
        }
        
        .toc {
            background: #f8fafc;
            padding: 2em;
            border-radius: 8px;
            margin: 2em 0;
            page-break-inside: avoid;
        }
        
        .toc h2 {
            margin-top: 0;
            color: #1e40af;
            border-bottom: 2px solid #2563eb;
        }
        
        .toc ul {
            list-style: none;
            padding-left: 0;
        }
        
        .toc li {
            margin: 8px 0;
            padding-left: 1em;
        }
        
        .toc a {
            color: #374151;
            font-weight: 500;
        }
        
        .architecture-diagram {
            background: #f8fafc;
            padding: 1em;
            border-radius: 8px;
            margin: 1em 0;
            font-family: monospace;
            white-space: pre;
            overflow-x: auto;
            page-break-inside: avoid;
        }
        
        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1em;
            margin: 1em 0;
        }
        
        .feature-item {
            background: #f0f9ff;
            padding: 1em;
            border-radius: 8px;
            border-left: 4px solid #0ea5e9;
        }
        
        .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 1em;
            margin: 1em 0;
        }
        
        .success {
            background: #d1fae5;
            border: 1px solid #10b981;
            border-radius: 8px;
            padding: 1em;
            margin: 1em 0;
        }
        
        .error {
            background: #fee2e2;
            border: 1px solid #ef4444;
            border-radius: 8px;
            padding: 1em;
            margin: 1em 0;
        }
        
        @media print {
            body {
                font-size: 12pt;
                line-height: 1.4;
            }
            
            h1 {
                font-size: 18pt;
            }
            
            h2 {
                font-size: 16pt;
            }
            
            h3 {
                font-size: 14pt;
            }
            
            pre {
                font-size: 10pt;
            }
            
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>getConvertedExams.io</h1>
        <p>Complete Project Documentation</p>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>
    
    ${htmlContent}
    
    <div class="page-break">
        <h2>Document Information</h2>
        <table>
            <tr>
                <td><strong>Document Title</strong></td>
                <td>getConvertedExams.io - Complete Project Documentation</td>
            </tr>
            <tr>
                <td><strong>Generated Date</strong></td>
                <td>${new Date().toLocaleString()}</td>
            </tr>
            <tr>
                <td><strong>Version</strong></td>
                <td>1.0.0</td>
            </tr>
            <tr>
                <td><strong>Author</strong></td>
                <td>AI Assistant (Claude)</td>
            </tr>
            <tr>
                <td><strong>Project</strong></td>
                <td>AI-Powered Document Converter for Competitive Exams</td>
            </tr>
            <tr>
                <td><strong>Technologies</strong></td>
                <td>TypeScript, React, Rust, Python, WebAssembly, Docker, Kubernetes, AWS EKS, Jenkins</td>
            </tr>
        </table>
    </div>
</body>
</html>
        `;
        
        // Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Set content and wait for it to load
        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
        
        // Generate PDF
        const pdfPath = path.join(__dirname, '..', 'getConvertedExams-Complete-Documentation.pdf');
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            },
            displayHeaderFooter: true,
            headerTemplate: `
                <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
                    getConvertedExams.io - Complete Documentation
                </div>
            `,
            footerTemplate: `
                <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
                    Page <span class="pageNumber"></span> of <span class="totalPages"></span>
                </div>
            `
        });
        
        await browser.close();
        
        console.log('✅ PDF generated successfully!');
        console.log(`📄 File saved as: ${pdfPath}`);
        
        return pdfPath;
        
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    generatePDF().catch(console.error);
}

module.exports = generatePDF;