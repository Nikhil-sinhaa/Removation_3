import fs from 'fs';
import path from 'path';
import https from 'https';

// ─── Config ───────────────────────────────────────────────────────────────────

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';
const OUTPUT_DIR = path.join(process.cwd(), 'public/style-references');
const MIN_IMAGES_PER_STYLE = 6;

// ─── Style definitions with Unsplash search queries ───────────────────────────

const STYLES = [
  {
    id: 'japandi',
    folder: 'japandi',
    references: [
      { id: 'warm-wood',      query: 'japandi interior warm wood minimal living room',      label: 'Warm wood tones' },
      { id: 'dark-zen',       query: 'japandi dark zen interior bedroom minimal',            label: 'Dark zen palette' },
      { id: 'natural-light',  query: 'japandi bright natural light white interior',          label: 'Natural light' },
      { id: 'wabi-sabi',      query: 'wabi sabi interior natural textures neutral',          label: 'Wabi-sabi textures' },
      { id: 'earthy-minimal', query: 'japandi earthy minimal interior clay tones',           label: 'Earthy minimal' },
      { id: 'nordic-japanese',query: 'nordic japanese fusion interior design clean',         label: 'Nordic-Japanese fusion' },
    ]
  },
  {
    id: 'traditional-indian',
    folder: 'traditional-indian',
    references: [
      { id: 'rajasthani',    query: 'Rajasthani royal interior colorful India home',         label: 'Rajasthani royal' },
      { id: 'kerala',        query: 'Kerala traditional teak wood interior India',           label: 'Kerala teak' },
      { id: 'mughal',        query: 'Mughal inspired Indian interior arches ornate',         label: 'Mughal inspired' },
      { id: 'haveli',        query: 'Indian haveli interior courtyard traditional',          label: 'Haveli style' },
      { id: 'brass-accents', query: 'Indian traditional interior brass copper accents warm', label: 'Brass accents' },
      { id: 'block-print',   query: 'Indian block print textile interior ethnic colorful',   label: 'Block print' },
    ]
  },
  {
    id: 'scandinavian',
    folder: 'scandinavian',
    references: [
      { id: 'white-cozy',   query: 'Scandinavian white cozy interior hygge living room',    label: 'White and cozy' },
      { id: 'pine-wood',    query: 'Scandinavian pine wood interior nordic minimal',         label: 'Pine wood' },
      { id: 'dark-hygge',   query: 'Scandinavian dark cozy interior candles moody',         label: 'Dark hygge' },
      { id: 'grey-calm',    query: 'Scandinavian grey calm interior minimalist nordic',      label: 'Grey calm' },
      { id: 'natural-linen',query: 'Scandinavian natural linen textile interior warm',       label: 'Natural linen' },
      { id: 'open-plan',    query: 'Scandinavian open plan interior white clean light',      label: 'Open plan' },
    ]
  },
  {
    id: 'industrial',
    folder: 'industrial',
    references: [
      { id: 'raw-brick',    query: 'industrial interior exposed brick loft apartment',       label: 'Raw exposed brick' },
      { id: 'concrete',     query: 'industrial concrete interior dark metal pipes',          label: 'Concrete and metal' },
      { id: 'warehouse',    query: 'warehouse conversion interior industrial chic',          label: 'Warehouse conversion' },
      { id: 'dark-iron',    query: 'industrial dark iron black metal interior design',       label: 'Dark iron' },
      { id: 'rustic-wood',  query: 'industrial rustic reclaimed wood interior Edison bulbs', label: 'Rustic reclaimed' },
      { id: 'minimal-raw',  query: 'industrial minimal raw materials interior light',        label: 'Minimal raw' },
    ]
  },
  {
    id: 'luxury',
    folder: 'luxury',
    references: [
      { id: 'marble-gold',  query: 'luxury interior marble floor gold chandelier opulent',  label: 'Marble and gold' },
      { id: 'velvet-dark',  query: 'luxury dark velvet interior rich jewel tones',          label: 'Dark velvet' },
      { id: 'white-luxury', query: 'luxury all white interior minimalist high end penthouse',label: 'White luxury' },
      { id: 'art-deco',     query: 'art deco luxury interior geometric gold glamorous',      label: 'Art deco' },
      { id: 'modern-luxury',query: 'modern luxury interior sleek premium materials',         label: 'Modern luxury' },
      { id: 'classic-grand',query: 'classic grand luxury interior high ceilings columns',    label: 'Classic grand' },
    ]
  },
  {
    id: 'bohemian',
    folder: 'bohemian',
    references: [
      { id: 'colorful',     query: 'bohemian colorful interior plants macrame eclectic',     label: 'Colorful boho' },
      { id: 'earthy-boho',  query: 'bohemian earthy tones interior rattan wicker natural',   label: 'Earthy boho' },
      { id: 'dark-boho',    query: 'bohemian dark moody interior rich colors dramatic',      label: 'Dark moody boho' },
      { id: 'desert-boho',  query: 'desert bohemian interior terracotta warm neutral',       label: 'Desert boho' },
      { id: 'global-boho',  query: 'global nomad bohemian interior mixed patterns travel',   label: 'Global nomad' },
      { id: 'minimal-boho', query: 'minimal bohemian interior white plants natural simple',  label: 'Minimal boho' },
    ]
  },
  {
    id: 'modern-minimalist',
    folder: 'modern-minimalist',
    references: [
      { id: 'all-white',    query: 'modern minimalist all white interior clean lines',       label: 'All white clean' },
      { id: 'warm-neutral', query: 'modern minimalist warm neutral interior beige tan',      label: 'Warm neutral' },
      { id: 'dark-minimal', query: 'modern minimalist dark interior charcoal grey sleek',    label: 'Dark minimal' },
      { id: 'wood-white',   query: 'modern minimalist wood white interior contemporary',     label: 'Wood and white' },
      { id: 'concrete-min', query: 'modern minimalist concrete interior architectural',       label: 'Concrete minimal' },
      { id: 'zen-modern',   query: 'modern zen minimalist interior calm serene',             label: 'Zen modern' },
    ]
  },
  {
    id: 'vastu-traditional',
    folder: 'vastu-traditional',
    references: [
      { id: 'warm-earth',   query: 'vastu compliant Indian home warm earth tones traditional', label: 'Warm earth' },
      { id: 'natural-wood', query: 'traditional Indian interior natural wood warm sunlight',    label: 'Natural wood' },
      { id: 'peaceful-home',query: 'peaceful Indian home interior simple natural materials',    label: 'Peaceful home' },
      { id: 'brass-lamp',   query: 'traditional Indian interior brass lamp temple corner warm', label: 'Brass lamp corner' },
      { id: 'courtyard',    query: 'Indian courtyard home interior natural light stone',        label: 'Courtyard light' },
      { id: 'south-indian', query: 'South Indian traditional home interior kolam rangoli',      label: 'South Indian' },
    ]
  },
];

