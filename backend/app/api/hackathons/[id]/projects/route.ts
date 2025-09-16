import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hackathonId = params.id
    console.log('🔍 获取黑客松项目列表:', hackathonId)
    
    // 检查黑客松是否存在
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: {
        id: true,
        isPublic: true,
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
    
    // 获取黑客松相关的项目
    const projects = await prisma.project.findMany({
      where: { 
        hackathonId,
        status: { not: 'DRAFT' } // 只返回已提交的项目
      },
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
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ]
    })
    
    // 处理项目数据，添加赛道信息
    const projectsWithTrack = projects.map(project => {
      // 从项目的tags中提取赛道信息，或者使用默认值
      const tags = Array.isArray(project.tags) ? project.tags as string[] : []
      const track = tags.find(tag => tag.includes('赛道')) || '主赛道'
      
      return {
        id: project.id,
        name: project.title,
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
        likes: project._count.projectLikes,
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
        projects: projectsWithTrack
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
