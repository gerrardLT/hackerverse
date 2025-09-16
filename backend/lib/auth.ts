import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { ethers } from 'ethers'
import { NextRequest } from 'next/server'
import { prisma } from './prisma'

export interface JWTPayload {
  userId: string
  email?: string
  walletAddress?: string
  role?: string
  github?: string
  iat?: number
  exp?: number
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
  private static readonly JWT_EXPIRES_IN = '7d'

  /**
   * 哈希密码
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  /**
   * 验证密码
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  /**
   * 生成 JWT Token
   */
  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    })
  }

  /**
   * 验证 JWT Token
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload
    } catch (error) {
      console.log('JWT验证失败:', error instanceof Error ? error.message : 'Unknown error')
      return null
    }
  }

  /**
   * 验证以太坊签名
   */
  static verifyEthereumSignature(
    message: string,
    signature: string,
    address: string
  ): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature)
      return recoveredAddress.toLowerCase() === address.toLowerCase()
    } catch (error) {
      return false
    }
  }

  /**
   * 生成登录消息
   */
  static generateLoginMessage(address: string): string {
    const timestamp = Date.now()
    return `Login to HackX\n\nAddress: ${address}\nTimestamp: ${timestamp}\n\nPlease sign this message to authenticate.`
  }

  /**
   * 从请求头提取 Token
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    return authHeader.substring(7)
  }
}

/**
 * 验证用户身份
 */
export async function auth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = AuthService.extractTokenFromHeader(authHeader ?? undefined)
    
    if (!token) {
      return null
    }

    const payload = AuthService.verifyToken(token)
    if (!payload) {
      return null
    }

    // 从数据库获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    if (!user) {
      return null
    }

    return user
  } catch (error) {
    console.error('认证错误:', error)
    return null
  }
} 