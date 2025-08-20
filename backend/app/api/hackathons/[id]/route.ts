import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { IPFSService } from '@/lib/ipfs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hackathonId = params.id
    
    // 获取黑客松详情
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        registrationDeadline: true,
        maxParticipants: true,
        prizePool: true,
        categories: true,
        tags: true,
        requirements: true,
        rules: true,
        isPublic: true,
        featured: true,
        ipfsHash: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        organizer: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
          }
        },
        participations: {
          select: {
            id: true,
            status: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              }
            }
          }
        },
        projects: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            createdAt: true,
            team: {
              select: {
                id: true,
                name: true,
                members: {
                  select: {
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
            }
          }
        },
        _count: {
          select: {
            participations: true,
            projects: true,
          }
        }
      }
    })
    
    if (!hackathon) {
      return NextResponse.json(
        { error: '黑客松不存在' },
        { status: 404 }
      )
    }
    
    // 检查黑客松是否公开
    if (!hackathon.isPublic) {
      return NextResponse.json(
        { error: '该黑客松为私有活动' },
        { status: 403 }
      )
    }

    // 尝试从IPFS获取详细信息
    let ipfsData: any = null
    let ipfsUrl = null
    
    if (hackathon.ipfsHash) {
      try {
        // 这里可以添加从IPFS获取数据的逻辑
        // 由于IPFS读取需要额外的实现，这里先返回IPFS URL
        ipfsUrl = `${process.env.IPFS_GATEWAY}/ipfs/${hackathon.ipfsHash}`
        
        // 如果需要从IPFS获取数据，可以使用以下代码：
        // const ipfsResponse = await fetch(ipfsUrl)
        // if (ipfsResponse.ok) {
        //   ipfsData = await ipfsResponse.json()
        // }
      } catch (ipfsError) {
        console.error('IPFS数据获取失败:', ipfsError)
        // IPFS获取失败不影响基本功能
      }
    }
    
    return NextResponse.json({
      success: true,
      hackathon: {
        ...hackathon,
        ipfsUrl,
        ipfsData,
        // 合并数据库中的metadata和IPFS数据
        fullMetadata: {
          ...(hackathon.metadata as Record<string, any> || {}),
          ...(ipfsData?.hackathon || {})
        }
      },
    })
    
  } catch (error) {
    console.error('获取黑客松详情错误:', error)
    return NextResponse.json(
      { error: '获取黑客松详情失败' },
      { status: 500 }
    )
  }
} 