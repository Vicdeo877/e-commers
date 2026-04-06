"use client";

import Link from "next/link";
import { Leaf, MapPin, Phone, Mail } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function Footer() {
  const { settings } = useSiteSettings();

  const siteName = settings?.site_name || "BlissFruitz";
  const email = settings?.contact_email || "support@blissfruitz.com";
  const phone = settings?.contact_phone || "+91 98765 43210";
  const address = settings?.address || "123 New Street, Fruit City";

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-8 text-center sm:text-left">
        {/* Brand */}
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-2 text-white font-bold text-lg mb-3">
            <Leaf className="w-5 h-5 text-primary" />
            <span>{siteName}</span>
          </div>
          <p className="text-sm leading-relaxed">
            Bringing nature&apos;s finest fruits directly to your table. Committed to quality, freshness, and sustainability.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><Link href="/shop" className="hover:text-primary transition-colors">Shop All</Link></li>
            <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
          </ul>
        </div>

        {/* Customer Service */}
        <div>
          <h4 className="text-white font-semibold mb-3">Customer Service</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/terms" className="hover:text-primary transition-colors">Terms &amp; Conditions</Link></li>
            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            <li><Link href="/shipping" className="hover:text-primary transition-colors">Shipping Info</Link></li>
            <li><Link href="/returns" className="hover:text-primary transition-colors">Returns Policy</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold mb-4">Contact Us</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start justify-center sm:justify-start gap-3">
              <MapPin className="w-4 h-4 mt-1 text-primary shrink-0" />
              <span className="max-w-[200px] sm:max-w-none">{address}</span>
            </li>
            <li className="flex items-center justify-center sm:justify-start gap-3">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <span>{phone}</span>
            </li>
            <li className="flex items-center justify-center sm:justify-start gap-3">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <span className="break-all">{email}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 text-center text-xs py-4 text-gray-500">
        © {new Date().getFullYear()} {siteName}. All rights reserved.
      </div>
    </footer>
  );
}
