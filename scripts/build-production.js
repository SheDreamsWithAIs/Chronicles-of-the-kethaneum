const { execSync } = require('child_process');
const { existsSync, renameSync, rmSync } = require('fs');
const { join } = require('path');

const DEV_DIRS = [
  { src: join(process.cwd(), 'app', 'tools'), dest: join(process.cwd(), '_dev_tools') },
  { src: join(process.cwd(), 'app', 'api', 'manifest-manager'), dest: join(process.cwd(), '_dev_api_manifest-manager') },
];

console.log('Preparing production build...');

// Clean .next directory to remove cached type definitions that reference dev tools
const nextDir = join(process.cwd(), '.next');
if (existsSync(nextDir)) {
  try {
    console.log('Cleaning .next directory...');
    rmSync(nextDir, { recursive: true, force: true });
    console.log('✓ Cleaned .next directory');
  } catch (error) {
    console.warn(`⚠ Could not clean .next directory:`, error.message);
  }
}

// Move dev directories out of the way
let movedDirs = [];
DEV_DIRS.forEach(({ src, dest }) => {
  if (existsSync(src)) {
    try {
      renameSync(src, dest);
      movedDirs.push({ src, dest });
      console.log(`✓ Moved ${src} → ${dest}`);
    } catch (error) {
      console.error(`✗ Failed to move ${src}:`, error.message);
      process.exit(1);
    }
  }
});

try {
  console.log('\nBuilding for production...');
  execSync('next build', { stdio: 'inherit' });
  console.log('\n✓ Build completed successfully!');
} catch (error) {
  console.error('\n✗ Build failed:', error.message);
  // Restore directories even if build fails
  movedDirs.forEach(({ src, dest }) => {
    try {
      if (existsSync(dest)) {
        renameSync(dest, src);
        console.log(`✓ Restored ${dest} → ${src}`);
      }
    } catch (restoreError) {
      console.error(`✗ Failed to restore ${dest}:`, restoreError.message);
    }
  });
  process.exit(1);
}

// Restore dev directories after successful build
console.log('\nRestoring development directories...');
movedDirs.forEach(({ src, dest }) => {
  try {
    if (existsSync(dest)) {
      renameSync(dest, src);
      console.log(`✓ Restored ${dest} → ${src}`);
    }
  } catch (error) {
    console.error(`✗ Failed to restore ${dest}:`, error.message);
  }
});

console.log('\n✓ Production build complete!');

