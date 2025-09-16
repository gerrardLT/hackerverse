import { NextResponse } from 'next/server'

// 统一API响应接口
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  code?: string
  details?: any
}

// 错误代码枚举
export enum ErrorCode {
  // 认证相关
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // 权限相关
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // 资源相关
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // 验证相关
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // 业务逻辑相关
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // 系统相关
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // 网络相关
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

/**
 * API响应工具类
 * 提供统一的响应格式和错误处理
 */
export class ApiResponseHandler {
  /**
   * 成功响应
   */
  static success<T>(data?: T, message?: string): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data
    }
    return NextResponse.json(response, { status: 200 })
  }

  /**
   * 创建成功响应
   */
  static created<T>(data?: T, message?: string): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      message: message || '创建成功',
      data
    }
    return NextResponse.json(response, { status: 201 })
  }

  /**
   * 无内容响应
   */
  static noContent(message?: string): NextResponse {
    const response: ApiResponse = {
      success: true,
      message: message || '操作成功'
    }
    return NextResponse.json(response, { status: 204 })
  }

  /**
   * 客户端错误响应 (400)
   */
  static badRequest(
    error: string, 
    code?: ErrorCode, 
    details?: any
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error,
      code: code || ErrorCode.INVALID_INPUT,
      details
    }
    return NextResponse.json(response, { status: 400 })
  }

  /**
   * 未认证响应 (401)
   */
  static unauthorized(
    error: string = '未认证', 
    code?: ErrorCode
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error,
      code: code || ErrorCode.UNAUTHORIZED
    }
    return NextResponse.json(response, { status: 401 })
  }

  /**
   * 禁止访问响应 (403)
   */
  static forbidden(
    error: string = '禁止访问', 
    code?: ErrorCode
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error,
      code: code || ErrorCode.FORBIDDEN
    }
    return NextResponse.json(response, { status: 403 })
  }

  /**
   * 资源不存在响应 (404)
   */
  static notFound(
    error: string = '资源不存在', 
    code?: ErrorCode
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error,
      code: code || ErrorCode.NOT_FOUND
    }
    return NextResponse.json(response, { status: 404 })
  }

  /**
   * 资源冲突响应 (409)
   */
  static conflict(
    error: string, 
    code?: ErrorCode, 
    details?: any
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error,
      code: code || ErrorCode.RESOURCE_CONFLICT,
      details
    }
    return NextResponse.json(response, { status: 409 })
  }

  /**
   * 验证错误响应 (422)
   */
  static validationError(
    error: string, 
    details?: any
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error,
      code: ErrorCode.VALIDATION_ERROR,
      details
    }
    return NextResponse.json(response, { status: 422 })
  }

  /**
   * 服务器内部错误响应 (500)
   */
  static internalError(
    error: string = '服务器内部错误', 
    code?: ErrorCode,
    details?: any
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error,
      code: code || ErrorCode.INTERNAL_SERVER_ERROR,
      details
    }
    return NextResponse.json(response, { status: 500 })
  }

  /**
   * 外部服务错误响应 (502)
   */
  static serviceUnavailable(
    error: string = '外部服务不可用', 
    code?: ErrorCode
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error,
      code: code || ErrorCode.EXTERNAL_SERVICE_ERROR
    }
    return NextResponse.json(response, { status: 502 })
  }

  /**
   * 分页响应
   */
  static paginated<T>(
    data: T[],
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    },
    message?: string
  ): NextResponse {
    const response: ApiResponse<{
      items: T[]
      pagination: typeof pagination
    }> = {
      success: true,
      message,
      data: {
        items: data,
        pagination
      }
    }
    return NextResponse.json(response, { status: 200 })
  }

  /**
   * 处理Zod验证错误
   */
  static fromZodError(zodError: any): NextResponse {
    const details = zodError.errors?.map((err: any) => ({
      field: err.path?.join('.'),
      message: err.message,
      code: err.code
    }))

    return this.validationError('请求数据验证失败', details)
  }

  /**
   * 处理Prisma错误
   */
  static fromPrismaError(prismaError: any): NextResponse {
    console.error('Prisma错误:', prismaError)

    // P2002: 唯一约束冲突
    if (prismaError.code === 'P2002') {
      const fields = prismaError.meta?.target || []
      return this.conflict(`字段冲突: ${fields.join(', ')} 已存在`)
    }

    // P2025: 记录不存在
    if (prismaError.code === 'P2025') {
      return this.notFound('记录不存在')
    }

    // P2003: 外键约束失败
    if (prismaError.code === 'P2003') {
      return this.badRequest('关联数据不存在')
    }

    // 其他数据库错误
    return this.internalError('数据库操作失败', ErrorCode.DATABASE_ERROR)
  }

  /**
   * 通用错误处理
   */
  static handleError(error: any): NextResponse {
    console.error('API错误:', error)

    // Zod验证错误
    if (error.name === 'ZodError') {
      return this.fromZodError(error)
    }

    // Prisma错误
    if (error.code && error.code.startsWith('P')) {
      return this.fromPrismaError(error)
    }

    // 普通错误
    if (error instanceof Error) {
      return this.internalError(error.message)
    }

    // 未知错误
    return this.internalError('未知错误')
  }
}

// 导出便捷方法
export const {
  success,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  internalError,
  serviceUnavailable,
  paginated,
  handleError
} = ApiResponseHandler