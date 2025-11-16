import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

// This route is only for development - won't work in static export
export const dynamic = 'force-static';

function validatePath(filePath: string): boolean {
  const fullPath = path.join(DATA_DIR, filePath);
  return fullPath.startsWith(DATA_DIR);
}

// GET - Read file contents
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get('path') || '';

    if (!validatePath(filePath)) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      );
    }

    const fullPath = path.join(DATA_DIR, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const data = JSON.parse(content);

    return NextResponse.json({
      success: true,
      path: filePath,
      content: data
    });
  } catch (error) {
    console.error('File read error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Create new file
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, contentType, currentPath } = body;

    if (!filename || !filename.endsWith('.json')) {
      return NextResponse.json(
        { success: false, error: 'Filename must end with .json' },
        { status: 400 }
      );
    }

    const filePath = path.join(currentPath || '', filename);

    if (!validatePath(filePath)) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      );
    }

    const fullPath = path.join(DATA_DIR, filePath);

    // Check if file already exists
    try {
      await fs.access(fullPath);
      return NextResponse.json(
        { success: false, error: 'File already exists' },
        { status: 400 }
      );
    } catch {
      // File doesn't exist, continue
    }

    // Create template content based on type
    let content;
    switch (contentType) {
      case 'puzzle':
        content = [
          {
            title: 'Sample Puzzle - Part 1',
            book: 'Sample Book',
            storyPart: 0,
            genre: 'New Genre',
            words: ['sample', 'words', 'here'],
            storyExcerpt: 'Story text goes here...'
          }
        ];
        break;
      case 'character':
        content = [
          {
            name: 'Sample Character',
            role: 'NPC',
            description: 'Character description goes here...'
          }
        ];
        break;
      case 'object':
        content = {};
        break;
      default: // 'array'
        content = [];
    }

    await fs.writeFile(fullPath, JSON.stringify(content, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      path: filePath
    });
  } catch (error) {
    console.error('File create error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Delete file
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get('path') || '';

    if (!validatePath(filePath)) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      );
    }

    const fullPath = path.join(DATA_DIR, filePath);
    await fs.unlink(fullPath);

    return NextResponse.json({
      success: true,
      path: filePath
    });
  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
