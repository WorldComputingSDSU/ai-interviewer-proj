import { NextResponse } from 'next/server'

function parseCookies(cookieHeader: string | null) {
	const map: Record<string, string> = {}
	if (!cookieHeader) return map
	cookieHeader.split(';').forEach((pair) => {
		const [k, ...v] = pair.split('=')
		const key = k?.trim()
		const val = v.join('=')?.trim()
		if (key) map[key] = decodeURIComponent(val || '')
	})
	return map
}

export async function POST(req: Request) {
	try {
		const cookieHeader = req.headers.get('cookie')
		const cookies = parseCookies(cookieHeader)


		const token = cookies['sb-access-token'] || cookies['supabase-auth-token'] || cookies['access_token'] || cookies['token'] || null

		const form = await req.formData()

		const file = form.get('file') as File | null
		if (!file) return NextResponse.json({ error: 'no file provided' }, { status: 400 })

		const bucket = (form.get('bucket') as string) || 'public'
		const filename = (form.get('filename') as string) || file.name || `${Date.now()}`
		const path = `${Date.now()}-${filename}`

		const SUPABASE_URL = process.env.SUPABASE_URL
		const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

		if (!SUPABASE_URL) {
			return NextResponse.json({ error: 'Missing SUPABASE_URL env' }, { status: 500 })
		}

		const authKey = token || SUPABASE_SERVICE_KEY
		if (!authKey) {
			return NextResponse.json({ error: 'Missing Supabase auth key or user token' }, { status: 500 })
		}


		const uploadUrl = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeURIComponent(path)}`

		const arrayBuffer = await file.arrayBuffer()

		const uploadRes = await fetch(uploadUrl, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${authKey}`,
				'Content-Type': file.type || 'application/octet-stream',
			},
			body: arrayBuffer,
		})

		if (!uploadRes.ok) {
			const text = await uploadRes.text()
			return NextResponse.json({ error: 'upload_failed', details: text }, { status: uploadRes.status })
		}


		const publicUrl = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeURIComponent(path)}`

		return NextResponse.json({ ok: true, url: publicUrl })
	} catch (err: any) {
		return NextResponse.json({ error: 'server_error', message: err?.message || String(err) }, { status: 500 })
	}
}

export const runtime = 'nodejs'
