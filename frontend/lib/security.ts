'use client'

export interface SecurityRule {
  id: string
  name: string
  type: 'keyword' | 'regex' | 'url' | 'behavior'
  pattern: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  action: 'warn' | 'review' | 'block' | 'ban'
  enabled: boolean
  description: string
  createdAt: Date
  updatedAt: Date
}

export interface ModerationResult {
  isAllowed: boolean
  riskScore: number
  violations: Array<{
    ruleId: string
    ruleName: string
    severity: string
    matched: string
    suggestion: string
  }>
  action: 'approve' | 'review' | 'reject'
  reason?: string
}

export interface UserSecurityProfile {
  userId: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  trustScore: number
  verificationLevel: 'none' | 'email' | 'phone' | 'kyc'
  violations: SecurityViolation[]
  restrictions: UserRestriction[]
  lastActivity: Date
  accountAge: number
  behaviorScore: number
}

export interface SecurityViolation {
  id: string
  userId: string
  type: 'spam' | 'harassment' | 'inappropriate' | 'malicious' | 'fraud'
  severity: 'low' | 'medium' | 'high' | 'critical'
  content: string
  action: 'warning' | 'content_removal' | 'temporary_ban' | 'permanent_ban'
  createdAt: Date
  resolvedAt?: Date
  adminId?: string
  notes?: string
}

export interface UserRestriction {
  id: string
  userId: string
  type: 'post_limit' | 'comment_ban' | 'upload_ban' | 'full_ban'
  reason: string
  startDate: Date
  endDate?: Date
  isActive: boolean
}

class SecurityService {
  private rules: SecurityRule[] = [
    {
      id: '1',
      name: '垃圾邮件检测',
      type: 'keyword',
      pattern: '免费|赚钱|点击这里|立即购买|限时优惠',
      severity: 'medium',
      action: 'review',
      enabled: true,
      description: '检测常见的垃圾邮件关键词',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: '恶意链接检测',
      type: 'url',
      pattern: 'bit\\.ly|tinyurl|t\\.co',
      severity: 'high',
      action: 'block',
      enabled: true,
      description: '检测可疑的短链接',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '3',
      name: '不当言论检测',
      type: 'keyword',
      pattern: '仇恨|歧视|暴力|威胁',
      severity: 'critical',
      action: 'ban',
      enabled: true,
      description: '检测仇恨言论和不当内容',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '4',
      name: '个人信息泄露',
      type: 'regex',
      pattern: '\\d{11}|\\d{4}-\\d{4}-\\d{4}-\\d{4}',
      severity: 'high',
      action: 'review',
      enabled: true,
      description: '检测手机号码和信用卡号等敏感信息',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ]

  private userProfiles: Map<string, UserSecurityProfile> = new Map()
  private violations: SecurityViolation[] = []

  moderateContent(content: string, userId: string, contentType: 'post' | 'comment' | 'message'): ModerationResult {
    const violations: ModerationResult['violations'] = []
    let riskScore = 0

    for (const rule of this.rules.filter((r) => r.enabled)) {
      const matches = this.checkRule(content, rule)
      if (matches.length > 0) {
        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          matched: matches.join(', '),
          suggestion: this.getSuggestion(rule.type, rule.severity),
        })
        riskScore += this.getSeverityScore(rule.severity)
      }
    }

    const userProfile = this.getUserProfile(userId)
    const behaviorRisk = this.analyzeBehavior(userProfile, contentType)
    riskScore += behaviorRisk

    const action = this.determineAction(riskScore, violations)