// ─── Download helper ───────────────────────────────────────────────────────────

function downloadImage(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        resolve(false);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', () => resolve(false));
  });
}

// ─── Unsplash search ──────────────────────────────────────────────────────────

async function searchUnsplash(query: string): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.log('  [Unsplash] No API key — skipping web search');
    return null;
  }
  
  const encodedQuery = encodeURIComponent(query);
  const url = `https://api.unsplash.com/search/photos?query=${encodedQuery}&per_page=1&orientation=landscape&content_filter=high`;
  
  return new Promise((resolve) => {
    https.get(url, {
      headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const photo = json.results?.[0];
          if (photo?.urls?.regular) {
            resolve(photo.urls.regular + '&w=600&q=80');
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

// ─── ComfyUI generation fallback ─────────────────────────────────────────────

async function generateWithComfyUI(style: string, description: string, outputPath: string): Promise<boolean> {
  console.log(`  [ComfyUI] Generating: ${description}`);
  
  const prompt = {
    "3": {
      "class_type": "KSampler",
      "inputs": {
        "cfg": 7,
        "denoise": 1,
        "latent_image": ["5", 0],
        "model": ["4", 0],
        "negative": ["7", 0],
        "positive": ["6", 0],
        "sampler_name": "dpmpp_2m",
        "scheduler": "karras",
        "seed": Math.floor(Math.random() * 1000000),
        "steps": 20
      }
    },
    "4": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": "realisticVisionV51_v51VAE.safetensors" }
    },
    "5": {
      "class_type": "EmptyLatentImage",
      "inputs": { "batch_size": 1, "height": 512, "width": 768 }
    },
    "6": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "clip": ["4", 1],
        "text": `${description}, interior design, photorealistic, 8k, professional photography, beautiful lighting`
      }
    },
    "7": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "clip": ["4", 1],
        "text": "low quality, blurry, cartoon, unrealistic, dark, cluttered, people, faces"
      }
    },
    "8": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["3", 0], "vae": ["4", 2] }
    },
    "9": {
      "class_type": "SaveImage",
      "inputs": {
        "filename_prefix": `style_ref_${style}`,
        "images": ["8", 0]
      }
    }
  };

  try {
    const comfyUrl = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
    const res = await fetch(`${comfyUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    if (!res.ok) {
      console.log(`  [ComfyUI] Failed: ${res.status}`);
      return false;
    }
    
    const data = await res.json() as { prompt_id: string };
    const promptId = data.prompt_id;
    
    // Poll for completion
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const histRes = await fetch(`${comfyUrl}/history/${promptId}`);
      const hist = await histRes.json() as Record<string, any>;
      
      if (hist[promptId]?.outputs?.['9']?.images?.[0]) {
        const img = hist[promptId].outputs['9'].images[0];
        const imgUrl = `${comfyUrl}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`;
        return downloadImage(imgUrl, outputPath);
      }
    }
    
    console.log(`  [ComfyUI] Timeout waiting for generation`);
    return false;
  } catch (err) {
    console.log(`  [ComfyUI] Error:`, err);
    return false;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎨 Collecting style reference images...\n');
  
  let totalDownloaded = 0;
  let totalGenerated = 0;
  let totalFailed = 0;

  for (const style of STYLES) {
    const styleDir = path.join(OUTPUT_DIR, style.folder);
    fs.mkdirSync(styleDir, { recursive: true });
    
    console.log(`\n📁 ${style.id.toUpperCase()}`);
    
    for (const ref of style.references) {
      const outputPath = path.join(styleDir, `${ref.id}.jpg`);
      
      // Skip if already exists
      if (fs.existsSync(outputPath)) {
        console.log(`  ✅ Already exists: ${ref.id}`);
        totalDownloaded++;
        continue;
      }
      
      console.log(`  🔍 Searching: "${ref.query}"`);
      
      // Try Unsplash first
      const unsplashUrl = await searchUnsplash(ref.query);
      
      if (unsplashUrl) {
        const success = await downloadImage(unsplashUrl, outputPath);
        if (success) {
          console.log(`  ✅ Downloaded from Unsplash: ${ref.id}`);
          totalDownloaded++;
          continue;
        }
      }
      
      // Fall back to ComfyUI generation
      console.log(`  ⚡ Not found on Unsplash — generating with ComfyUI: ${ref.label}`);
      const generated = await generateWithComfyUI(style.id, ref.query, outputPath);
      
      if (generated) {
        console.log(`  ✅ Generated with ComfyUI: ${ref.id}`);
        totalGenerated++;
      } else {
        console.log(`  ❌ Failed: ${ref.id} — using placeholder`);
        // Create a simple colored placeholder
        fs.writeFileSync(outputPath + '.placeholder', ref.label);
        totalFailed++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 COLLECTION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Downloaded from web: ${totalDownloaded}`);
  console.log(`⚡ Generated with AI:  ${totalGenerated}`);
  console.log(`❌ Failed:             ${totalFailed}`);
  console.log(`📁 Total styles:       ${STYLES.length}`);
  console.log(`🖼  Total references:   ${STYLES.reduce((sum, s) => sum + s.references.length, 0)}`);
  console.log('='.repeat(50));

  // Generate manifest
  const manifest = STYLES.map(style => ({
    id: style.id,
    folder: style.folder,
    references: style.references.map(ref => ({
      id: ref.id,
      label: ref.label,
      imageUrl: `/style-references/${style.folder}/${ref.id}.jpg`,
      exists: fs.existsSync(path.join(OUTPUT_DIR, style.folder, `${ref.id}.jpg`))
    }))
  }));

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('\n✅ Manifest saved to public/style-references/manifest.json');
}

main().catch(console.error);
