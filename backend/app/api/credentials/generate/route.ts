import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { IPFSService, IPFSCredentialData } from '@/lib/ipfs'

// 生成凭证请求验证模式
const generateCredentialSchema = z.object({
  credentialType: z.string().min(1, '凭证类型不能为空'),
  title: z.string().min(1, '凭证标题不能为空'),
  description: z.string().optional(),
  templateId: z.string().optional(),
  subjectUserId: z.string().optional(), // 凭证主体用户ID（可为其他用户生成凭证）
  credentialSubject: z.record(z.any()), // 凭证内容
  evidence: z.array(z.object({
    type: z.string(),
    description: z.string(),
    url: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })).optional(),
  expirationDays: z.number().min(1).max(3650).optional(), // 有效期天数
  isPublic: z.boolean().default(true),
  category: z.string().default('achievement'),
  tags: z.array(z.string()).default([]),
  skillsProven: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = generateCredentialSchema.parse(body)
    
    // 获取国际化函数
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized') },
        { status: 401 }
      )
    }

    // 确定凭证主体（默认为当前用户）
    const subjectUserId = validatedData.subjectUserId || user.id
    
    // 检查是否有权限为其他用户生成凭证
    if (subjectUserId !== user.id && !['ADMIN', 'MODERATOR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: t('credentials.generate.forbidden') },
        { status: 403 }
      )
    }

    // 获取主体用户信息
    const subjectUser = await prisma.user.findUnique({
      where: { id: subjectUserId },
      select: {
        id: true,
        username: true,
        email: true,
        publicKey: true
      }
    })

    if (!subjectUser) {
      return NextResponse.json(
        { success: false, error: t('credentials.subjectNotFound') },
        { status: 404 }
      )
    }

    // 获取凭证模板（如果指定）
    let template = null
    if (validatedData.templateId) {
      template = await prisma.credentialTemplate.findUnique({
        where: { 
          id: validatedData.templateId,
          isActive: true
        }
      })

      if (!template) {
        return NextResponse.json(
          { success: false, error: t('credentials.templateNotFound') },
          { status: 404 }
        )
      }

      // 检查模板使用权限
      if (template.minimumRole) {
        const roleHierarchy = ['USER', 'MODERATOR', 'ADMIN']
        const userRoleIndex = roleHierarchy.indexOf(user.role)
        const requiredRoleIndex = roleHierarchy.indexOf(template.minimumRole)
        
        if (userRoleIndex < requiredRoleIndex) {
          return NextResponse.json(
            { success: false, error: t('credentials.insufficientRole') },
            { status: 403 }
          )
        }
      }
    }

    // 计算过期时间
    const expirationDate = validatedData.expirationDays 
      ? new Date(Date.now() + validatedData.expirationDays * 24 * 60 * 60 * 1000)
      : template?.expiryDuration 
        ? new Date(Date.now() + template.expiryDuration * 24 * 60 * 60 * 1000)
        : null

    // 构建IPFS凭证数据
    const credentialId = `urn:hackx:credential:${Date.now()}`
    const ipfsCredentialData: IPFSCredentialData = {
      id: credentialId,
      type: 'VerifiableCredential',
      title: validatedData.title,
      description: validatedData.description,
      credentialType: validatedData.credentialType,
      issuer: {
        id: user.id,
        name: user.username || user.email,
        type: user.role === 'ADMIN' || user.role === 'MODERATOR' ? 'platform' : 'peer',
        metadata: {
          role: user.role,
          platform: 'HackX'
        }
      },
      subject: {
        id: subjectUser.id,
        name: subjectUser.username || subjectUser.email,
        metadata: {
          email: subjectUser.email,
          publicKey: subjectUser.publicKey
        }
      },
      issuanceDate: new Date().toISOString(),
      expirationDate: expirationDate?.toISOString(),
      credentialSubject: validatedData.credentialSubject,
      evidence: validatedData.evidence,
      metadata: {
        ...validatedData.metadata,
        platform: 'HackX',
        templateId: template?.id,
        templateVersion: template?.version,
        generatedBy: 'HackX Platform',
        category: validatedData.category,
        tags: validatedData.tags,
        skillsProven: validatedData.skillsProven
      }
    }

    // 上传到IPFS
    console.log('🔄 上传凭证到IPFS...')
    const ipfsHash = await IPFSService.uploadCredential(ipfsCredentialData)
    console.log('✅ IPFS上传成功:', ipfsHash)

    // 生成可分享链接
    const shareableLink = IPFSService.generateShareableLink(ipfsHash)

    // 在事务中创建数据库记录
    const result = await prisma.$transaction(async (tx) => {
      // 创建IPFS凭证记录
      const ipfsCredential = await tx.iPFSCredential.create({
        data: {
          userId: subjectUserId,
          credentialType: validatedData.credentialType,
          title: validatedData.title,
          description: validatedData.description,
          ipfsHash,
          metadata: ipfsCredentialData.metadata,
          templateId: template?.id,
          issuerUserId: user.id,
          issuerType: ipfsCredentialData.issuer.type,
          issuerMetadata: ipfsCredentialData.issuer.metadata,
          isVerified: user.role === 'ADMIN' || user.role === 'MODERATOR', // 管理员生成的凭证自动验证
          verificationScore: user.role === 'ADMIN' || user.role === 'MODERATOR' ? 100 : 0,
          expiryDate: expirationDate,
          isPublic: validatedData.isPublic,
          category: validatedData.category,
          tags: validatedData.tags,
          skillsProven: validatedData.skillsProven,
          evidence: validatedData.evidence || [],
          shareableLink
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          issuer: {
            select: {
              id: true,
              username: true,
              role: true
            }
          },
          template: {
            select: {
              id: true,
              name: true,
              version: true
            }
          }
        }
      })

      // 如果使用了模板，增加模板使用热度
      if (template) {
        await tx.credentialTemplate.update({
          where: { id: template.id },
          data: {
            popularity: { increment: 1 }
          }
        })
      }

      // 如果是自动验证的凭证，创建验证记录
      if (ipfsCredential.isVerified) {
        await tx.credentialVerification.create({
          data: {
            credentialId: ipfsCredential.id,
            verifierUserId: user.id,
            verifierType: 'system',
            verificationMethod: 'auto',
            status: 'verified',
            score: 100,
            comments: '管理员生成的凭证自动验证',
            trustScore: 100,
            verificationLevel: 'premium',
            isPublic: false
          }
        })
      }

      return ipfsCredential
    })

    return NextResponse.json({
      success: true,
      data: {
        credential: result,
        ipfsHash,
        shareableLink,
        verifyUrl: `${request.headers.get('origin') || 'https://hackx.io'}/verify/${ipfsHash}`,
        message: t('credentials.generate.success')
      }
    })

  } catch (error) {
    console.error('生成凭证失败:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('validation.invalidData'), details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: t('credentials.generate.error') },
      { status: 500 }
    )
  }
}
