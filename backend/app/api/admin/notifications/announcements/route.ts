import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthService } from '@/lib/auth'
import { NotificationService } from '@/lib/notification-service'

// 强制使用Node.js运行时
export const runtime = 'nodejs'

// 创建系统公告
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = AuthService.verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: '无效的令牌' },
        { status: 401 }
      )
    }

    // 检查管理员权限 (简化版本，实际项目中应该有更完善的权限系统)
    // 这里假设用户表有role字段
    // const user = await prisma.user.findUnique({
    //   where: { id: decoded.userId },
    //   select: { role: true }
    // })
    // if (user?.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: '权限不足' },
    //     { status: 403 }
    //   )
    // }

    const body = await request.json()

    // 验证请求数据
    const announcementSchema = z.object({
      title: z.string().min(1, '标题不能为空').max(100, '标题不能超过100字符'),
      content: z.string().min(1, '内容不能为空').max(1000, '内容不能超过1000字符'),
      targetUserIds: z.array(z.string()).optional() // 可选：指定目标用户，为空则发给所有用户
    })

    const validatedData = announcementSchema.parse(body)

    await NotificationService.createSystemAnnouncement(
      validatedData.title,
      validatedData.content,
      validatedData.targetUserIds
    )

    return NextResponse.json({
      success: true,
      message: '系统公告发送成功'
    })

  } catch (error) {
    console.error('创建系统公告错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '创建系统公告失败' },
      { status: 500 }
    )
  }
}
