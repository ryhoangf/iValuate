"use client"

import { Sparkles } from "lucide-react"

export default function HeroSection() {
  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center space-y-6">
          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
            Accurate used phone pricing{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              powered by AI
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Find the best prices from thousands of listings across e-commerce platforms. AI technology helps you make
            smart buying and selling decisions.
          </p>
        </div>
      </div>
    </section>
  )
}
