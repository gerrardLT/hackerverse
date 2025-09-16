'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function StyleShowcase() {
  return (
    <div className="container py-12 space-y-12">
      {/* Color System Demo */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-gradient">OKLCH Color System</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-20 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-medium">Primary</div>
          <div className="h-20 bg-secondary rounded-lg flex items-center justify-center text-secondary-foreground font-medium">Secondary</div>
          <div className="h-20 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-medium">Accent</div>
          <div className="h-20 bg-muted rounded-lg flex items-center justify-center text-muted-foreground font-medium">Muted</div>
        </div>
      </section>

      {/* Animation Demo */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-shimmer">Modern Animation System</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="text-sm">Float Animation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-gradient-primary rounded-lg animate-float"></div>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardHeader>
              <CardTitle className="text-sm">Glow Effect</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-primary rounded-lg animate-glow"></div>
            </CardContent>
          </Card>

          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle className="text-sm">Scale In</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-secondary rounded-lg animate-pulse-slow"></div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="text-sm">Slide Up</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-accent rounded-lg animate-bounce-gentle"></div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Glassmorphism Demo */}
      <section className="space-y-6 relative min-h-[300px] gradient-mesh rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-white">Glassmorphism Effects</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Glass Card</CardTitle>
              <CardDescription>Basic glassmorphism effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Beautiful transparency with backdrop blur</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Enhanced Glass</CardTitle>
              <CardDescription>Advanced glassmorphism</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Enhanced blur and transparency effects</p>
            </CardContent>
          </Card>

          <Card className="glass-nav">
            <CardHeader>
              <CardTitle>Navigation Glass</CardTitle>
              <CardDescription>Navigation-style glass</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Perfect for floating navigation bars</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Interactive Elements */}
      <section className="space-y-6">
        <h2 className="text-responsive-lg font-bold">Interactive Elements</h2>
        <div className="flex flex-wrap gap-4">
          <Button className="animate-slide-in">Primary Button</Button>
          <Button variant="secondary" className="hover-lift">Secondary Button</Button>
          <Button variant="outline" className="hover-glow">Outline Button</Button>
          <Button variant="ghost" className="animate-fade-in">Ghost Button</Button>
        </div>
      </section>

      {/* Typography Demo */}
      <section className="space-y-6">
        <h1 className="text-responsive-xl font-bold text-gradient">
          Modern Typography System
        </h1>
        <div className="space-y-4">
          <p className="text-responsive-lg text-shimmer">
            Large responsive text with shimmer effect
          </p>
          <p className="text-responsive-md text-muted-foreground">
            Medium responsive text for subtitles and descriptions
          </p>
          <p className="text-balance leading-relaxed">
            This text uses the text-balance utility for better readability and 
            visual harmony. The OKLCH color system provides better perceptual 
            uniformity across different devices and viewing conditions.
          </p>
        </div>
      </section>

      {/* Status Indicator */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">System Status</h2>
        <Card className="glass border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent rounded-full animate-pulse-slow"></div>
              Global Style System Upgraded
            </CardTitle>
            <CardDescription>
              ✅ OKLCH color space implemented<br/>
              ✅ Modern animation library added<br/>
              ✅ Glassmorphism effects ready<br/>
              ✅ Enhanced responsive typography<br/>
              ✅ Interactive states optimized
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  )
}
