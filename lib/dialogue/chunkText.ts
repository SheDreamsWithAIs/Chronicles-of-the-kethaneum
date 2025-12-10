import { dialogueManager } from './DialogueManager';

/**
 * Chunks text based on screen resolution limits
 * Uses smart chunking: breaks at sentence boundaries first, then word boundaries
 * 
 * @param text - The text to chunk
 * @returns Array of text chunks (always returns at least one chunk, even on error)
 */
export function chunkText(text: string): string[] {
  try {
    // Validate input
    if (!text || typeof text !== 'string') {
      console.warn('[chunkText] Invalid text input, returning single chunk');
      return [text || ''];
    }

    // Get config with error handling
    let config;
    try {
      config = dialogueManager.getConfig();
    } catch (error) {
      console.error('[chunkText] Error getting dialogue config:', error);
      // Fallback: no chunking
      return [text];
    }

    if (!config || !config.display?.textLimits) {
      // Fallback: no chunking if config is missing
      return [text];
    }

    // Detect device type based on window width
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    try {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        if (width < 768) {
          deviceType = 'mobile';
        } else if (width >= 768 && width < 1024) {
          deviceType = 'tablet';
        }
      }
    } catch (error) {
      console.warn('[chunkText] Error detecting device type, defaulting to desktop:', error);
      deviceType = 'desktop';
    }

    // Get max length with fallback
    const maxLength = config.display.textLimits[deviceType]?.maxCharsPerScreen || 300;
    
    if (!Number.isFinite(maxLength) || maxLength <= 0) {
      console.warn('[chunkText] Invalid maxLength, using default 300');
      // Fallback: no chunking
      return [text];
    }

    // If text fits in one chunk, return it
    if (text.length <= maxLength) {
      return [text];
    }

    // Split into sentences (smart chunking at sentence boundaries)
    let sentences: string[];
    try {
      sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    } catch (error) {
      console.error('[chunkText] Error splitting sentences, using full text:', error);
      return [text];
    }

    const chunks: string[] = [];
    let currentChunk = '';

    try {
      for (const sentence of sentences) {
        // Validate sentence
        if (typeof sentence !== 'string') {
          console.warn('[chunkText] Invalid sentence, skipping');
          continue;
        }

        // Check if adding this sentence would exceed the limit
        const wouldExceed = (currentChunk.length + sentence.length) > maxLength;
        
        if (wouldExceed) {
          // If we have accumulated text, save it as a chunk
          if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            // Single sentence exceeds limit - break by words
            const words = sentence.split(' ');
            let wordChunk = '';
            
            for (const word of words) {
              if (typeof word !== 'string') {
                console.warn('[chunkText] Invalid word, skipping');
                continue;
              }

              const testLength = wordChunk ? (wordChunk + ' ' + word).length : word.length;
              
              if (testLength > maxLength) {
                // Current word chunk is full, save it
                if (wordChunk.trim()) {
                  chunks.push(wordChunk.trim());
                  wordChunk = word;
                } else {
                  // Single word exceeds limit - just add it (rare case)
                  chunks.push(word);
                  wordChunk = '';
                }
              } else {
                // Add word to current chunk
                wordChunk += (wordChunk ? ' ' : '') + word;
              }
            }
            
            // Add remaining word chunk to current chunk
            if (wordChunk) {
              currentChunk = wordChunk;
            }
          }
        } else {
          // Sentence fits, add it to current chunk
          currentChunk += sentence;
        }
      }

      // Add any remaining text as final chunk
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
    } catch (error) {
      console.error('[chunkText] Error during chunking process:', error);
      // Fallback: return original text as single chunk
      return [text];
    }

    // Ensure we always return at least one chunk
    if (chunks.length === 0) {
      console.warn('[chunkText] No chunks created, returning original text');
      return [text];
    }

    // Validate chunks are non-empty strings
    const validChunks = chunks.filter(chunk => typeof chunk === 'string' && chunk.trim().length > 0);
    if (validChunks.length === 0) {
      console.warn('[chunkText] All chunks were invalid, returning original text');
      return [text];
    }

    return validChunks;
  } catch (error) {
    // Catch-all error handler
    console.error('[chunkText] Unexpected error in chunkText:', error);
    // Always return at least one chunk to prevent breaking the dialogue system
    return [text || ''];
  }
}