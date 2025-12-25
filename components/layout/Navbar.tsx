"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Menu, 
  X, 
  ChevronDown,
  Sparkles,
  Home,
  Layers,
  CreditCard,
  Info,
  Mail,
  BookOpen
} from "lucide-react"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/Logo"
import { LanguageToggle } from "@/components/shared/LanguageToggle"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

const features = [
  {
    title: "AI Room Redesign",
    description: "Transform any room with AI-powered design",
    href: "/features#redesign",
    icon: Sparkles,
  },
  {
    title: "Vastu Analysis",
    description: "Get Vastu score and recommendations",
    href: "/features#vastu",
    icon: Home,
  },
  {
    title: "Cost Calculator",
    description: "Real-time renovation cost estimates",
    href: "/features#cost",
    icon: CreditCard,
  },
  {
    title: "Style Library",
    description: "400+ design styles to choose from",
    href: "/features#styles",
    icon: Layers,
  },
]

const resources = [
  {
    title: "Blog",
    description: "Design tips and inspiration",
    href: "/blog",
    icon: BookOpen,
  },
  {
    title: "About Us",
    description: "Learn about our mission",
    href: "/about",
    icon: Info,
  },
  {
    title: "Contact",
    description: "Get in touch with us",
    href: "/contact",
    icon: Mail,
  },
]

export function Navbar() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-background/80 backdrop-blur-xl border-b shadow-sm"
            : "bg-transparent"
        )}
      >
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList>
                {/* Features Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent">
                    Features
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                      {features.map((feature) => (
                        <li key={feature.title}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={feature.href}
                              className="block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            >
                              <div className="flex items-center gap-2">
                                <feature.icon className="h-4 w-4 text-primary" />
                                <div className="text-sm font-medium leading-none">
                                  {feature.title}
                                </div>
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {feature.description}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Pricing */}
                <NavigationMenuItem>
                  <Link href="/pricing" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                        pathname === "/pricing" && "bg-accent/50"
                      )}
                    >
                      Pricing
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                {/* Resources Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent">
                    Resources
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[300px] gap-3 p-4">
                      {resources.map((resource) => (
                        <li key={resource.title}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={resource.href}
                              className="block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            >
                              <div className="flex items-center gap-2">
                                <resource.icon className="h-4 w-4 text-primary" />
                                <div className="text-sm font-medium leading-none">
                                  {resource.title}
                                </div>
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {resource.description}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <LanguageToggle />
            
            <SignedOut>
              <Link href="/sign-in" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="gradient" size="sm">
                  Get Started Free
                </Button>
              </Link>
            </SignedOut>

            <SignedIn>
              <Link href="/dashboard">
                <Button variant="gradient" size="sm">
                  Dashboard
                </Button>
              </Link>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8"
                  }
                }}
              />
            </SignedIn>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 lg:hidden bg-background/95 backdrop-blur-xl border-b shadow-lg"
          >
            <div className="container mx-auto px-4 py-6 space-y-6">
              {/* Features */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Features</h3>
                <div className="grid gap-2">
                  {features.map((feature) => (
                    <Link
                      key={feature.title}
                      href={feature.href}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <feature.icon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{feature.title}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Resources</h3>
                <div className="grid gap-2">
                  {resources.map((resource) => (
                    <Link
                      key={resource.title}
                      href={resource.href}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <resource.icon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{resource.title}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <Link
                href="/pricing"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="font-medium">Pricing</span>
              </Link>

              {/* Auth Buttons for Mobile */}
              <SignedOut>
                <div className="flex flex-col gap-2 pt-4 border-t">
                  <Link href="/sign-in">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button variant="gradient" className="w-full">
                      Get Started Free
                    </Button>
                  </Link>
                </div>
              </SignedOut>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Navigation Menu Components (inline since they're specific to navbar)
const NavigationMenuComponent = NavigationMenu
const navigationMenuTriggerStyle = () =>
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"

// Re-export NavigationMenu components
import {
  NavigationMenu as NavigationMenuBase,
  NavigationMenuContent as NavigationMenuContentBase,
  NavigationMenuItem as NavigationMenuItemBase,
  NavigationMenuLink as NavigationMenuLinkBase,
  NavigationMenuList as NavigationMenuListBase,
  NavigationMenuTrigger as NavigationMenuTriggerBase,
} from "@radix-ui/react-navigation-menu"

export { Navbar as default }