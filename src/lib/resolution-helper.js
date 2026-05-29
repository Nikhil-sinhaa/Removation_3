import sharp from 'sharp';

/**
 * Calculates optimal target dimensions that preserve the input image's aspect ratio
 * while scaling to target a specific total pixel area (optimal for SD 1.5/Photon).
 * Outputs are rounded to the nearest multiple of 64 to comply with neural network constraints.
 * 
 * @param {string} imagePath - Absolute path to the input image file
 * @param {number} targetPixelArea - Target total number of pixels (default: 1,000,000)
 * @returns {Promise<{width: number, height: number}>}
 */
export async function getTargetDimensions(imagePath, targetPixelArea = 1000000) {
  try {
    const metadata = await sharp(imagePath).metadata();
    const { width, height } = metadata;
    
    if (!width || !height) {
      console.warn(`[ResolutionHelper] Warning: Could not extract metadata from ${imagePath}, using default 1024x768`);
      return { width: 1024, height: 768 };
    }
    
    const aspect = width / height;
    
    // Scale keeping aspect ratio
    // width / height = aspect -> width = height * aspect
    // width * height = targetArea -> height * aspect * height = targetArea -> height^2 = targetArea / aspect
    let targetHeight = Math.sqrt(targetPixelArea / aspect);
    let targetWidth = aspect * targetHeight;
    
    // Align to nearest multiple of 64 (safer for UNET/VAE architectures)
    targetWidth = Math.round(targetWidth / 64) * 64;
    targetHeight = Math.round(targetHeight / 64) * 64;
    
    // Clamp to reasonable ranges
    targetWidth = Math.max(512, Math.min(1536, targetWidth));
    targetHeight = Math.max(512, Math.min(1536, targetHeight));
    
    console.log(`[ResolutionHelper] Original: ${width}x${height} (aspect ${aspect.toFixed(2)}). Rescaled: ${targetWidth}x${targetHeight} (~${((targetWidth * targetHeight) / 1000000).toFixed(2)}M px)`);
    
    return { width: targetWidth, height: targetHeight };
  } catch (error) {
    console.error(`[ResolutionHelper] Error reading metadata for ${imagePath}:`, error.message);
    return { width: 1024, height: 768 }; // Safe fallback
  }
}
