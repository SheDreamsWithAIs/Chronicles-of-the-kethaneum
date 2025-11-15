import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

function validatePath(folderPath: string): boolean {
  const fullPath = path.join(DATA_DIR, folderPath);
  return fullPath.startsWith(DATA_DIR);
}

// POST - Create new folder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { folderName, currentPath } = body;

    if (!folderName || folderName.includes('/') || folderName.includes('\\')) {
      return NextResponse.json(
        { success: false, error: 'Invalid folder name' },
        { status: 400 }
      );
    }

    const folderPath = path.join(currentPath || '', folderName);

    if (!validatePath(folderPath)) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      );
    }

    const fullPath = path.join(DATA_DIR, folderPath);

    // Check if folder already exists
    try {
      await fs.access(fullPath);
      return NextResponse.json(
        { success: false, error: 'Folder already exists' },
        { status: 400 }
      );
    } catch {
      // Folder doesn't exist, continue
    }

    await fs.mkdir(fullPath, { recursive: true });

    return NextResponse.json({
      success: true,
      path: folderPath
    });
  } catch (error) {
    console.error('Folder create error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
