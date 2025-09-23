import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { IPFSService } from '@/lib/ipfs'

// 验证选项模式
const verifyOptionsSchema = z.object({
  includePrivate: z.boolean().default(false), // 是否包含私有验证记录
  performIntegrityCheck: z.boolean().default(true), // 是否执行完整性检查
  recordAccess: z.boolean().default(true) // 是否记录访问
})

interface RouteParams {
  params: {
    hash: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { hash } = params
    const { searchParams } = new URL(request.url)
    
    // 解析查询参数
    const options = verifyOptionsSchema.parse({
      includePrivate: searchParams.get('includePrivate') === 'true',
      performIntegrityCheck: searchParams.get('performIntegrityCheck') !== 'false',
      recordAccess: searchParams.get('recordAccess') !== 'false'
    })
    
    // 获取国际化函数
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    // 验证IPFS哈希格式
    if (!IPFSService.isValidHash(hash)) {
      return NextResponse.json(
        { success: false, error: t('credentials.verify.invalidHash') },
        { status: 400 }
      )
    }

    // 获取用户信息（可选）
    const user = await auth(request).catch(() => null)

    // 从数据库查找凭证记录
    const credentialRecord = await prisma.iPFSCredential.findUnique({
      where: { ipfsHash: hash },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            reputationScore: true
          }
        },
        issuer: {
          select: {
            id: true,
            username: true,
            role: true,
            reputationScore: true
          }
        },
        template: {
          select: {
            id: true,
            name: true,
            version: true,
            category: true
          }
        },
        verifications: {
          where: options.includePrivate || user?.role === 'ADMIN' 
            ? {} 
            : { isPublic: true },
          include: {
            verifier: {
              select: {
                id: true,
                username: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    // 从IPFS获取凭证数据
    let ipfsData = null
    let ipfsAccessible = false
    let integrityCheck = false

    try {
      console.log('📥 从IPFS获取凭证数据:', hash)
      ipfsData = await IPFSService.getCredential(hash)
      ipfsAccessible = true
      console.log('✅ IPFS数据获取成功')

      // 执行完整性检查
      if (options.performIntegrityCheck && credentialRecord) {
        integrityCheck = await IPFSService.verifyCredentialIntegrity(hash, {
          id: ipfsData.id,
          type: ipfsData.type,
          title: credentialRecord.title,
          issuer: ipfsData.issuer,
          subject: ipfsData.subject,
          issuanceDate: ipfsData.issuanceDate
        })
        console.log('🔍 完整性检查结果:', integrityCheck)
      }
    } catch (error) {
      console.warn('⚠️ IPFS数据获取失败:', error)
      ipfsAccessible = false
    }

    // 检查凭证状态
    const now = new Date()
    const isExpired = credentialRecord?.expiryDate && credentialRecord.expiryDate < now
    const isRevoked = credentialRecord?.isRevoked || false

    // 计算信任度评分
    let trustScore = 0
    if (credentialRecord) {
      // 基础分数
      trustScore += credentialRecord.isVerified ? 40 : 0
      trustScore += ipfsAccessible ? 20 : 0
      trustScore += integrityCheck ? 20 : 0
      trustScore += credentialRecord.issuer?.role === 'ADMIN' ? 20 : 
                   credentialRecord.issuer?.role === 'MODERATOR' ? 15 : 10
      
      // 验证记录加分
      const verificationBonus = Math.min(credentialRecord.verifications.length * 2, 10)
      trustScore = Math.min(trustScore + verificationBonus, 100)
      
      // 过期或撤销扣分
      if (isExpired) trustScore -= 30
      if (isRevoked) trustScore = 0
    } else if (ipfsData) {
      // 仅有IPFS数据的情况
      trustScore = ipfsAccessible ? 30 : 0
    }

    // 更新访问统计（如果找到记录且用户同意记录访问）
    if (credentialRecord && options.recordAccess) {
      await prisma.iPFSCredential.update({
        where: { id: credentialRecord.id },
        data: {
          viewCount: { increment: 1 },
          lastAccessedAt: new Date()
        }
      }).catch(() => {
        // 忽略更新失败
      })
    }

    // 获取请求者信息（用于审计）
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 构建验证结果
    const verificationResult = {
      hash,
      isValid: ipfsAccessible && (credentialRecord ? !isRevoked : true),
      isAuthentic: credentialRecord ? integrityCheck : null,
      trustScore,
      status: {
        exists: !!credentialRecord,
        ipfsAccessible,
        isExpired,
        isRevoked,
        isVerified: credentialRecord?.isVerified || false
      },
      credential: credentialRecord ? {
        id: credentialRecord.id,
        title: credentialRecord.title,
        description: credentialRecord.description,
        credentialType: credentialRecord.credentialType,
        category: credentialRecord.category,
        issuanceDate: ipfsData?.issuanceDate || credentialRecord.createdAt,
        expirationDate: credentialRecord.expiryDate,
        subject: {
          id: credentialRecord.user.id,
          name: credentialRecord.user.username || credentialRecord.user.email,
          reputation: credentialRecord.user.reputationScore
        },
        issuer: credentialRecord.issuer ? {
          id: credentialRecord.issuer.id,
          name: credentialRecord.issuer.username,
          role: credentialRecord.issuer.role,
          reputation: credentialRecord.issuer.reputationScore
        } : null,
        template: credentialRecord.template,
        tags: credentialRecord.tags,
        skillsProven: credentialRecord.skillsProven,
        verificationScore: credentialRecord.verificationScore,
        metadata: credentialRecord.isPublic || user?.id === credentialRecord.userId || user?.role === 'ADMIN'
          ? credentialRecord.metadata
          : null
      } : null,
      ipfsData: ipfsData && (credentialRecord?.isPublic || user?.id === credentialRecord?.userId || user?.role === 'ADMIN') 
        ? ipfsData 
        : null,
      verifications: credentialRecord?.verifications || [],
      statistics: credentialRecord ? {
        viewCount: credentialRecord.viewCount,
        verificationCount: credentialRecord.verifications.length,
        lastVerified: credentialRecord.verifications[0]?.createdAt,
        averageVerificationScore: credentialRecord.verifications.length > 0
          ? credentialRecord.verifications
              .filter(v => v.score !== null)
              .reduce((sum, v) => sum + (v.score || 0), 0) / 
            credentialRecord.verifications.filter(v => v.score !== null).length
          : null
      } : null,
      shareableLink: credentialRecord?.shareableLink || IPFSService.generateShareableLink(hash),
      verifiedAt: new Date().toISOString(),
      verificationMethod: 'api'
    }

    // 记录验证访问（匿名统计）
    if (credentialRecord) {
      await prisma.credentialVerification.create({
        data: {
          credentialId: credentialRecord.id,
          verifierUserId: user?.id,
          verifierType: user ? 'user' : 'anonymous',
          verificationMethod: 'api',
          status: verificationResult.isValid ? 'verified' : 'failed',
          score: trustScore,
          comments: `API验证 - 信任度: ${trustScore}%`,
          isAnonymous: !user,
          trustScore,
          verificationLevel: 'basic',
          ipAddress,
          userAgent,
          metadata: {
            ipfsAccessible,
            integrityCheck,
            userAgent: userAgent.substring(0, 200), // 限制长度
            timestamp: new Date().toISOString()
          },
          isPublic: false // API验证记录默认不公开
        }
      }).catch(error => {
        console.warn('记录验证失败:', error)
        // 不影响主要流程
      })
    }

    return NextResponse.json({
      success: true,
      data: verificationResult
    })

  } catch (error) {
    console.error('凭证验证失败:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('validation.invalidParams') },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: t('credentials.verify.error') },
      { status: 500 }
    )
  }
}
