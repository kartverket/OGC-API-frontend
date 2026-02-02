import { NextResponse } from 'next/server';
import { getApiBaseUrlPublic } from '@/utils/api/baseUrl';

export const dynamic = 'force-dynamic';

export async function GET() {
    const apiBaseUrl = getApiBaseUrlPublic();

    if (!apiBaseUrl) {
        return NextResponse.json({ apiBaseUrl: null }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }

    return NextResponse.json({ apiBaseUrl }, { headers: { 'Cache-Control': 'no-store' } });
}