/**
 * Vercel Edge Function — NASA Horizons API 프록시
 * 브라우저 CORS 제한을 우회하기 위해 서버 사이드에서 Horizons에 요청한다.
 */
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const upstream = `https://ssd.jpl.nasa.gov/api/horizons.api?${url.searchParams}`

  const response = await fetch(upstream)
  const body = await response.text()

  return new Response(body, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export const config = { runtime: 'edge' }
