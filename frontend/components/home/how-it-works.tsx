'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Users, Code, Trophy } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function HowItWorks() {
  const t = useTranslations('home.howItWorks')
  
  const steps = [
    {
      icon: <Search className="h-8 w-8 text-primary" />,
      title: t('steps.discover.title'),
      description: t('steps.discover.description')
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: t('steps.team.title'),
      description: t('steps.team.description')
    },
    {
      icon: <Code className="h-8 w-8 text-primary" />,
      title: t('steps.develop.title'),
      description: t('steps.develop.description')
    },
    {
      icon: <Trophy className="h-8 w-8 text-primary" />,
      title: t('steps.reward.title'),
      description: t('steps.reward.description')
    }
  ]
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{t('title')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="relative">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {step.icon}
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground text-sm">
                  {step.description}
                </p>
              </CardContent>
              
              {/* Step number */}
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-6 w-12 h-0.5 bg-border" />
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
