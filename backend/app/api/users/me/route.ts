import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// 更新用户信息验证模式
const updateUserSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符').max(30, '用户名最多30个字符').optional(),
  bio: z.string().max(500, '个人简介最多500个字符').optional(),
  avatarUrl: z.string().url('头像链接格式不正确').optional(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '钱包地址格式不正确').optional(),
  skills: z.array(z.string().min(1, '技能名称不能为空').max(50, '技能名称最多50个字符')).max(20, '最多添加20个技能').optional(),
  notificationSettings: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
  }).optional(),
  privacySettings: z.object({
    profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
    showEmail: z.boolean().optional(),
    showWalletAddress: z.boolean().optional(),
  }).optional(),
})

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      )
    }

    // 获取用户信息
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        walletAddress: true,
        avatarUrl: true,
        bio: true,
        skills: true as any,
        reputationScore: true,
        role: true,
        status: true,
        emailVerified: true,
        socialLinks: true,
        notificationSettings: true,
        privacySettings: true,
        ipfsProfileHash: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!userInfo) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 追加社区概览
    console.log('🔍 [用户信息] 开始查询社区概览数据, 用户ID:', user.id)
    const [bookmarksCount, likesCount, myPostsCount, followingCount] = await Promise.all([
      prisma.postBookmark.count({ where: { userId: user.id } }),
      prisma.postLike.count({ where: { userId: user.id } }),
      prisma.communityPost.count({ where: { authorId: user.id, isDeleted: false } }),
      prisma.userFollow.count({ where: { followerId: user.id } })
    ])

    const [recentBookmarks, recentLikes, recentMyPosts, recentFollowing] = await Promise.all([
      prisma.postBookmark.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { post: { select: { id: true, title: true } } }
      }),
      prisma.postLike.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { post: { select: { id: true, title: true } } }
      }),
      prisma.communityPost.findMany({
        where: { authorId: user.id, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, title: true }
      }),
      prisma.userFollow.findMany({
        where: { followerId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { following: { select: { id: true, username: true, avatarUrl: true } } }
      })
    ])

    console.log('🔍 [用户信息] 社区概览统计:', {
      收藏数: bookmarksCount,
      点赞数: likesCount,
      我的帖子数: myPostsCount,
      关注数: followingCount,
      收藏预览数: recentBookmarks.length,
      点赞预览数: recentLikes.length,
      我的帖子预览数: recentMyPosts.length,
      关注预览数: recentFollowing.length
    })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...userInfo,
          ipfsUrl: userInfo.ipfsProfileHash ? `${process.env.PINATA_GATEWAY}/ipfs/${userInfo.ipfsProfileHash}` : null
        },
        communityOverview: {
          counts: {
            bookmarks: bookmarksCount,
            likes: likesCount,
            myPosts: myPostsCount,
            following: followingCount
          },
          previews: {
            bookmarks: recentBookmarks.map((b: any) => ({ id: b.post.id, title: b.post.title })),
            likes: recentLikes.map((l: any) => ({ id: l.post.id, title: l.post.title })),
            myPosts: recentMyPosts,
            following: recentFollowing.map((f: any) => ({ id: f.following.id, name: f.following.username, avatar: f.following.avatarUrl }))
          }
        }
      }
    })

  } catch (error) {
    console.error('获取用户信息错误:', error)
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // 验证请求数据
    const validatedData = updateUserSchema.parse(body)
    
    // 检查用户名是否已存在
    if (validatedData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          id: { not: user.id }
        }
      })
      
      if (existingUser) {
        return NextResponse.json(
          { error: '用户名已被使用' },
          { status: 409 }
        )
      }
    }

    // 获取当前用户信息
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        walletAddress: true,
        avatarUrl: true,
        bio: true,
        reputationScore: true,
        emailVerified: true,
        socialLinks: true,
        createdAt: true
      }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 创建用户资料元数据用于IPFS存储
    const userProfileMetadata = {
      version: '1.0',
      type: 'user-profile',
      timestamp: new Date().toISOString(),
      profile: {
        id: currentUser.id,
        email: currentUser.email,
        username: validatedData.username || currentUser.username,
        walletAddress: validatedData.walletAddress || currentUser.walletAddress,
        avatarUrl: validatedData.avatarUrl || currentUser.avatarUrl,
        bio: validatedData.bio || currentUser.bio,
        reputationScore: currentUser.reputationScore,
        emailVerified: currentUser.emailVerified,
        socialLinks: currentUser.socialLinks || {},
        notificationSettings: validatedData.notificationSettings || {},
        privacySettings: validatedData.privacySettings || {},
        updatedAt: new Date().toISOString(),
        createdAt: currentUser.createdAt.toISOString()
      }
    }

    // ⭐ 上传用户资料到IPFS（必须成功）
    let ipfsCID
    try {
      // 动态导入IPFS服务
      const { IPFSService } = await import('@/lib/ipfs')
      ipfsCID = await IPFSService.uploadJSON(userProfileMetadata, {
        name: `user-profile-${currentUser.username || currentUser.email}.json`,
        description: `用户资料: ${currentUser.username || currentUser.email}`,
        tags: ['user-profile', 'hackathon', 'developer'],
        version: '1.0.0',
        author: currentUser.username || currentUser.email
      })
      console.log('📦 用户资料IPFS上传成功:', ipfsCID)
    } catch (ipfsError) {
      console.error('IPFS上传失败:', ipfsError)
      return NextResponse.json({
        error: 'IPFS上传失败，无法更新用户资料',
        details: ipfsError instanceof Error ? ipfsError.message : '未知错误'
      }, { status: 500 })
    }
    
    // 💡 优化设计：用户基础信息不需要上链
    // 仅存储到IPFS和数据库，提升用户体验
    console.log('💡 用户基础信息更新 - 仅同步IPFS和数据库')
    
    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: validatedData.username,
        bio: validatedData.bio,
        avatarUrl: validatedData.avatarUrl,
        walletAddress: validatedData.walletAddress,
        skills: validatedData.skills as any,
        notificationSettings: validatedData.notificationSettings,
        privacySettings: validatedData.privacySettings,
        
        // ⭐ 仅更新IPFS相关字段
        ipfsProfileHash: ipfsCID, // 存储IPFS哈希
        profileSyncStatus: 'IPFS_ONLY', // 标记为仅IPFS同步
      },
      select: {
        id: true,
        email: true,
        username: true,
        walletAddress: true,
        avatarUrl: true,
        bio: true,
        skills: true as any,
        reputationScore: true,
        emailVerified: true,
        notificationSettings: true,
        privacySettings: true,
        ipfsProfileHash: true,
        createdAt: true,
        updatedAt: true,
      }
    })
    
    return NextResponse.json({
      success: true,
      message: '用户信息更新成功',
      data: {
        user: {
          ...updatedUser,
          ipfsUrl: updatedUser.ipfsProfileHash ? `${process.env.PINATA_GATEWAY}/ipfs/${updatedUser.ipfsProfileHash}` : null
        }
      },
    })
    
  } catch (error) {
    console.error('更新用户信息错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: '更新用户信息失败' },
      { status: 500 }
    )
  }
} 