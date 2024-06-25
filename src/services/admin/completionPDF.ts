import PDFDocument from 'pdfkit'
import fs from 'fs'

export async function generateCertificate(
  menteeName: string,
  mentorName: string,
  fileName: string,
  logoPath: string
): Promise<string> {
  return await new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape'
    })

    const stream = fs.createWriteStream(fileName)
    doc.pipe(stream)

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f9f9f9')

    // Decorative elements
    doc.polygon([0, 0], [200, 0], [0, 100]).fill('#3498db')
    doc
      .polygon(
        [doc.page.width, doc.page.height],
        [doc.page.width - 200, doc.page.height],
        [doc.page.width, doc.page.height - 100]
      )
      .fill('#3498db')

    // Border
    doc
      .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
      .lineWidth(2)
      .stroke('#34495e')

    // Company logo (top center)
    doc.image(logoPath, (doc.page.width - 100) / 2, 50, { width: 100 })

    // Title
    doc
      .font('Helvetica-Bold')
      .fontSize(36)
      .fillColor('#2c3e50')
      .text('Certificate of Excellence', 0, 160, { align: 'center' })

    // Subtitle
    doc
      .font('Helvetica')
      .fontSize(20)
      .fillColor('#34495e')
      .text('6-Month Mentorship Program', 0, 205, { align: 'center' })

    // Mentee Name
    doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor('#2980b9')
      .text(menteeName, 0, 260, { align: 'center' })

    // Description
    doc
      .font('Helvetica')
      .fontSize(14)
      .fillColor('#34495e')
      .text(
        'has successfully completed the 6-month mentorship program under the guidance of',
        0,
        300,
        { align: 'center' }
      )

    // Mentor Name
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#2980b9')
      .text(mentorName, 0, 325, { align: 'center' })

    doc
      .font('Helvetica')
      .fontSize(14)
      .fillColor('#34495e')
      .text(
        'demonstrating exceptional dedication, remarkable growth, and outstanding achievement.',
        0,
        355,
        { align: 'center' }
      )

    // Date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    doc
      .fontSize(12)
      .text(`Awarded on ${currentDate}`, 0, 400, { align: 'center' })

    // Signatures
    const signatureY = 450
    const signatureWidth = 150

    // Mentor Signature
    doc
      .fontSize(12)
      .text(
        'Mentor Signature',
        doc.page.width / 2 - signatureWidth - 20,
        signatureY,
        { width: signatureWidth, align: 'center' }
      )
      .moveTo(doc.page.width / 2 - signatureWidth - 20, signatureY - 20)
      .lineTo(doc.page.width / 2 - 20, signatureY - 20)
      .stroke()

    // Company Representative Signature
    doc.image(logoPath, doc.page.width / 2 + 20, signatureY - 50, {
      width: 100
    })
    doc
      .fontSize(12)
      .text('Company Representative', doc.page.width / 2 + 20, signatureY, {
        width: signatureWidth,
        align: 'center'
      })

    doc.end()

    stream.on('finish', () => {
      console.log('Certificate generated successfully')
      resolve(fileName)
    })

    stream.on('error', reject)
  })
}
