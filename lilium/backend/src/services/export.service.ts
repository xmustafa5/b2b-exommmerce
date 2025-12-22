import { FastifyInstance } from 'fastify';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';

export interface ExportData {
  title: string;
  headers: string[];
  rows: any[][];
  metadata?: Record<string, string>;
}

export class ExportService {
  constructor(private fastify: FastifyInstance) {}

  /**
   * Generate CSV from data
   */
  generateCSV(data: any[], fields?: string[]): string {
    try {
      const parser = new Parser({ fields });
      return parser.parse(data);
    } catch (error: any) {
      this.fastify.log.error('CSV generation error:', error.message);
      throw new Error('Failed to generate CSV');
    }
  }

  /**
   * Generate PDF report
   */
  async generatePDF(exportData: ExportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc.fontSize(20).font('Helvetica-Bold').text(exportData.title, { align: 'center' });
        doc.moveDown();

        // Metadata
        if (exportData.metadata) {
          doc.fontSize(10).font('Helvetica');
          Object.entries(exportData.metadata).forEach(([key, value]) => {
            doc.text(`${key}: ${value}`);
          });
          doc.moveDown();
        }

        // Table header
        const startX = 50;
        let startY = doc.y;
        const colWidth = (doc.page.width - 100) / exportData.headers.length;

        doc.fontSize(10).font('Helvetica-Bold');
        exportData.headers.forEach((header, i) => {
          doc.text(header, startX + (i * colWidth), startY, {
            width: colWidth,
            align: 'left',
          });
        });

        // Draw header line
        startY += 15;
        doc.moveTo(startX, startY).lineTo(doc.page.width - 50, startY).stroke();
        startY += 10;

        // Table rows
        doc.font('Helvetica').fontSize(9);
        exportData.rows.forEach((row, rowIndex) => {
          // Check if we need a new page
          if (startY > doc.page.height - 100) {
            doc.addPage();
            startY = 50;
          }

          row.forEach((cell, i) => {
            const cellText = cell !== null && cell !== undefined ? String(cell) : '';
            doc.text(cellText, startX + (i * colWidth), startY, {
              width: colWidth,
              align: 'left',
            });
          });

          startY += 20;

          // Alternate row background (light gray)
          if (rowIndex % 2 === 0) {
            doc.rect(startX, startY - 18, doc.page.width - 100, 18)
              .fill('#f9f9f9')
              .stroke();
          }
        });

        // Footer
        doc.fontSize(8).text(
          `Generated on ${new Date().toLocaleString()}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

        doc.end();
      } catch (error: any) {
        this.fastify.log.error('PDF generation error:', error.message);
        reject(new Error('Failed to generate PDF'));
      }
    });
  }

  /**
   * Generate sales report PDF
   */
  async generateSalesReportPDF(data: {
    startDate: string;
    endDate: string;
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
    salesByZone: Array<{ zone: string; total: number; count: number }>;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('Sales Report', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text(
          `${data.startDate} - ${data.endDate}`,
          { align: 'center' }
        );
        doc.moveDown(2);

        // Summary Stats
        doc.fontSize(16).font('Helvetica-Bold').text('Summary');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');
        doc.text(`Total Sales: $${data.totalSales.toFixed(2)}`);
        doc.text(`Total Orders: ${data.totalOrders}`);
        doc.text(`Average Order Value: $${data.avgOrderValue.toFixed(2)}`);
        doc.moveDown(2);

        // Sales by Zone
        doc.fontSize(16).font('Helvetica-Bold').text('Sales by Zone');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        data.salesByZone.forEach((zone) => {
          doc.text(`${zone.zone}: $${zone.total.toFixed(2)} (${zone.count} orders)`);
        });
        doc.moveDown(2);

        // Top Products
        doc.fontSize(16).font('Helvetica-Bold').text('Top Products');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        data.topProducts.forEach((product, index) => {
          doc.text(`${index + 1}. ${product.name} - ${product.quantity} sold - $${product.revenue.toFixed(2)}`);
        });

        // Footer
        doc.fontSize(8).text(
          `Generated on ${new Date().toLocaleString()} | Lilium B2B Platform`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

        doc.end();
      } catch (error: any) {
        this.fastify.log.error('Sales report PDF error:', error.message);
        reject(new Error('Failed to generate sales report PDF'));
      }
    });
  }

  /**
   * Generate inventory report PDF
   */
  async generateInventoryReportPDF(data: {
    totalProducts: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    products: Array<{
      sku: string;
      name: string;
      stock: number;
      category: string;
      status: string;
    }>;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('Inventory Report', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(
          `Generated: ${new Date().toLocaleString()}`,
          { align: 'center' }
        );
        doc.moveDown(2);

        // Summary Stats
        doc.fontSize(14).font('Helvetica-Bold').text('Summary');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Total Products: ${data.totalProducts} | In Stock: ${data.inStock} | Low Stock: ${data.lowStock} | Out of Stock: ${data.outOfStock}`);
        doc.moveDown(2);

        // Products Table
        doc.fontSize(14).font('Helvetica-Bold').text('Products');
        doc.moveDown(0.5);

        const headers = ['SKU', 'Product Name', 'Category', 'Stock', 'Status'];
        const colWidths = [80, 200, 150, 60, 80];
        let startX = 50;
        let startY = doc.y;

        // Table header
        doc.fontSize(10).font('Helvetica-Bold');
        headers.forEach((header, i) => {
          doc.text(header, startX, startY, { width: colWidths[i] });
          startX += colWidths[i];
        });

        startY += 20;
        doc.moveTo(50, startY).lineTo(doc.page.width - 50, startY).stroke();
        startY += 5;

        // Table rows
        doc.font('Helvetica').fontSize(9);
        data.products.slice(0, 30).forEach((product) => {
          if (startY > doc.page.height - 60) {
            doc.addPage();
            startY = 50;
          }

          startX = 50;
          const values = [product.sku, product.name, product.category, String(product.stock), product.status];
          values.forEach((val, i) => {
            doc.text(val, startX, startY, { width: colWidths[i] });
            startX += colWidths[i];
          });
          startY += 18;
        });

        if (data.products.length > 30) {
          doc.moveDown();
          doc.text(`... and ${data.products.length - 30} more products`);
        }

        doc.end();
      } catch (error: any) {
        this.fastify.log.error('Inventory report PDF error:', error.message);
        reject(new Error('Failed to generate inventory report PDF'));
      }
    });
  }
}
