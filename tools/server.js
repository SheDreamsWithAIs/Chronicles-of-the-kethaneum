const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const app = express();
const PORT = 3030;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Paths
const DATA_DIR = path.join(__dirname, '../public/data');
const MANIFEST_PATH = path.join(DATA_DIR, 'genreManifest.json');

// API Routes

/**
 * Get all JSON files in the data directory
 */
app.get('/api/scan-files', async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    const jsonFiles = files
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: `/data/${file}`,
        fullPath: path.join(DATA_DIR, file)
      }));

    // Get file stats for each file
    const filesWithStats = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const stats = await fs.stat(file.fullPath);
          const content = await fs.readFile(file.fullPath, 'utf8');
          const data = JSON.parse(content);

          let fileInfo = {
            ...file,
            size: stats.size,
            modified: stats.mtime,
            isManifest: file.name === 'genreManifest.json'
          };

          // If it's not a manifest, try to get puzzle info
          if (!fileInfo.isManifest && Array.isArray(data)) {
            fileInfo.puzzleCount = data.length;
            fileInfo.genre = data[0]?.genre || 'Unknown';
            fileInfo.books = [...new Set(data.map(p => p.book).filter(Boolean))];
          }

          return fileInfo;
        } catch (err) {
          return {
            ...file,
            error: true,
            errorMessage: err.message
          };
        }
      })
    );

    res.json({
      success: true,
      files: filesWithStats,
      dataDir: DATA_DIR
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get the current manifest
 */
app.get('/api/manifest', async (req, res) => {
  try {
    const content = await fs.readFile(MANIFEST_PATH, 'utf8');
    const manifest = JSON.parse(content);
    res.json({
      success: true,
      manifest: manifest
    });
  } catch (error) {
    // If manifest doesn't exist, return empty
    if (error.code === 'ENOENT') {
      res.json({
        success: true,
        manifest: { genreFiles: [] }
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

/**
 * Save the manifest
 */
app.post('/api/manifest', async (req, res) => {
  try {
    const manifest = req.body;
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
    res.json({
      success: true,
      message: 'Manifest saved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get contents of a specific puzzle file
 */
app.get('/api/file/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(DATA_DIR, filename);

    // Security check - ensure file is within DATA_DIR
    if (!filePath.startsWith(DATA_DIR)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create a new puzzle file
 */
app.post('/api/file', async (req, res) => {
  try {
    const { filename, genre, initialData } = req.body;

    if (!filename || !filename.endsWith('.json')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename. Must end with .json'
      });
    }

    const filePath = path.join(DATA_DIR, filename);

    // Check if file already exists
    if (fsSync.existsSync(filePath)) {
      return res.status(409).json({
        success: false,
        error: 'File already exists'
      });
    }

    // Create initial data structure
    const defaultData = initialData || [
      {
        title: `Sample Puzzle - Part 1`,
        book: `Sample Book`,
        storyPart: 0,
        genre: genre || 'New Genre',
        words: ['sample', 'words', 'here'],
        storyExcerpt: 'This is a sample puzzle. Replace with your own content.'
      }
    ];

    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf8');

    res.json({
      success: true,
      message: 'File created successfully',
      path: `/data/${filename}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete a puzzle file
 */
app.delete('/api/file/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;

    // Prevent deletion of manifest file
    if (filename === 'genreManifest.json') {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete the manifest file'
      });
    }

    const filePath = path.join(DATA_DIR, filename);

    // Security check
    if (!filePath.startsWith(DATA_DIR)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await fs.unlink(filePath);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update a puzzle file
 */
app.put('/api/file/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const { data } = req.body;

    const filePath = path.join(DATA_DIR, filename);

    // Security check
    if (!filePath.startsWith(DATA_DIR)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Validate JSON
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'No data provided'
      });
    }

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');

    res.json({
      success: true,
      message: 'File updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Serve the HTML interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'manifest-editor.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  Chronicles of the Kethaneum - Development Tools Server   ║
╚═══════════════════════════════════════════════════════════╝

Server running at: http://localhost:${PORT}

Manifest Editor: http://localhost:${PORT}

Data Directory: ${DATA_DIR}

Press Ctrl+C to stop the server
  `);
});
