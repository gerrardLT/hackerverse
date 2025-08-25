import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'GitHub授权码缺失'
      }, { status: 400 })
    }

    console.log('🔄 处理GitHub OAuth回调...')

    // 1. 使用code换取access_token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        state,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error('GitHub token错误:', tokenData)
      return NextResponse.json({
        success: false,
        error: 'GitHub授权失败'
      }, { status: 400 })
    }

    // 2. 使用access_token获取用户信息
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'HackX-Platform',
      },
    })

    const githubUser = await userResponse.json()

    if (!githubUser.id) {
      return NextResponse.json({
        success: false,
        error: '获取GitHub用户信息失败'
      }, { status: 400 })
    }

    console.log('📋 GitHub用户信息:', githubUser.login)

    // 3. 检查用户是否已存在
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: githubUser.email },
          { 
            socialLinks: {
              path: ['github'],
              equals: githubUser.login
            }
          }
        ]
      }
    })

    if (!user) {
      // 4. 创建新用户
      console.log('📝 创建新的GitHub用户...')
      
      // ⭐ 使用统一的IPFS服务创建用户资料
      let ipfsCID
      try {
        const { UserProfileIPFSService } = await import('@/lib/user-profile-ipfs')
        
        ipfsCID = await UserProfileIPFSService.uploadProfile({
          username: githubUser.login,
          displayName: githubUser.name || githubUser.login,
          bio: githubUser.bio || 'GitHub开发者',
          avatarUrl: githubUser.avatar_url,
          email: githubUser.email,
          socialLinks: {
            github: githubUser.login,
            githubUrl: githubUser.html_url
          },
          githubData: {
            id: githubUser.id,
            login: githubUser.login,
            publicRepos: githubUser.public_repos,
            followers: githubUser.followers,
            following: githubUser.following,
            createdAt: githubUser.created_at
          },
          // 基于GitHub数据计算初始声誉
          reputation: {
            hackathonsParticipated: 0,
            hackathonsWon: 0,
            projectsCompleted: githubUser.public_repos || 0,
            skillEndorsements: [],
            badges: []
          },
          createdAt: new Date().toISOString()
        }, 'github')
        
      } catch (ipfsError) {
        console.error('GitHub用户IPFS上传失败:', ipfsError)
        return NextResponse.json({
          success: false,
          error: 'IPFS上传失败，无法创建GitHub用户'
        }, { status: 500 })
      }

      user = await prisma.user.create({
        data: {
          email: githubUser.email || `${githubUser.login}@github.hackx.local`,
          username: githubUser.login,
          avatarUrl: githubUser.avatar_url,
          bio: githubUser.bio || 'GitHub开发者',
          reputationScore: Math.min(githubUser.public_repos * 10, 1000), // 基于仓库数量
          emailVerified: !!githubUser.email,
          ipfsProfileHash: ipfsCID,
          profileSyncStatus: ipfsCID ? 'SYNCED' : 'PENDING',
          socialLinks: {
            github: githubUser.login,
            githubUrl: githubUser.html_url
          },
          notificationSettings: {
            email: !!githubUser.email,
            push: true,
            sms: false
          },
          privacySettings: {
            profileVisibility: 'public',
            showEmail: false,
            showWalletAddress: false
          },
          lastLoginAt: new Date(),
        }
      })
    } else {
      // 5. 更新现有用户的GitHub信息
      console.log('🔄 更新现有用户的GitHub信息...')
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          avatarUrl: githubUser.avatar_url,
          socialLinks: {
            ...((user.socialLinks as any) || {}),
            github: githubUser.login,
            githubUrl: githubUser.html_url
          },
          lastLoginAt: new Date(),
        }
      })
    }

    // 6. 生成JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        github: githubUser.login,
        role: user.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    console.log('✅ GitHub登录成功:', user.username)

    // 7. 重定向到前端（带token）
    const redirectUrl = new URL('/auth/github-success', process.env.FRONTEND_URL || 'http://localhost:3001')
    redirectUrl.searchParams.set('token', token)
    redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl
    })))

    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('GitHub登录错误:', error)
    
    const errorUrl = new URL('/auth/signin', process.env.FRONTEND_URL || 'http://localhost:3001')
    errorUrl.searchParams.set('error', 'github_login_failed')
    
    return NextResponse.redirect(errorUrl)
  }
}