    return {
      isAllowed: action === 'approve',
      riskScore,
      violations,
      action,
      reason: violations.length > 0 ? `检测到 ${violations.length} 个安全问题` : undefined,
    }
  }

  private checkRule(content: string, rule: SecurityRule): string[] {
    const matches: string[] = []

    try {
      switch (rule.type) {
        case 'keyword': {
          const keywords = rule.pattern.split('|')
          for (const keyword of keywords) {
            if (content.toLowerCase().includes(keyword.toLowerCase())) {
              matches.push(keyword)
            }
          }
          break
        }
        case 'regex': {
          const regex = new RegExp(rule.pattern, 'gi')
          const regexMatches = content.match(regex)
          if (regexMatches) matches.push(...regexMatches)
          break
        }
        case 'url': {
          const urlRegex = new RegExp(rule.pattern, 'gi')
          const urls = content.match(/https?:\/\/[^\s]+/g) || []
          for (const url of urls) {
            if (urlRegex.test(url)) matches.push(url)
          }
          break
        }
        case 'behavior':
          // 行为型规则：此处保留扩展点
          break
      }
    } catch (error) {
      console.error(`规则检查错误 ${rule.id}:`, error)
    }

    return matches
  }

  private getSeverityScore(severity: string): number {
    switch (severity) {
      case 'low':
        return 10
      case 'medium':
        return 25
      case 'high':
        return 50
      case 'critical':
        return 100
      default:
        return 0
    }
  }

  private analyzeBehavior(profile: UserSecurityProfile, contentType: string): number {
    let behaviorRisk = 0

    if (profile.accountAge < 7) behaviorRisk += 20

    const recentViolations = profile.violations.filter(
      (v) => Date.now() - v.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000
    )
    behaviorRisk += recentViolations.length * 15

    if (profile.trustScore < 50) behaviorRisk += 30

    if (profile.verificationLevel === 'none') behaviorRisk += 25

    return Math.min(behaviorRisk, 100)
  }

  private determineAction(
    riskScore: number,
    violations: ModerationResult['violations']
  ): 'approve' | 'review' | 'reject' {
    if (riskScore >= 80 || violations.some((v) => v.severity === 'critical')) {
      return 'reject'
    } else if (riskScore >= 40 || violations.some((v) => v.severity === 'high')) {
      return 'review'
    } else {
      return 'approve'
    }
  }

  private getSuggestion(type: string, severity: string): string {
    const suggestions = {
      keyword: '请避免使用可能被误解的词语',
      regex: '请检查是否包含敏感信息',
      url: '请使用可信的链接地址',
      behavior: '请注意发布频率和内容质量',
    }
    return suggestions[type as keyof typeof suggestions] || '请遵守社区规则'
  }

  getUserProfile(userId: string): UserSecurityProfile {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        userId,
        riskLevel: 'low',
        trustScore: 75,
        verificationLevel: 'email',
        violations: [],
        restrictions: [],
        lastActivity: new Date(),
        accountAge: Math.floor(Math.random() * 365),
        behaviorScore: 80,
      })
    }
    return this.userProfiles.get(userId)!
  }

  recordViolation(violation: Omit<SecurityViolation, 'id' | 'createdAt'>): void {
    const newViolation: SecurityViolation = {
      ...violation,
      id: Date.now().toString(),
      createdAt: new Date(),
    }
    this.violations.push(newViolation)

    const profile = this.getUserProfile(violation.userId)
    profile.violations.push(newViolation)
    this.updateUserRiskLevel(profile)
  }

  private updateUserRiskLevel(profile: UserSecurityProfile): void {
    const recentViolations = profile.violations.filter(
      (v) => Date.now() - v.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000
    )

    const criticalCount = recentViolations.filter((v) => v.severity === 'critical').length
    const highCount = recentViolations.filter((v) => v.severity === 'high').length

    if (criticalCount > 0 || highCount >= 3) {
      profile.riskLevel = 'critical'
      profile.trustScore = Math.max(0, profile.trustScore - 50)
    } else if (highCount > 0 || recentViolations.length >= 5) {
      profile.riskLevel = 'high'
      profile.trustScore = Math.max(0, profile.trustScore - 25)
    } else if (recentViolations.length >= 2) {
      profile.riskLevel = 'medium'
      profile.trustScore = Math.max(0, profile.trustScore - 10)
    }
  }

  getRules(): SecurityRule[] {
    return [...this.rules]
  }

  addRule(rule: Omit<SecurityRule, 'id' | 'createdAt' | 'updatedAt'>): void {
    const newRule: SecurityRule = {
      ...rule,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.rules.push(newRule)
  }

  updateRule(id: string, updates: Partial<SecurityRule>): boolean {
    const index = this.rules.findIndex((r) => r.id === id)
    if (index !== -1) {
      this.rules[index] = {
        ...this.rules[index],
        ...updates,
        updatedAt: new Date(),
      }
      return true
    }
    return false
  }

  deleteRule(id: string): boolean {
    const index = this.rules.findIndex((r) => r.id === id)
    if (index !== -1) {
      this.rules.splice(index, 1)
      return true
    }
    return false
  }

  getViolations(): SecurityViolation[] {
    return [...this.violations]
  }

  getUserViolations(userId: string): SecurityViolation[] {
    return this.violations.filter((v) => v.userId === userId)
  }

  getAllUserProfiles(): UserSecurityProfile[] {
    return Array.from(this.userProfiles.values())
  }

  batchProcessViolations(violationIds: string[], action: 'approve' | 'reject', adminId: string): void {
    for (const id of violationIds) {
      const violation = this.violations.find((v) => v.id === id)
      if (violation) {
        violation.resolvedAt = new Date()
        violation.adminId = adminId
        violation.notes = `批量处理: ${action}`
      }
    }
  }
}

export const securityService = new SecurityService()
