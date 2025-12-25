// app/(marketing)/blog/page.tsx
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { 
  Search, 
  Calendar, 
  Clock, 
  User, 
  ArrowRight, 
  Tag,
  TrendingUp,
  Sparkles,
  BookOpen,
  Compass,
  IndianRupee,
  Home,
  Lightbulb,
  Palette,
  Building,
  ChevronLeft,
  ChevronRight,
  Mail,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

// Categories data
const categories = [
  { id: "all", name: "All Posts", icon: BookOpen, count: 24 },
  { id: "design-tips", name: "Design Tips", icon: Palette, count: 8 },
  { id: "vastu", name: "Vastu Shastra", icon: Compass, count: 6 },
  { id: "renovation", name: "Renovation", icon: Building, count: 5 },
  { id: "trends", name: "Trends 2025", icon: TrendingUp, count: 3 },
  { id: "budget", name: "Budget Guide", icon: IndianRupee, count: 2 }
];

// Blog posts data
const blogPosts = [
  {
    id: "1",
    slug: "complete-vastu-guide-indian-homes-2025",
    title: "The Complete Vastu Shastra Guide for Indian Homes in 2025",
    excerpt: "Discover how ancient Vastu principles can transform your modern living space. Learn the essential rules for each room and direction.",
    coverImage: "/images/blog/vastu-guide.jpg",
    category: "vastu",
    author: {
      name: "Dr. Rajesh Kumar",
      avatar: "/images/team/rajesh.jpg",
      role: "Vastu Expert"
    },
    publishedAt: "2025-01-15",
    readTime: "12 min read",
    featured: true,
    tags: ["Vastu", "Home Design", "Indian Architecture"]
  },
  {
    id: "2",
    slug: "ai-interior-design-revolution",
    title: "How AI is Revolutionizing Interior Design in India",
    excerpt: "From concept to visualization in seconds. Explore how artificial intelligence is making professional design accessible to everyone.",
    coverImage: "/images/blog/ai-design.jpg",
    category: "trends",
    author: {
      name: "Priya Patel",
      avatar: "/images/team/priya.jpg",
      role: "CTO"
    },
    publishedAt: "2025-01-12",
    readTime: "8 min read",
    featured: true,
    tags: ["AI", "Technology", "Interior Design"]
  },
  {
    id: "3",
    slug: "budget-friendly-living-room-makeover",
    title: "Budget-Friendly Living Room Makeover: Under ₹50,000",
    excerpt: "Transform your living room without breaking the bank. Smart tips and tricks for a stunning makeover on an Indian budget.",
    coverImage: "/images/blog/budget-makeover.jpg",
    category: "budget",
    author: {
      name: "Ananya Singh",
      avatar: "/images/team/ananya.jpg",
      role: "Design Lead"
    },
    publishedAt: "2025-01-10",
    readTime: "6 min read",
    featured: true,
    tags: ["Budget", "Living Room", "DIY"]
  },
  {
    id: "4",
    slug: "kitchen-vastu-tips-prosperity",
    title: "Kitchen Vastu: 15 Tips for Health and Prosperity",
    excerpt: "The kitchen is the heart of Indian homes. Learn how to design a Vastu-compliant kitchen that promotes health and abundance.",
    coverImage: "/images/blog/kitchen-vastu.jpg",
    category: "vastu",
    author: {
      name: "Dr. Rajesh Kumar",
      avatar: "/images/team/rajesh.jpg",
      role: "Vastu Expert"
    },
    publishedAt: "2025-01-08",
    readTime: "10 min read",
    featured: false,
    tags: ["Vastu", "Kitchen", "Health"]
  },
  {
    id: "5",
    slug: "modern-pooja-room-design-ideas",
    title: "25 Modern Pooja Room Design Ideas for Indian Homes",
    excerpt: "Create a sacred space that blends tradition with contemporary aesthetics. From compact apartments to spacious villas.",
    coverImage: "/images/blog/pooja-room.jpg",
    category: "design-tips",
    author: {
      name: "Vikram Reddy",
      avatar: "/images/team/vikram.jpg",
      role: "Head of Design"
    },
    publishedAt: "2025-01-05",
    readTime: "9 min read",
    featured: false,
    tags: ["Pooja Room", "Traditional", "Modern"]
  },
  {
    id: "6",
    slug: "2025-interior-design-trends-india",
    title: "Top 10 Interior Design Trends Dominating India in 2025",
    excerpt: "From earthy tones to smart home integration. Discover what's trending in Indian interior design this year.",
    coverImage: "/images/blog/trends-2025.jpg",
    category: "trends",
    author: {
      name: "Priya Patel",
      avatar: "/images/team/priya.jpg",
      role: "CTO"
    },
    publishedAt: "2025-01-03",
    readTime: "7 min read",
    featured: false,
    tags: ["Trends", "2025", "Interior Design"]
  },
  {
    id: "7",
    slug: "bedroom-colors-better-sleep",
    title: "Best Bedroom Colors for Better Sleep According to Vastu",
    excerpt: "The right color can transform your sleep quality. Learn which colors promote rest and which to avoid.",
    coverImage: "/images/blog/bedroom-colors.jpg",
    category: "vastu",
    author: {
      name: "Dr. Rajesh Kumar",
      avatar: "/images/team/rajesh.jpg",
      role: "Vastu Expert"
    },
    publishedAt: "2025-01-01",
    readTime: "5 min read",
    featured: false,
    tags: ["Bedroom", "Colors", "Vastu"]
  },
  {
    id: "8",
    slug: "small-apartment-space-saving-hacks",
    title: "20 Space-Saving Hacks for Small Indian Apartments",
    excerpt: "Make the most of your compact living space with these clever design solutions and furniture ideas.",
    coverImage: "/images/blog/small-apartment.jpg",
    category: "design-tips",
    author: {
      name: "Ananya Singh",
      avatar: "/images/team/ananya.jpg",
      role: "Design Lead"
    },
    publishedAt: "2024-12-28",
    readTime: "8 min read",
    featured: false,
    tags: ["Small Space", "Apartment", "Hacks"]
  },
  {
    id: "9",
    slug: "renovation-cost-guide-indian-cities",
    title: "Complete Renovation Cost Guide for Major Indian Cities",
    excerpt: "Mumbai vs Bangalore vs Delhi - Compare renovation costs city-wise. Materials, labor, and hidden expenses explained.",
    coverImage: "/images/blog/renovation-cost.jpg",
    category: "renovation",
    author: {
      name: "Arjun Sharma",
      avatar: "/images/team/arjun.jpg",
      role: "CEO"
    },
    publishedAt: "2024-12-25",
    readTime: "15 min read",
    featured: false,
    tags: ["Renovation", "Cost", "Cities"]
  },
  {
    id: "10",
    slug: "balcony-garden-design-ideas",
    title: "Transform Your Balcony into a Green Paradise",
    excerpt: "From vertical gardens to cozy seating areas. Design ideas for Indian balconies of all sizes.",
    coverImage: "/images/blog/balcony-garden.jpg",
    category: "design-tips",
    author: {
      name: "Vikram Reddy",
      avatar: "/images/team/vikram.jpg",
      role: "Head of Design"
    },
    publishedAt: "2024-12-22",
    readTime: "6 min read",
    featured: false,
    tags: ["Balcony", "Garden", "Outdoor"]
  },
  {
    id: "11",
    slug: "choosing-right-flooring-indian-climate",
    title: "Choosing the Right Flooring for Indian Climate",
    excerpt: "Marble vs Vitrified vs Wood - Which flooring works best for your city's weather? A comprehensive comparison.",
    coverImage: "/images/blog/flooring.jpg",
    category: "renovation",
    author: {
      name: "Arjun Sharma",
      avatar: "/images/team/arjun.jpg",
      role: "CEO"
    },
    publishedAt: "2024-12-20",
    readTime: "10 min read",
    featured: false,
    tags: ["Flooring", "Materials", "Climate"]
  },
  {
    id: "12",
    slug: "entrance-vastu-first-impressions",
    title: "Main Entrance Vastu: Creating Positive First Impressions",
    excerpt: "Your entrance sets the energy for your entire home. Learn the do's and don'ts of entrance design.",
    coverImage: "/images/blog/entrance-vastu.jpg",
    category: "vastu",
    author: {
      name: "Dr. Rajesh Kumar",
      avatar: "/images/team/rajesh.jpg",
      role: "Vastu Expert"
    },
    publishedAt: "2024-12-18",
    readTime: "7 min read",
    featured: false,
    tags: ["Entrance", "Vastu", "Energy"]
  }
];

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { 
    day: 'numeric',
    month: 'long', 
    year: 'numeric' 
  });
};

