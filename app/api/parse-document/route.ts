// app/api/parse-document/route.ts
// Server-side PDF + DOCX text extractor
// Accepts multipart form-data with a file field named "file"

import { NextRequest } from 'next/server'
import pdfParse from 'pdf-parse'
import * as mammoth from 'mammoth'

export const runtime = 'nodejs'

async function extractPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer)
  return data.text.trim()
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value.trim()
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_SIZE) {
      return Response.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 413 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const mime = file.type
    const name = file.name.toLowerCase()

    let text = ''

    if (mime === 'application/pdf' || name.endsWith('.pdf')) {
      text = await extractPdf(buffer)
    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.docx')
    ) {
      text = await extractDocx(buffer)
    } else if (mime === 'text/plain' || name.endsWith('.txt')) {
      text = buffer.toString('utf-8').trim()
    } else {
      return Response.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' },
        { status: 415 }
      )
    }

    if (!text || text.length < 50) {
      return Response.json(
        { error: 'Could not extract text from file. The file may be scanned/image-based. Try copy-pasting the text instead.' },
        { status: 422 }
      )
    }

    return Response.json({
      text,
      fileName: file.name,
      fileSize: file.size,
      charCount: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    })
  } catch (error) {
    console.error('[Document Parse Error]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to parse document' },
      { status: 500 }
    )
  }
}
