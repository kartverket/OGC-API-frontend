import { NextResponse } from 'next/server';
import { getApiBaseUrlServer } from '@/utils/api/baseUrl.server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const apiBaseUrl = getApiBaseUrlServer();

    if (!apiBaseUrl) {
        return NextResponse.json({ apiBaseUrl: null }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }

    return NextResponse.json({ apiBaseUrl }, { headers: { 'Cache-Control': 'no-store' } });
}