import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// 更新角色验证模式
const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MODERATOR', 'JUDGE', 'USER'], {
    errorMap: () => ({ message: '角色必须是 ADMIN、MODERATOR、JUDGE 或 USER' })
  })
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const body = await request.json()
    
    // 验证请求数据
    const validatedData = updateRoleSchema.parse(body)
    
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      )
    }

    // 检查用户是否是管理员
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    // 检查目标用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      )
    }

    // 不能修改自己的角色
    if (userId === user.id) {
      return NextResponse.json(
        { success: false, error: '不能修改自己的角色' },
        { status: 400 }
      )
    }

    // 更新用户角色
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: validatedData.role },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
      message: '用户角色更新成功'
    })
  } catch (error) {
    console.error('更新用户角色错误:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: '更新用户角色失败' },
      { status: 500 }
    )
  }
} 