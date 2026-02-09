import { NextResponse } from 'next/server'
import fetch from 'node-fetch'

export async function POST(request: Request) {
  const { prompt } = await request.json()
  const apiKey = process.env.GEMINI_API_KEY
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  })

  const data = await response.json()
  return NextResponse.json(data)
}