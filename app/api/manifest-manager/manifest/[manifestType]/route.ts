import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

// This route is only for development - won't work in static export
export const dynamic = 'force-static';
export const dynamicParams = false;

// Required for static export with dynamic routes - return empty array since this is dev-only
export async function generateStaticParams() {
  return [];
}

function validatePath(folderPath: string): boolean {
  const fullPath = path.join(DATA_DIR, folderPath);
  return fullPath.startsWith(DATA_DIR);
}

// GET - Read manifest
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ manifestType: string }> }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const relativePath = searchParams.get('path') || '';
    const { manifestType } = await params;

    if (!validatePath(relativePath)) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      );
    }

    const manifestFilename = `${manifestType}Manifest.json`;
    const fullPath = path.join(DATA_DIR, relativePath, manifestFilename);

    const content = await fs.readFile(fullPath, 'utf-8');
    const manifest = JSON.parse(content);

    return NextResponse.json({
      success: true,
      manifest,
      path: relativePath
    });
  } catch (error) {
    console.error('Manifest read error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Save manifest
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ manifestType: string }> }
) {
  try {
    const body = await request.json();
    const { manifest, path: relativePath, create } = body;
    const { manifestType } = await params;

    if (!validatePath(relativePath || '')) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      );
    }

    const manifestFilename = `${manifestType}Manifest.json`;
    const fullPath = path.join(DATA_DIR, relativePath || '', manifestFilename);

    // If creating, check if file already exists
    if (create) {
      try {
        await fs.access(fullPath);
        return NextResponse.json(
          { success: false, error: 'Manifest already exists' },
          { status: 400 }
        );
      } catch {
        // File doesn't exist, continue
      }
    }

    await fs.writeFile(fullPath, JSON.stringify(manifest, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      path: relativePath || ''
    });
  } catch (error) {
    console.error('Manifest save error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
