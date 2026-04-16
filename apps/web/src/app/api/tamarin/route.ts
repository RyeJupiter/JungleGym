import { NextResponse } from 'next/server'

const IMAGE_URL =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/CagedTamarin.jpg/400px-CagedTamarin.jpg'

export async function GET() {
  const res = await fetch(IMAGE_URL, {
    headers: { 'User-Agent': 'JungleGym/1.0 (https://junglegym.academy)' },
  })

  if (!res.ok) {
    return new NextResponse('Image unavailable', { status: 502 })
  }

  const buffer = await res.arrayBuffer()
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
