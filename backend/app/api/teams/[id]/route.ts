import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// 更新团队验证模式
const updateTeamSchema = z.object({
  name: z.string().min(2, '团队名称至少2个字符').optional(),
  description: z.string().min(10, '团队描述至少10个字符').optional(),
  maxMembers: z.number().min(1, '最大成员数至少1人').max(10, '最大成员数不能超过10人').optional(),
  skills: z.array(z.string()).min(1, '至少选择一种技能').optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        description: true,
        maxMembers: true,
        skills: true,
        tags: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        hackathon: {
          select: {
            id: true,
            title: true,
          }
        },
        leader: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          }
        },
        members: {
          select: {
            id: true,
            role: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                bio: true,
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            projects: true,
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { success: false, error: '团队不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { team }
    })
  } catch (error) {
    console.error('获取团队详情错误:', error)
    return NextResponse.json(
      { success: false, error: '获取团队详情失败' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id
    const body = await request.json()
    
    // 验证请求数据
    const validatedData = updateTeamSchema.parse(body)
    
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      )
    }

    // 检查团队是否存在且用户是队长
    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId },
      select: { leaderId: true }
    })

    if (!existingTeam) {
      return NextResponse.json(
        { success: false, error: '团队不存在' },
        { status: 404 }
      )
    }

    if (existingTeam.leaderId !== user.id) {
      return NextResponse.json(
        { success: false, error: '只有队长可以修改团队信息' },
        { status: 403 }
      )
    }

    // 更新团队信息
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        description: true,
        maxMembers: true,
        skills: true,
        tags: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        hackathon: {
          select: {
            id: true,
            title: true,
          }
        },
        leader: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          }
        },
        _count: {
          select: {
            members: true,
            projects: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { team: updatedTeam }
    })
  } catch (error) {
    console.error('更新团队错误:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: '更新团队失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id
    
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      )
    }

    // 检查团队是否存在且用户是队长
    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId },
      select: { leaderId: true }
    })

    if (!existingTeam) {
      return NextResponse.json(
        { success: false, error: '团队不存在' },
        { status: 404 }
      )
    }

    if (existingTeam.leaderId !== user.id) {
      return NextResponse.json(
        { success: false, error: '只有队长可以删除团队' },
        { status: 403 }
      )
    }

    // 删除团队（同时删除团队成员关系）
    await prisma.$transaction([
      prisma.teamMember.deleteMany({
        where: { teamId }
      }),
      prisma.team.delete({
        where: { id: teamId }
      })
    ])

    return NextResponse.json({
      success: true,
      message: '团队删除成功'
    })
  } catch (error) {
    console.error('删除团队错误:', error)
    return NextResponse.json(
      { success: false, error: '删除团队失败' },
      { status: 500 }
    )
  }
} 