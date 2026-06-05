#!/bin/bash
# Download curated style reference images from Unsplash
# These are the IP-Adapter reference images shown in the style gallery

set -e

echo "🖼️  Creating style reference directories..."
mkdir -p public/style-references/{japandi,traditional-indian,scandinavian,industrial,luxury,bohemian,modern-minimalist,vastu-traditional}

echo "📥 Downloading Japandi references..."
curl -sL -o public/style-references/japandi/warm-wood.jpg     "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80"
curl -sL -o public/style-references/japandi/dark-zen.jpg      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80"
curl -sL -o public/style-references/japandi/natural-light.jpg "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80"
curl -sL -o public/style-references/japandi/stone-texture.jpg "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80"
curl -sL -o public/style-references/japandi/rattan-accents.jpg "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80"
curl -sL -o public/style-references/japandi/clay-palette.jpg  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80"

echo "📥 Downloading Traditional Indian references..."
curl -sL -o public/style-references/traditional-indian/rajasthani.jpg "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80"
curl -sL -o public/style-references/traditional-indian/kerala.jpg     "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=80"
curl -sL -o public/style-references/traditional-indian/mughal.jpg     "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=600&q=80"
curl -sL -o public/style-references/traditional-indian/gujarat.jpg    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80"
curl -sL -o public/style-references/traditional-indian/bengali.jpg    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80"
curl -sL -o public/style-references/traditional-indian/haveli.jpg     "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80"

echo "📥 Downloading Scandinavian references..."
curl -sL -o public/style-references/scandinavian/white-cozy.jpg      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80"
curl -sL -o public/style-references/scandinavian/grey-nordic.jpg     "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80"
curl -sL -o public/style-references/scandinavian/nature-inspired.jpg "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80"
curl -sL -o public/style-references/scandinavian/minimalist-black.jpg "https://images.unsplash.com/photo-1618219944342-824e40a13285?w=600&q=80"
curl -sL -o public/style-references/scandinavian/warm-hygge.jpg      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=600&q=80"

echo "📥 Downloading Industrial references..."
curl -sL -o public/style-references/industrial/raw-brick.jpg     "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=600&q=80"
curl -sL -o public/style-references/industrial/concrete-steel.jpg "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=600&q=80"
curl -sL -o public/style-references/industrial/dark-loft.jpg     "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80"
curl -sL -o public/style-references/industrial/warehouse.jpg     "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=600&q=80"
curl -sL -o public/style-references/industrial/steampunk.jpg     "https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=600&q=80"

echo "📥 Downloading Luxury references..."
curl -sL -o public/style-references/luxury/marble-gold.jpg          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80"
curl -sL -o public/style-references/luxury/dark-glamour.jpg         "https://images.unsplash.com/photo-1502005097973-6a7082348e28?w=600&q=80"
curl -sL -o public/style-references/luxury/french-chateau.jpg       "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=600&q=80"
curl -sL -o public/style-references/luxury/contemporary-luxury.jpg  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80"
curl -sL -o public/style-references/luxury/penthouse.jpg            "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=600&q=80"
curl -sL -o public/style-references/luxury/art-deco.jpg             "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600&q=80"

echo "📥 Downloading Bohemian references..."
curl -sL -o public/style-references/bohemian/colorful-plants.jpg "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80"
curl -sL -o public/style-references/bohemian/moroccan.jpg        "https://images.unsplash.com/photo-1577303935007-0d306ee638cf?w=600&q=80"
curl -sL -o public/style-references/bohemian/earthy-boho.jpg     "https://images.unsplash.com/photo-1617104678098-de229db51175?w=600&q=80"
curl -sL -o public/style-references/bohemian/vintage-eclectic.jpg "https://images.unsplash.com/photo-1614372284774-8b4a32ec1b71?w=600&q=80"
curl -sL -o public/style-references/bohemian/global-traveler.jpg  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80"

echo "📥 Downloading Modern Minimalist references..."
curl -sL -o public/style-references/modern-minimalist/white-clean.jpg    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80"
curl -sL -o public/style-references/modern-minimalist/warm-neutral.jpg   "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80"
curl -sL -o public/style-references/modern-minimalist/black-white.jpg    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80"
curl -sL -o public/style-references/modern-minimalist/concrete-minimal.jpg "https://images.unsplash.com/photo-1618219944342-824e40a13285?w=600&q=80"
curl -sL -o public/style-references/modern-minimalist/japandi-modern.jpg  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80"

echo "📥 Downloading Vastu Traditional references..."
curl -sL -o public/style-references/vastu-traditional/warm-earth.jpg  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80"
curl -sL -o public/style-references/vastu-traditional/wood-temple.jpg "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80"
curl -sL -o public/style-references/vastu-traditional/green-harmony.jpg "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=600&q=80"
curl -sL -o public/style-references/vastu-traditional/white-serene.jpg  "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80"

echo ""
echo "✅ Style references downloaded!"
echo ""
echo "File counts per directory:"
for dir in public/style-references/*/; do
  count=$(ls "$dir" 2>/dev/null | wc -l)
  echo "  $(basename $dir): $count files"
done
