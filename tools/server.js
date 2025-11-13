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

// Helper function to check if path is safe (within DATA_DIR)
function isSafePath(requestedPath) {
  const resolved = path.resolve(DATA_DIR, requestedPath);
  return resolved.startsWith(DATA_DIR);
}

// Helper function to detect manifest files
function isManifestFile(filename) {
  return filename.endsWith('Manifest.json');
}

// Helper function to recursively scan directory
async function scanDirectory(dirPath, relativePath = '') {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const result = {
      folders: [],
      files: [],
      manifests: []
    };

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relPath = path.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        result.folders.push({
          name: entry.name,
          path: relPath,
          fullPath: fullPath
        });
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const stats = await fs.stat(fullPath);
          const content = await fs.readFile(fullPath, 'utf8');
          const data = JSON.parse(content);

          const fileInfo = {
            name: entry.name,
            path: relPath,
            fullPath: fullPath,
            size: stats.size,
            modified: stats.mtime,
            isManifest: isManifestFile(entry.name)
          };

          // Analyze content type
          if (fileInfo.isManifest) {
            fileInfo.manifestType = entry.name.replace('Manifest.json', '');
            fileInfo.itemCount = Object.values(data)[0]?.length || 0;
            result.manifests.push(fileInfo);
          } else {
            // Try to detect content type
            if (Array.isArray(data)) {
              fileInfo.itemCount = data.length;

              // Check if it's puzzle data
              if (data[0]?.genre && data[0]?.words) {
                fileInfo.contentType = 'puzzle';
                fileInfo.genre = data[0].genre;
                fileInfo.books = [...new Set(data.map(p => p.book).filter(Boolean))];
              }
              // Check if it's character data
              else if (data[0]?.name && data[0]?.role) {
                fileInfo.contentType = 'character';
              }
              // Generic array
              else {
                fileInfo.contentType = 'array';
              }
            } else if (typeof data === 'object') {
              fileInfo.contentType = 'object';
              fileInfo.keys = Object.keys(data);
            }

            result.files.push(fileInfo);
          }
        } catch (err) {
          result.files.push({
            name: entry.name,
            path: relPath,
            fullPath: fullPath,
            error: true,
            errorMessage: err.message
          });
        }
      }
    }

    return result;
  } catch (error) {
    throw error;
  }
}

// API Routes

/**
 * Scan directory structure
 */
app.get('/api/browse', async (req, res) => {
  try {
    const requestedPath = req.query.path || '';

    if (!isSafePath(requestedPath)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const fullPath = path.join(DATA_DIR, requestedPath);

    // Check if path exists
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Path not found'
      });
    }

    const structure = await scanDirectory(fullPath, requestedPath);

    res.json({
      success: true,
      currentPath: requestedPath,
      ...structure
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get a specific manifest file
 */
app.get('/api/manifest/:manifestName', async (req, res) => {
  try {
    const manifestName = req.params.manifestName;
    const folderPath = req.query.path || '';

    if (!isSafePath(folderPath)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const manifestPath = path.join(DATA_DIR, folderPath, `${manifestName}Manifest.json`);

    try {
      const content = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(content);
      res.json({
        success: true,
        manifest: manifest,
        manifestName: manifestName,
        path: folderPath
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Manifest doesn't exist, return empty structure
        res.json({
          success: true,
          manifest: {},
          manifestName: manifestName,
          path: folderPath,
          exists: false
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Save a manifest file
 */
app.post('/api/manifest/:manifestName', async (req, res) => {
  try {
    const manifestName = req.params.manifestName;
    const folderPath = req.body.path || '';
    const manifest = req.body.manifest;

    if (!isSafePath(folderPath)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const manifestPath = path.join(DATA_DIR, folderPath, `${manifestName}Manifest.json`);
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

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
 * Get file contents
 */
app.get('/api/file', async (req, res) => {
  try {
    const filePath = req.query.path;

    if (!filePath || !isSafePath(filePath)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const fullPath = path.join(DATA_DIR, filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    const data = JSON.parse(content);

    res.json({
      success: true,
      data: data,
      path: filePath
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create a new file
 */
app.post('/api/file', async (req, res) => {
  try {
    const { filename, folderPath, contentType, initialData } = req.body;

    if (!filename || !filename.endsWith('.json')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename. Must end with .json'
      });
    }

    const targetPath = folderPath || '';
    if (!isSafePath(targetPath)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const filePath = path.join(DATA_DIR, targetPath, filename);

    // Check if file already exists
    if (fsSync.existsSync(filePath)) {
      return res.status(409).json({
        success: false,
        error: 'File already exists'
      });
    }

    // Create default data based on content type
    let defaultData = initialData;

    if (!defaultData) {
      switch (contentType) {
        case 'puzzle':
          defaultData = [
            {
              title: 'Sample Puzzle - Part 1',
              book: 'Sample Book',
              storyPart: 0,
              genre: 'New Genre',
              words: ['sample', 'words', 'here'],
              storyExcerpt: 'This is a sample puzzle. Replace with your own content.'
            }
          ];
          break;
        case 'character':
          defaultData = [
            {
              name: 'Sample Character',
              role: 'NPC',
              description: 'A sample character description'
            }
          ];
          break;
        case 'manifest':
          defaultData = {
            files: []
          };
          break;
        default:
          defaultData = [];
      }
    }

    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf8');

    res.json({
      success: true,
      message: 'File created successfully',
      path: path.join(targetPath, filename)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete a file
 */
app.delete('/api/file', async (req, res) => {
  try {
    const filePath = req.query.path;

    if (!filePath || !isSafePath(filePath)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Prevent deletion of important manifests
    const filename = path.basename(filePath);
    if (filename === 'genreManifest.json' && filePath === 'genreManifest.json') {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete the main genre manifest'
      });
    }

    const fullPath = path.join(DATA_DIR, filePath);
    await fs.unlink(fullPath);

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
 * Create a new folder
 */
app.post('/api/folder', async (req, res) => {
  try {
    const { folderName, parentPath } = req.body;

    if (!folderName) {
      return res.status(400).json({
        success: false,
        error: 'Folder name is required'
      });
    }

    const targetPath = parentPath || '';
    if (!isSafePath(targetPath)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const folderPath = path.join(DATA_DIR, targetPath, folderName);

    // Check if folder already exists
    if (fsSync.existsSync(folderPath)) {
      return res.status(409).json({
        success: false,
        error: 'Folder already exists'
      });
    }

    await fs.mkdir(folderPath, { recursive: true });

    res.json({
      success: true,
      message: 'Folder created successfully',
      path: path.join(targetPath, folderName)
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
