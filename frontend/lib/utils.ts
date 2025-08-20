import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化验证错误信息
export function formatValidationError(error: any): string {
  if (!error) return '未知错误'
  
  // 如果是字符串，直接返回
  if (typeof error === 'string') return error
  
  // 如果是验证错误数组
  if (Array.isArray(error)) {
    if (error.length > 0) {
      const firstError = error[0]
      return firstError.message || `${firstError.path?.join('.')} 验证失败`
    }
    return '数据验证失败'
  }
  
  // 如果是对象
  if (typeof error === 'object') {
    // 优先处理details中的具体错误信息
    if (error.details) {
      return formatValidationError(error.details)
    }
    if (error.message) return error.message
    if (error.error) return error.error
  }
  
  return '未知错误'
}

// 获取字段名称的中文映射
export function getFieldName(fieldPath: string[]): string {
  const fieldMap: Record<string, string> = {
    'title': '标题',
    'description': '描述',
    'startDate': '开始时间',
    'endDate': '结束时间',
    'registrationDeadline': '报名截止时间',
    'maxParticipants': '最大参与人数',
    'prizePool': '奖金池',
    'categories': '分类',
    'tags': '标签',
    'requirements': '参与要求',
    'rules': '活动规则',
    'prizes': '奖项设置',
    'tracks': '赛道设置',
    'judgingCriteria': '评审标准'
  }
  
  const field = fieldPath[fieldPath.length - 1]
  return fieldMap[field] || field
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getDaysUntil(date: string | Date) {
  const targetDate = new Date(date)
  const now = new Date()
  const diffTime = targetDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function formatPrize(amount: string) {
  // Simple prize formatting
  return amount
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
