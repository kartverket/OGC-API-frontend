import { NextResponse } from 'next/server';
import { getBaseUrlPublic } from "@/utils/api/baseUrl";

export const dynamic = 'force-dynamic';

export async function GET() {
    const baseUrl = getBaseUrlPublic();

    if (!baseUrl) {
        return NextResponse.json({ baseUrl: null }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }

    return NextResponse.json({ baseUrl: baseUrl }, { headers: { 'Cache-Control': 'no-store' } });
}
