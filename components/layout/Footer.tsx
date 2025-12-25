"use client"

import * as React from "react"
import Link from "next/link"
import { 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  Mail,
  MapPin,
  Phone
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Logo } from "@/components/shared/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "AI Redesign", href: "/features#redesign" },
      { label: "Vastu Analysis", href: "/features#vastu" },
      { label: "Cost Calculator", href: "/features#cost" },
      { label: "Chrome Extension", href: "/extension" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Press Kit", href: "/press" },
      { label: "Contact", href: "/contact" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Documentation", href: "/docs" },
      { label: "API", href: "/api" },
      { label: "Community", href: "/community" },
      { label: "Tutorials", href: "/tutorials" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Refund Policy", href: "/refund" },
    ],
  },
}

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/removationai", label: "Twitter" },
  { icon: Instagram, href: "https://instagram.com/removationai", label: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com/company/removationai", label: "LinkedIn" },
  { icon: Youtube, href: "https://youtube.com/@removationai", label: "YouTube" },
]

export function Footer() {
  const [email, setEmail] = React.useState("")

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle newsletter subscription
    console.log("Subscribe:", email)
    setEmail("")
  }

  return (
    <footer className="bg-muted/30 border-t">
      {/* Newsletter Section */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold">Stay Updated</h3>
              <p className="text-muted-foreground mt-1">
                Get the latest design tips and product updates
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-2 w-full max-w-md">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" variant="gradient">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="inline-block">
              <Logo className="h-8 w-auto" />
            </Link>
            <p className="mt-4 text-muted-foreground max-w-xs">
              Transform your living spaces with AI-powered interior design. 
              India&apos;s first Vastu-compliant design platform.
            </p>
            
            {/* Contact Info */}
            <div className="mt-6 space-y-2">
              <a 
                href="mailto:hello@removation.ai"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                hello@removation.ai
              </a>
              <a 
                href="tel:+919876543210"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-4 w-4" />
                +91 98765 43210
              </a>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Bangalore, India
              </p>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Removation.ai. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Made with ❤️ in India
              </span>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <img
                  src="/images/payment/upi.svg"
                  alt="UPI"
                  className="h-6"
                />
                <img
                  src="/images/payment/visa.svg"
                  alt="Visa"
                  className="h-6"
                />
                <img
                  src="/images/payment/mastercard.svg"
                  alt="Mastercard"
                  className="h-6"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export { Footer as default }