// Get category color
const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    "vastu": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    "design-tips": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "renovation": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    "trends": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    "budget": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  };
  return colors[category] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
};

// Get category name
const getCategoryName = (categoryId: string) => {
  const category = categories.find(c => c.id === categoryId);
  return category?.name || categoryId;
};

// Blog Card Component
const BlogCard = ({ post, index }: { post: typeof blogPosts[0]; index: number }) => {
  return (
    <motion.div
      variants={scaleIn}
      layout
    >
      <Link href={`/blog/${post.slug}`}>
        <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 group border-2 hover:border-violet-300 dark:hover:border-violet-700">
          {/* Image */}
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-violet-400 to-orange-400">
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-white/50" />
            </div>
            {/* Category badge */}
            <div className="absolute top-4 left-4 z-10">
              <Badge className={getCategoryColor(post.category)}>
                {getCategoryName(post.category)}
              </Badge>
            </div>
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>

          <CardContent className="p-5">
            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(post.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {post.readTime}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">
              {post.title}
            </h3>

            {/* Excerpt */}
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
              {post.excerpt}
            </p>

            {/* Author */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                {post.author.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {post.author.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {post.author.role}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

// Featured Post Card Component
const FeaturedPostCard = ({ post }: { post: typeof blogPosts[0] }) => {
  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="h-full overflow-hidden hover:shadow-2xl transition-all duration-300 group border-2 hover:border-violet-300 dark:hover:border-violet-700">
        <div className="grid md:grid-cols-2 h-full">
          {/* Image */}
          <div className="relative h-64 md:h-full overflow-hidden bg-gradient-to-br from-violet-500 to-orange-500">
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-white/50" />
            </div>
            {/* Featured badge */}
            <div className="absolute top-4 left-4 z-10">
              <Badge className="bg-white text-violet-700">
                <Sparkles className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>

          {/* Content */}
          <CardContent className="p-8 flex flex-col justify-center">
            <Badge className={`${getCategoryColor(post.category)} w-fit mb-4`}>
              {getCategoryName(post.category)}
            </Badge>

            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              {post.title}
            </h2>

            <p className="text-slate-600 dark:text-slate-400 mb-6 line-clamp-3">
              {post.excerpt}
            </p>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(post.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
            </div>

            {/* Author */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                  {post.author.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {post.author.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {post.author.role}
                  </p>
                </div>
              </div>

              <Button variant="ghost" className="group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30">
                Read More
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
};

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  // Filter posts based on search and category
  const filteredPosts = useMemo(() => {
    return blogPosts.filter(post => {
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = activeCategory === "all" || post.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  // Featured posts (first 3)
  const featuredPosts = blogPosts.filter(post => post.featured).slice(0, 3);

  // Paginated posts
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  // Reset to page 1 when filters change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                <BookOpen className="w-3 h-3 mr-1" />
                Removation Blog
              </Badge>
            </motion.div>

            <motion.h1 
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-violet-700 to-orange-600 dark:from-white dark:via-violet-400 dark:to-orange-400 bg-clip-text text-transparent"
            >
              Design Insights &
              <br />
              Vastu Wisdom
            </motion.h1>

            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto"
            >
              Expert tips, trending ideas, and ancient wisdom to help you create 
              the perfect home. Updated weekly with fresh content.
            </motion.p>

            {/* Search Bar */}
            <motion.div 
              variants={fadeInUp}
              className="max-w-xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  className="pl-12 pr-4 py-6 text-lg rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="sticky top-16 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="overflow-x-auto scrollbar-hide py-4">
            <div className="flex gap-2 min-w-max">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleCategoryChange(category.id)}
                  className={`rounded-full ${
                    activeCategory === category.id 
                      ? "bg-violet-600 hover:bg-violet-700 text-white" 
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <category.icon className="w-4 h-4 mr-1.5" />
                  {category.name}
                  <Badge 
                    variant="secondary" 
                    className={`ml-2 ${
                      activeCategory === category.id 
                        ? "bg-white/20 text-white" 
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {activeCategory === "all" && !searchQuery && (
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="flex items-center justify-between mb-8"
            >
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  Featured Articles
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Our top picks for you
                </p>
              </div>
              <Button variant="ghost" asChild>
                <Link href="#all-posts">
                  View All
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="space-y-6"
            >
              {/* Main Featured */}
              <motion.div variants={scaleIn}>
                <FeaturedPostCard post={featuredPosts[0]} />
              </motion.div>

              {/* Secondary Featured */}
              <div className="grid md:grid-cols-2 gap-6">
                {featuredPosts.slice(1, 3).map((post) => (
                  <motion.div key={post.id} variants={scaleIn}>
                    <BlogCard post={post} index={0} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* All Posts Grid */}
      <section id="all-posts" className="py-12 lg:py-16 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {activeCategory === "all" ? "All Articles" : getCategoryName(activeCategory)}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
          </motion.div>

          {/* Posts Grid */}
          <AnimatePresence mode="wait">
            {paginatedPosts.length > 0 ? (
              <motion.div
                key={`${activeCategory}-${currentPage}`}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={staggerContainer}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {paginatedPosts.map((post, index) => (
                  <BlogCard key={post.id} post={post} index={index} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="text-center py-16"
              >
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  No articles found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                >
                  Clear Filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="flex items-center justify-center gap-2 mt-12"
            >
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? "bg-violet-600 hover:bg-violet-700" : ""}
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Popular Tags */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-2xl mx-auto mb-8"
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Popular Topics
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Explore articles by topic
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-3"
          >
            {["Vastu", "Living Room", "Kitchen", "Bedroom", "Modern", "Traditional", 
              "Budget", "Luxury", "Small Space", "Colors", "Furniture", "Lighting",
              "Pooja Room", "Balcony", "Renovation", "DIY", "Trends 2025"].map((tag) => (
              <motion.div key={tag} variants={scaleIn}>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full hover:bg-violet-100 hover:text-violet-700 hover:border-violet-300 dark:hover:bg-violet-900/30 dark:hover:text-violet-300"
                  onClick={() => setSearchQuery(tag)}
                >
                  <Tag className="w-3 h-3 mr-1.5" />
                  {tag}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-violet-600 via-violet-700 to-orange-600 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-2xl mx-auto text-center text-white"
          >
            <motion.div variants={fadeInUp}>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
                <Bell className="w-8 h-8" />
              </div>
            </motion.div>

            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Stay Updated
            </motion.h2>

            <motion.p 
              variants={fadeInUp}
              className="text-lg opacity-90 mb-8"
            >
              Get the latest design tips, Vastu insights, and renovation guides 
              delivered to your inbox every week.
            </motion.p>

            <motion.form 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="pl-12 py-6 bg-white text-slate-900 border-0 rounded-xl"
                />
              </div>
              <Button 
                type="submit"
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 rounded-xl"
              >
                Subscribe
              </Button>
            </motion.form>

            <motion.p 
              variants={fadeInUp}
              className="mt-4 text-sm opacity-70"
            >
              No spam, unsubscribe anytime. 10,000+ subscribers already.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl" />

              <CardContent className="p-8 md:p-12 relative z-10">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <motion.div variants={fadeInUp}>
                    <Badge className="bg-violet-500 text-white mb-4">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Try Removation.ai
                    </Badge>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">
                      Turn Inspiration into Reality
                    </h3>
                    <p className="text-slate-300 mb-6">
                      Loved what you read? Now transform your own space with 
                      AI-powered design and Vastu analysis.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        size="lg"
                        className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700"
                        asChild
                      >
                        <Link href="/sign-up">
                          Start Free
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                      </Button>
                      <Button 
                        size="lg" 
                        variant="outline"
                        className="border-slate-600 text-white hover:bg-slate-700"
                        asChild
                      >
                        <Link href="/features">
                          See Features
                        </Link>
                      </Button>
                    </div>
                  </motion.div>

                  <motion.div 
                    variants={fadeInUp}
                    className="hidden md:flex justify-center"
                  >
                    <div className="relative w-48 h-48">
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-orange-500 rounded-3xl rotate-6" />
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-violet-500 rounded-3xl -rotate-6 opacity-50" />
                      <div className="absolute inset-4 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
                        <Home className="w-16 h-16 text-white" />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}