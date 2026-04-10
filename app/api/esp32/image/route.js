import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * ESP32 Image API - Serves the latest specimen image
 * This is needed because Next.js Turbopack doesn't serve
 * files written to public/ at runtime.
 */
export async function GET() {
    try {
        const imagePath = path.join(process.cwd(), 'public', 'iot', 'specimen.jpg');
        const data = await fs.readFile(imagePath);
        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch (e) {
        return NextResponse.json({ error: 'No image yet' }, { status: 404 });
    }
}
