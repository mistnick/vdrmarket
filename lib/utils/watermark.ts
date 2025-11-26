import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export interface WatermarkOptions {
    text: string;
    opacity?: number;
    fontSize?: number;
    rotation?: number;
    color?: { r: number, g: number, b: number };
}

/**
 * Add watermark to PDF document
 * @param pdfBuffer - PDF file as Buffer
 * @param options - Watermark configuration
 * @returns Watermarked PDF as Buffer
 */
export async function addWatermarkToPDF(
    pdfBuffer: Buffer,
    options: WatermarkOptions
): Promise<Buffer> {
    const {
        text,
        opacity = 0.15,
        fontSize = 60,
        rotation = -45,
        color = { r: 0.5, g: 0.5, b: 0.5 },
    } = options;

    try {
        // Load PDF document
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        pdfDoc.registerFontkit(fontkit);

        // Embed font
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Get all pages
        const pages = pdfDoc.getPages();

        // Add watermark to each page
        for (const page of pages) {
            const { width, height } = page.getSize();

            // Calculate center position
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            const textHeight = fontSize;

            // Draw diagonal watermark
            page.drawText(text, {
                x: width / 2 - textWidth / 2,
                y: height / 2 - textHeight / 2,
                size: fontSize,
                font,
                color: rgb(color.r, color.g, color.b),
                opacity,
            });

            // Add footer watermark (smaller)
            const footerText = text;
            const footerFontSize = 10;
            const footerTextWidth = font.widthOfTextAtSize(footerText, footerFontSize);

            page.drawText(footerText, {
                x: width / 2 - footerTextWidth / 2,
                y: 30,
                size: footerFontSize,
                font,
                color: rgb(0.3, 0.3, 0.3),
                opacity: 0.4,
            });
        }

        // Save modified PDF
        const watermarkedPdfBytes = await pdfDoc.save();
        return Buffer.from(watermarkedPdfBytes);
    } catch (error) {
        console.error('Error adding watermark to PDF:', error);
        throw new Error('Failed to add watermark to PDF');
    }
}

/**
 * Generate watermark text from user info and timestamp
 */
export function generateWatermarkText(
    userEmail: string,
    timestamp?: Date
): string {
    const date = timestamp || new Date();
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(' ')[0];

    return `${userEmail} • ${dateStr} ${timeStr}`;
}

/**
 * Create watermark for public link with viewer info
 */
export function createLinkWatermark(
    viewerEmail: string | null,
    viewerIp: string,
    linkSlug: string
): string {
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().split('T')[0];

    if (viewerEmail) {
        return `${viewerEmail} • ${dateStr}`;
    }

    return `IP: ${viewerIp} • Link: ${linkSlug} • ${dateStr}`;
}
