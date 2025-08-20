// 简单的日期格式化函数，替代 date-fns
export function format(date: Date, formatStr: string, options?: { locale?: any }) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  switch (formatStr) {
    case 'PPP':
      return `${year}�?{month}�?{day}日`
    case 'MM/dd':
      return `${month}/${day}`
    default:
      return date.toLocaleDateString('zh-CN')
  }
}

export const zhCN = {} // 占位�?
