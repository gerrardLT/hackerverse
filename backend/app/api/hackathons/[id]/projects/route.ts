import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// 查询参数验证
const querySchema = z.object({
  tags: z.string().optional(), // 逗号分隔的标签
  technologies: z.string().optional(), // 逗号分隔的技术栈
  tracks: z.string().optional(), // 逗号分隔的赛道
  sortBy: z.enum(['likes', 'comments', 'created', 'updated']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(), // 搜索关键词
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hackathonId = params.id
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    
    // 验证查询参数
    const validatedQuery = querySchema.parse(query)
    
    console.log('🔍 获取黑客松项目列表:', hackathonId, validatedQuery)
    
    // 检查黑客松是否存在
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: {
        id: true,
        isPublic: true,
        tracks: true,
      }
    })
    
    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: '黑客松不存在' },
        { status: 404 }
      )
    }
    
    if (!hackathon.isPublic) {
      return NextResponse.json(
        { success: false, error: '该黑客松为私有活动' },
        { status: 403 }
      )
    }
    
    // 构建查询条件
    const where: any = {
      hackathonId,
      status: { not: 'DRAFT' } // 只返回已提交的项目
    }

    // 标签过滤 - 暂时简化，避免JSON数组查询的复杂性
    // if (validatedQuery.tags) {
    //   const tagArray = validatedQuery.tags.split(',').map(t => t.trim())
    //   where.tags = {
    //     array_contains: tagArray
    //   }
    // }

    // 技术栈过滤 - 暂时简化，避免JSON数组查询的复杂性  
    // if (validatedQuery.technologies) {
    //   const techArray = validatedQuery.technologies.split(',').map(t => t.trim())
    //   where.technologies = {
    //     array_contains: techArray
    //   }
    // }

    // 搜索过滤
    if (validatedQuery.search) {
      where.OR = [
        { title: { contains: validatedQuery.search, mode: 'insensitive' } },
        { description: { contains: validatedQuery.search, mode: 'insensitive' } }
      ]
    }

    // 排序设置 - 先使用简单排序，避免复杂关联排序的问题
    let orderBy: any = []
    switch (validatedQuery.sortBy) {
      case 'likes':
      case 'comments':
        // 对于点赞和评论排序，暂时使用创建时间排序
        // 在前端进行二次排序处理
        orderBy = [{ createdAt: validatedQuery.sortOrder }]
        break
      case 'updated':
        orderBy = [{ updatedAt: validatedQuery.sortOrder }]
        break
      case 'created':
      default:
        orderBy = [{ createdAt: validatedQuery.sortOrder }]
        break
    }

    // 获取黑客松相关的项目
    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        technologies: true,
        tags: true,
        githubUrl: true,
        demoUrl: true,
        videoUrl: true,
        presentationUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            members: {
              select: {
                role: true,
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                  }
                }
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          }
        },
        _count: {
          select: {
            projectLikes: true,
            feedback: true,
          }
        }
      },
      orderBy
    })
    
    // 获取所有唯一的标签和技术栈用于过滤器
    const allTags = new Set<string>()
    const allTechnologies = new Set<string>()
    const allTracks = Array.isArray(hackathon.tracks) ? hackathon.tracks as any[] : []
    
    // 处理项目数据，添加赛道信息和统计数据
    const projectsWithTrack = projects.map(project => {
      const tags = Array.isArray(project.tags) ? project.tags as string[] : []
      const technologies = Array.isArray(project.technologies) ? project.technologies as string[] : []
      
      // 收集所有标签和技术栈
      tags.forEach(tag => allTags.add(tag))
      technologies.forEach(tech => allTechnologies.add(tech))
      
      // 确定项目所属赛道
      let track = '主赛道'
      if (allTracks.length > 0) {
        // 尝试从赛道名称匹配
        const matchedTrack = allTracks.find((t: any) => 
          tags.some(tag => tag.toLowerCase().includes(t.name?.toLowerCase() || '')) ||
          technologies.some(tech => tech.toLowerCase().includes(t.name?.toLowerCase() || ''))
        )
        if (matchedTrack) {
          track = matchedTrack.name || '主赛道'
        }
      }
      
      return {
        id: project.id,
        title: project.title,
        name: project.title, // 兼容现有前端
        description: project.description,
        team: project.team?.name || `${project.creator.username}的团队`,
        members: project.team?.members?.length || 1,
        track,
        technologies: project.technologies,
        tags: project.tags,
        githubUrl: project.githubUrl,
        demoUrl: project.demoUrl,
        videoUrl: project.videoUrl,
        presentationUrl: project.presentationUrl,
        status: project.status,
        // 统计数据
        likes: project._count.projectLikes,
        comments: 0, // 暂时设为0，等ProjectComment表生效后再修复
        feedbacks: project._count.feedback,
        creator: project.creator,
        teamMembers: project.team?.members || [],
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }
    })
    
    console.log(`✅ 找到 ${projectsWithTrack.length} 个项目`)
    
    return NextResponse.json({
      success: true,
      data: {
        projects: projectsWithTrack,
        // 返回过滤器选项
        filters: {
          tracks: allTracks.map((track: any) => ({
            name: track.name || '主赛道',
            description: track.description || ''
          })),
          tags: Array.from(allTags).sort(),
          technologies: Array.from(allTechnologies).sort()
        },
        // 统计信息
        stats: {
          total: projectsWithTrack.length,
          totalLikes: projectsWithTrack.reduce((sum, p) => sum + p.likes, 0),
          totalComments: projectsWithTrack.reduce((sum, p) => sum + p.comments, 0),
          totalFeedbacks: projectsWithTrack.reduce((sum, p) => sum + p.feedbacks, 0)
        }
      }
    })
    
  } catch (error) {
    console.error('获取黑客松项目列表错误:', error)
    return NextResponse.json(
      { success: false, error: '获取项目列表失败' },
      { status: 500 }
    )
  }
}
