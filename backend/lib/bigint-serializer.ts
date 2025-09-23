/**
 * BigInt序列化工具
 * 解决JSON.stringify()无法序列化BigInt的问题
 */

/**
 * 递归序列化对象中的所有BigInt值为Number
 * @param obj 要序列化的对象
 * @returns 序列化后的对象
 */
export function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj
  
  // 处理BigInt类型
  if (typeof obj === 'bigint') {
    // 如果BigInt值超过Number.MAX_SAFE_INTEGER，转为字符串
    // 否则转为数字
    return obj > BigInt(Number.MAX_SAFE_INTEGER) ? obj.toString() : Number(obj)
  }
  
  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInt(item))
  }
  
  // 处理对象
  if (typeof obj === 'object') {
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value)
    }
    return result
  }
  
  // 其他类型直接返回
  return obj
}

/**
 * 为Next.js API Response准备数据，确保没有BigInt
 * @param data 要返回的数据
 * @returns 序列化后的数据
 */
export function prepareApiResponse<T>(data: T): T {
  return serializeBigInt(data)
}
