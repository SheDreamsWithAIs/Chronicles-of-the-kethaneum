import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const relativePath = searchParams.get('path') || '';
    const fullPath = path.join(DATA_DIR, relativePath);

    // Security: Ensure path is within DATA_DIR
    if (!fullPath.startsWith(DATA_DIR)) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      );
    }

    // Read directory contents
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    const folders: string[] = [];
    const files: Array<{
      name: string;
      path: string;
      type: string;
      size: number;
    }> = [];
    const manifests: Array<{
      name: string;
      manifestType: string;
    }> = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        folders.push(entry.name);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        const filePath = path.join(fullPath, entry.name);
        const stats = await fs.stat(filePath);
        const relativFilePath = path.join(relativePath, entry.name);

        // Check if this is a manifest file
        if (entry.name.endsWith('Manifest.json')) {
          const manifestType = entry.name.replace('Manifest.json', '');
          manifests.push({
            name: entry.name,
            manifestType
          });
        }

        // Determine file type
        let fileType = 'generic';
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);

          if (Array.isArray(data) && data.length > 0) {
            const first = data[0];
            if (first.title && first.words && first.storyExcerpt) {
              fileType = 'puzzle';
            } else if (first.name && first.role) {
              fileType = 'character';
            }
          }
        } catch {
          // If we can't parse it, keep it as generic
        }

        files.push({
          name: entry.name,
          path: `/${relativePath ? relativePath + '/' : ''}${entry.name}`.replace(/\/+/g, '/'),
          type: fileType,
          size: stats.size
        });
      }
    }

    return NextResponse.json({
      success: true,
      path: relativePath,
      folders,
      files,
      manifests
    });
  } catch (error) {
    console.error('Browse error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
