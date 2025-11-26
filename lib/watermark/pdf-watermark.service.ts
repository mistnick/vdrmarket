import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface WatermarkConfig {
  text: string; // e.g., "john.doe@example.com"
  opacity?: number; // 0-1, default 0.3
  fontSize?: number; // default 24
  angle?: number; // rotation in degrees, default 45
  color?: { r: number; g: number; b: number }; // default gray
  position?: "diagonal" | "footer" | "header"; // default diagonal
}

export class PdfWatermarkService {
  /**
   * Apply watermark to PDF buffer
   * @param pdfBuffer - Original PDF as Buffer
   * @param config - Watermark configuration
   * @returns Watermarked PDF as Buffer
   */
  async applyWatermark(
    pdfBuffer: Buffer,
    config: WatermarkConfig
  ): Promise<Buffer> {
    const {
      text,
      opacity = 0.3,
      fontSize = 24,
      angle = 45,
      color = { r: 0.5, g: 0.5, b: 0.5 },
      position = "diagonal",
    } = config;

    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Apply watermark to each page
    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      switch (position) {
        case "diagonal":
          this.applyDiagonalWatermark(page, {
            text,
            font,
            fontSize,
            width,
            height,
            textWidth,
            opacity,
            color,
            angle,
          });
          break;

        case "footer":
          this.applyFooterWatermark(page, {
            text,
            font,
            fontSize,
            width,
            height,
            textWidth,
            opacity,
            color,
          });
          break;

        case "header":
          this.applyHeaderWatermark(page, {
            text,
            font,
            fontSize,
            width,
            height,
            textWidth,
            opacity,
            color,
          });
          break;
      }
    }

    // Save and return watermarked PDF
    const watermarkedPdfBytes = await pdfDoc.save();
    return Buffer.from(watermarkedPdfBytes);
  }

  private applyDiagonalWatermark(
    page: any,
    params: {
      text: string;
      font: any;
      fontSize: number;
      width: number;
      height: number;
      textWidth: number;
      opacity: number;
      color: { r: number; g: number; b: number };
      angle: number;
    }
  ) {
    const { text, font, fontSize, width, height, opacity, color, angle } = params;

    // Calculate center position
    const x = width / 2;
    const y = height / 2;

    // Draw watermark in center, rotated
    page.drawText(text, {
      x: x - params.textWidth / 2,
      y: y - fontSize / 2,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: {
        type: "degrees",
        angle,
      },
    });

    // Add additional watermarks for better coverage on large pages
    if (width > 800 || height > 1000) {
      // Top-left
      page.drawText(text, {
        x: width * 0.25 - params.textWidth / 2,
        y: height * 0.75,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity: opacity * 0.8,
        rotate: { type: "degrees", angle },
      });

      // Bottom-right
      page.drawText(text, {
        x: width * 0.75 - params.textWidth / 2,
        y: height * 0.25,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity: opacity * 0.8,
        rotate: { type: "degrees", angle },
      });
    }
  }

  private applyFooterWatermark(
    page: any,
    params: {
      text: string;
      font: any;
      fontSize: number;
      width: number;
      height: number;
      textWidth: number;
      opacity: number;
      color: { r: number; g: number; b: number };
    }
  ) {
    const { text, font, fontSize, width, opacity, color, textWidth } = params;

    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: 30,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
    });
  }

  private applyHeaderWatermark(
    page: any,
    params: {
      text: string;
      font: any;
      fontSize: number;
      width: number;
      height: number;
      textWidth: number;
      opacity: number;
      color: { r: number; g: number; b: number };
    }
  ) {
    const { text, font, fontSize, width, height, opacity, color, textWidth } = params;

    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height - 50,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
    });
  }

  /**
   * Generate viewer-specific watermark text
   */
  generateWatermarkText(viewerEmail: string, viewerName?: string): string {
    const timestamp = new Date().toISOString().split("T")[0];
    
    if (viewerName) {
      return `${viewerName} • ${viewerEmail} • ${timestamp}`;
    }
    
    return `${viewerEmail} • ${timestamp}`;
  }
}

export const pdfWatermarkService = new PdfWatermarkService();
