import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// 偏好设置验证模式
const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  notificationSettings: z.object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    teamInvites: z.boolean().optional(),
    projectUpdates: z.boolean().optional(),
    hackathonReminders: z.boolean().optional(),
  }).optional(),
  privacySettings: z.object({
    profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
    showEmail: z.boolean().optional(),
    showWalletAddress: z.boolean().optional(),
  }).optional(),
})

export async function GET(request: NextRequest) {
  try {
    // 从请求头获取认证token
    const authHeader = request.headers.get('authorization')
    const token = AuthService.extractTokenFromHeader(authHeader || undefined)
    
    if (!token) {
      return NextResponse.json(
        { error: '未提供认证token' },
        { status: 401 }
      )
    }
    
    // 验证token
    const payload = AuthService.verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: '无效的认证token' },
        { status: 401 }
      )
    }
    
    // 获取用户偏好设置
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        notificationSettings: true,
        privacySettings: true,
        preferences: true,
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      preferences: {
        notificationSettings: user.notificationSettings,
        privacySettings: user.privacySettings,
        ...(user.preferences as Record<string, any> || {}),
      },
    })
    
  } catch (error) {
    console.error('获取用户偏好设置错误:', error)
    return NextResponse.json(
      { error: '获取用户偏好设置失败' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 从请求头获取认证token
    const authHeader = request.headers.get('authorization')
    const token = AuthService.extractTokenFromHeader(authHeader || undefined)
    
    if (!token) {
      return NextResponse.json(
        { error: '未提供认证token' },
        { status: 401 }
      )
    }
    
    // 验证token
    const payload = AuthService.verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: '无效的认证token' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // 验证请求数据
    const validatedData = preferencesSchema.parse(body)
    
    // 更新用户偏好设置
    const updateData: any = {}
    
    if (validatedData.notificationSettings) {
      updateData.notificationSettings = {
        ...validatedData.notificationSettings,
      }
    }
    
    if (validatedData.privacySettings) {
      updateData.privacySettings = {
        ...validatedData.privacySettings,
      }
    }
    
    // 其他偏好设置存储在preferences字段中
    const otherPreferences: any = {}
    if (validatedData.theme) otherPreferences.theme = validatedData.theme
    if (validatedData.language) otherPreferences.language = validatedData.language
    if (validatedData.timezone) otherPreferences.timezone = validatedData.timezone
    
    if (Object.keys(otherPreferences).length > 0) {
      updateData.preferences = otherPreferences
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: updateData,
      select: {
        notificationSettings: true,
        privacySettings: true,
        preferences: true,
      }
    })
    
    return NextResponse.json({
      success: true,
      message: '偏好设置更新成功',
      preferences: {
        notificationSettings: updatedUser.notificationSettings,
        privacySettings: updatedUser.privacySettings,
        ...(updatedUser.preferences as Record<string, any> || {}),
      },
    })
    
  } catch (error) {
    console.error('更新用户偏好设置错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: '更新用户偏好设置失败' },
      { status: 500 }
    )
  }
} 