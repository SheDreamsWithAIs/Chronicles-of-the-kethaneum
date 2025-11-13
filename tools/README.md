# Chronicles of the Kethaneum - Development Tools

This directory contains development tools to help manage the game project.

## Manifest Editor

**File:** `manifest-editor.html`

A web-based GUI tool for managing puzzle data manifest files.

### Features

- View all files listed in `genreManifest.json`
- Add new puzzle files to the manifest
- Remove files from the manifest
- Check which files exist and which are missing
- Preview puzzle file contents
- Export updated manifest as JSON
- Copy manifest JSON to clipboard

### How to Use

1. **Start a local web server** in the project root directory:
   ```bash
   # Using Python 3
   python3 -m http.server 8000

   # Or using Python 2
   python -m SimpleHTTPServer 8000

   # Or using Node.js (if you have http-server installed)
   npx http-server -p 8000
   ```

2. **Open the tool** in your web browser:
   ```
   http://localhost:8000/tools/manifest-editor.html
   ```

3. **Managing Files:**
   - **View Files:** The tool automatically loads and displays all files from `genreManifest.json`
   - **Add Files:** Enter a new file path (e.g., `/data/myNewPuzzles.json`) and click "Add File to Manifest"
   - **Remove Files:** Click the "Remove" button next to any file
   - **Preview Files:** Click "View" to see the contents of existing puzzle files

4. **Export Changes:**
   - Click "Download Updated Manifest" to save the modified `genreManifest.json`
   - Click "Copy JSON to Clipboard" to copy the JSON and paste it manually

5. **Apply Changes:**
   - Replace the existing `/public/data/genreManifest.json` with your downloaded file
   - Or manually update the file with the copied JSON

### File Status Indicators

- **Green border + "Exists"**: File exists and can be loaded
- **Red border + "Missing"**: File path is in manifest but file doesn't exist

### Important Notes

- This tool modifies the manifest **in memory only**
- Changes are not automatically saved to disk
- You must download and manually replace the manifest file
- The tool validates that file paths:
  - Start with `/data/`
  - End with `.json`
  - Are not already in the manifest

### Troubleshooting

**Tool won't load:**
- Make sure you're running a local web server (CORS prevents loading from `file://`)
- Ensure you're accessing from the project root directory

**Files show as "Missing":**
- Verify the file exists in `/public/data/`
- Check that the file path in the manifest is correct
- Ensure the file is included in your build

**Can't preview a file:**
- The file might be malformed JSON
- Check the browser console for error details
- Verify the file exists at the specified path

## Future Tools

Additional development tools can be added to this directory to help with:
- Character asset management
- Story validation
- Puzzle testing
- Asset inventory
- Build verification

---

For more information about puzzle data and manifests, see `/public/data/README.md`.
