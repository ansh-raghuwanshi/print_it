import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import QRCode from "qrcode"
import fs from "fs"

// ── Get page count from PDF 
export const getPdfPageCount = async (filePath) => {
  const fileBuffer = fs.readFileSync(filePath)
  const pdfDoc = await PDFDocument.load(fileBuffer)
  return pdfDoc.getPageCount()
}

// ── Generate separator page
export const generateSeparatorPage = async (orderInfo) => {
  const {
    studentName,
    studentPhone,
    date,
    files,           // [{ name, pages, printOptions }]
    stationeryItems, // [{ itemName, quantity }]
    totalAmount,
  } = orderInfo

  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4 size
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)

  const { height } = page.getSize()
  let y = height - 50

  // ── header 
  page.drawText("PRINT IT", {
    x: 50,
    y,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0),
  })

  // ── divider line
  y -= 10
  page.drawLine({
    start: { x: 50, y },
    end: { x: 545, y },
    thickness: 1,
    color: rgb(0, 0, 0),
  })

  // ── student info 
  y -= 25
  page.drawText(`Student : ${studentName}`, { x: 50, y, size: 12, font })
  y -= 18
  page.drawText(`Phone   : ${studentPhone}`, { x: 50, y, size: 12, font })
  y -= 18
  page.drawText(`Date    : ${date}`, { x: 50, y, size: 12, font })

  // ── divider 
  y -= 15
  page.drawLine({
    start: { x: 50, y },
    end: { x: 545, y },
    thickness: 0.5,
    color: rgb(0.5, 0.5, 0.5),
  })

  // ── print jobs
  y -= 20
  page.drawText("PRINT JOBS", { x: 50, y, size: 12, font: boldFont })

  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    y -= 20
    page.drawText(`${i + 1}. ${f.name}`, {
      x: 60,
      y,
      size: 11,
      font: boldFont,
    })
    y -= 16
    page.drawText(
      `   Pages: ${f.pages}  |  ${f.printOptions.color ? "Color" : "B&W"}  |  ${f.printOptions.doubleSided ? "Double sided" : "Single sided"}  |  Copies: ${f.printOptions.copies}`,
      { x: 60, y, size: 10, font }
    )
    if (f.printOptions.notes) {
      y -= 14
      page.drawText(`   Note: ${f.printOptions.notes}`, {
        x: 60,
        y,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })
    }
  }

  // ── divider 
  y -= 15
  page.drawLine({
    start: { x: 50, y },
    end: { x: 545, y },
    thickness: 0.5,
    color: rgb(0.5, 0.5, 0.5),
  })

  // ── stationery 
  y -= 20
  page.drawText("STATIONERY TO PACK", { x: 50, y, size: 12, font: boldFont })

  if (stationeryItems && stationeryItems.length > 0) {
    for (const item of stationeryItems) {
      y -= 18
      page.drawText(`•  ${item.itemName}  ×  ${item.quantity}`, {
        x: 60,
        y,
        size: 11,
        font,
      })
    }
  } else {
    y -= 18
    page.drawText("No stationery items", {
      x: 60,
      y,
      size: 11,
      font,
      color: rgb(0.5, 0.5, 0.5),
    })
  }

  // ── divider 
  y -= 15
  page.drawLine({
    start: { x: 50, y },
    end: { x: 545, y },
    thickness: 0.5,
    color: rgb(0.5, 0.5, 0.5),
  })

  // ── total amount
  y -= 20
  page.drawText(`Total Amount:  INR ${totalAmount}`, {
    x: 50,
    y,
    size: 13,
    font: boldFont,
  })

  // ── QR code ────────────────────────────────────────────────────
  // QR encodes student info for quick lookup
  y -= 30
  const qrData = JSON.stringify({
    studentName,
    studentPhone,
    date,
  })

  const qrImageDataUrl = await QRCode.toDataURL(qrData, { width: 120 })
  const qrImageData = qrImageDataUrl.split(",")[1]
  const qrImageBytes = Buffer.from(qrImageData, "base64")
  const qrImage = await doc.embedPng(qrImageBytes)

  page.drawImage(qrImage, {
    x: 50,
    y: y - 110,
    width: 110,
    height: 110,
  })

  page.drawText("Scan for order details", {
    x: 50,
    y: y - 125,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5),
  })

  // ── bottom divider ─────────────────────────────────────────────
  page.drawLine({
    start: { x: 50, y: 50 },
    end: { x: 545, y: 50 },
    thickness: 2,
    color: rgb(0, 0, 0),
  })

  page.drawText("--- Start of order documents below ---", {
    x: 160,
    y: 35,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  })

  return await doc.save()
  // returns Uint8Array of the separator page PDF bytes
}

// ── Merge separator page with student PDF ─────────────────────────
// separator page goes first
// then all pages of the student's PDF
// no end page needed — next order's separator signals the end
export const mergePdfs = async (separatorPageBytes, studentPdfPath) => {
  const mergedDoc = await PDFDocument.create()

  // add separator page
  const separatorDoc = await PDFDocument.load(separatorPageBytes)
  const [separatorPage] = await mergedDoc.copyPages(separatorDoc, [0])
  mergedDoc.addPage(separatorPage)

  // add all pages from student PDF
  const studentBuffer = fs.readFileSync(studentPdfPath)
  const studentDoc = await PDFDocument.load(studentBuffer)
  const studentPages = await mergedDoc.copyPages(
    studentDoc,
    studentDoc.getPageIndices()
  )
  studentPages.forEach((page) => mergedDoc.addPage(page))

  return await mergedDoc.save()
  // returns Uint8Array of the merged PDF bytes
}