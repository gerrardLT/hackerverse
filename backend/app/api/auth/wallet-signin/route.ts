import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { smartContractService } from '@/lib/smart-contracts'

const walletSignInSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '钱包地址格式不正确'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress } = walletSignInSchema.parse(body)

    console.log('🔍 尝试通过钱包地址登录:', walletAddress)

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        walletAddress: true,
        avatarUrl: true,
        bio: true,
        reputationScore: true,
        emailVerified: true,
        ipfsProfileHash: true,
        profileSyncStatus: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '用户不存在'
      }, { status: 404 })
    }

    // 检查用户状态
    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      return NextResponse.json({
        success: false,
        error: '账户已被暂停或封禁'
      }, { status: 403 })
    }

    // 生成JWT token
    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      walletAddress: user.walletAddress || undefined,
    })

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // ⭐ 检查用户是否已在智能合约中注册，如果没有则自动注册
    if (user.profileSyncStatus !== 'SYNCED' && user.ipfsProfileHash) {
      try {
        console.log('🔗 检测到用户可能未在智能合约中注册，开始检查...')
        
        // 先初始化智能合约服务
        await smartContractService.initialize()
        
        // 检查用户是否已在智能合约中注册
        const isAlreadyRegistered = await smartContractService.isUserRegistered(user.walletAddress!)
        
        if (isAlreadyRegistered) {
          console.log('✅ 用户已在智能合约中注册，更新同步状态')
          // 直接更新同步状态为已同步
          await prisma.user.update({
            where: { id: user.id },
            data: {
              profileSyncStatus: 'SYNCED'
            }
          })
        } else {
          console.log('🔗 开始在智能合约中注册用户...')
          const contractResult = await smartContractService.registerUser(user.ipfsProfileHash)
          
          if (contractResult) {
            console.log('✅ 智能合约自动注册成功:', contractResult)
            
            // 更新用户的区块链同sync状态
            await prisma.user.update({
              where: { id: user.id },
              data: {
                profileSyncStatus: 'SYNCED',
                lastTxHash: contractResult
              }
            })
          }
        }
        
      } catch (contractError) {
        console.warn('⚠️ 智能合约自动注册失败:', contractError)
        // 不阻断登录流程
      }
    }

    console.log('✅ 钱包登录成功:', user.username || user.walletAddress)

    return NextResponse.json({
      success: true,
      message: '钱包登录成功',
      data: {
        user,
        token
      }
    }, { status: 200 })

  } catch (error) {
    console.error('钱包登录错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '请求数据验证失败',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: '钱包登录失败'
    }, { status: 500 })
  }
}
