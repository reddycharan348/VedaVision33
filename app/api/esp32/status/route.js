import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * ESP32 Status API - Serves the IoT status.json
 * This is needed because Next.js Turbopack doesn't serve
 * files written to public/ at runtime.
 */
export async function GET() {
    try {
        const statusPath = path.join(process.cwd(), 'public', 'iot', 'status.json');
        const data = await fs.readFile(statusPath, 'utf8');
        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch (e) {
        return NextResponse.json({ error: 'No IoT data yet' }, { status: 404 });
    }
}
