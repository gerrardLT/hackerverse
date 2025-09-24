import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { IPFSService, IPFSCredentialData } from '@/lib/ipfs'

// 直接上传凭证请求验证模式
const uploadCredentialSchema = z.object({
  credential: z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    credentialType: z.string().optional(),
    issuer: z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['platform', 'organization', 'peer']),
      metadata: z.record(z.any()).optional()
    }),
    subject: z.object({
      id: z.string(),
      name: z.string(),
      metadata: z.record(z.any()).optional()
    }),
    issuanceDate: z.string(),
    expirationDate: z.string().optional(),
    credentialSubject: z.record(z.any()),
    proof: z.object({
      type: z.string(),
      created: z.string(),
      verificationMethod: z.string(),
      proofPurpose: z.string(),
      proofValue: z.string()
    }).optional(),
    evidence: z.array(z.object({
      type: z.string(),
      description: z.string(),
      url: z.string().optional(),
      metadata: z.record(z.any()).optional()
    })).optional(),
    metadata: z.record(z.any()).optional()
  }),
  options: z.object({
    createDatabaseRecord: z.boolean().default(true), // 是否创建数据库记录
    isPublic: z.boolean().default(true),
    category: z.string().default('external'),
    tags: z.array(z.string()).default([]),
    skillsProven: z.array(z.string()).default([]),
    autoVerify: z.boolean().default(false) // 是否自动验证
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = uploadCredentialSchema.parse(body)
    
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

    const { credential, options = { createDatabaseRecord: true, isPublic: true, category: 'external', tags: [], skillsProven: [], autoVerify: false } } = validatedData

    // 验证用户是否有权限上传此凭证
    const isSubject = credential.subject.id === user.id
    const isIssuer = credential.issuer.id === user.id
    const isAdmin = ['ADMIN', 'MODERATOR'].includes(user.role)

    if (!isSubject && !isIssuer && !isAdmin) {
      return NextResponse.json(
        { success: false, error: t('credentials.upload.forbidden') },
        { status: 403 }
      )
    }

    // 检查凭证是否已存在
    const existingCredential = await prisma.iPFSCredential.findFirst({
      where: {
        OR: [
          { metadata: { path: ['id'], equals: credential.id } },
          { title: credential.title, userId: credential.subject.id, credentialType: credential.credentialType }
        ]
      }
    })

    if (existingCredential) {
      return NextResponse.json(
        { success: false, error: t('credentials.upload.alreadyExists') },
        { status: 409 }
      )
    }

    // 验证主体用户是否存在
    const subjectUser = await prisma.user.findUnique({
      where: { id: credential.subject.id },
      select: { id: true, username: true, email: true }
    })

    if (!subjectUser) {
      return NextResponse.json(
        { success: false, error: t('credentials.subjectNotFound') },
        { status: 404 }
      )
    }

    // 验证颁发者用户（如果不是平台）
    let issuerUser = null
    if (credential.issuer.type !== 'platform') {
      issuerUser = await prisma.user.findUnique({
        where: { id: credential.issuer.id },
        select: { id: true, username: true, role: true }
      })

      if (!issuerUser) {
        return NextResponse.json(
          { success: false, error: t('credentials.issuerNotFound') },
          { status: 404 }
        )
      }
    }

    // 构建完整的IPFS凭证数据
    const ipfsCredentialData: IPFSCredentialData = {
      ...credential,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      ipfsMetadata: {
        uploadedAt: new Date().toISOString(),
        platform: 'HackX',
        contentType: 'credential'
      }
    }

    // 上传到IPFS
    console.log('🔄 上传外部凭证到IPFS...')
    const ipfsHash = await IPFSService.uploadCredential(ipfsCredentialData)
    console.log('✅ IPFS上传成功:', ipfsHash)

    let databaseRecord = null

    // 创建数据库记录（如果选择）
    if (options.createDatabaseRecord) {
      const expirationDate = credential.expirationDate ? new Date(credential.expirationDate) : null
      
      databaseRecord = await prisma.$transaction(async (tx) => {
        const record = await tx.iPFSCredential.create({
          data: {
            userId: credential.subject.id,
            credentialType: credential.credentialType || 'external',
            title: credential.title,
            description: credential.description,
            ipfsHash,
            metadata: {
              ...credential.metadata,
              originalCredential: credential,
              uploadedBy: user.id,
              uploadMethod: 'direct'
            },
            issuerUserId: issuerUser?.id,
            issuerType: credential.issuer.type,
            issuerMetadata: credential.issuer.metadata,
            isVerified: options.autoVerify && isAdmin,
            verificationScore: options.autoVerify && isAdmin ? 90 : 0,
            expiryDate: expirationDate,
            isPublic: options.isPublic,
            category: options.category,
            tags: options.tags,
            skillsProven: options.skillsProven,
            evidence: credential.evidence || [],
            shareableLink: IPFSService.generateShareableLink(ipfsHash)
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
            }
          }
        })

        // 如果自动验证，创建验证记录
        if (options.autoVerify && isAdmin) {
          await tx.credentialVerification.create({
            data: {
              credentialId: record.id,
              verifierUserId: user.id,
              verifierType: 'system',
              verificationMethod: 'auto',
              status: 'verified',
              score: 90,
              comments: '管理员上传的外部凭证自动验证',
              trustScore: 90,
              verificationLevel: 'standard',
              isPublic: false
            }
          })
        }

        return record
      })
    }

    // 生成可分享链接
    const shareableLink = IPFSService.generateShareableLink(ipfsHash)

    return NextResponse.json({
      success: true,
      data: {
        ipfsHash,
        shareableLink,
        verifyUrl: `${request.headers.get('origin') || 'https://hackx.io'}/verify/${ipfsHash}`,
        databaseRecord: databaseRecord ? {
          id: databaseRecord.id,
          title: databaseRecord.title,
          isVerified: databaseRecord.isVerified,
          createdAt: databaseRecord.createdAt
        } : null,
        ipfsData: ipfsCredentialData,
        message: t('credentials.upload.success')
      }
    })

  } catch (error) {
    console.error('凭证上传失败:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('validation.invalidData'), details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: t('credentials.upload.error') },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // 获取批量上传状态或统计信息
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized') },
        { status: 401 }
      )
    }

    if (action === 'stats') {
      // 获取用户的IPFS凭证统计
      const userCredentials = await prisma.iPFSCredential.findMany({
        where: { userId: user.id },
        select: { ipfsHash: true }
      })

      const hashes = userCredentials.map(c => c.ipfsHash)
      const stats = await IPFSService.getCredentialStats(hashes)

      return NextResponse.json({
        success: true,
        data: {
          ...stats,
          userCredentialCount: userCredentials.length
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        message: t('credentials.upload.getInfo'),
        supportedActions: ['stats'],
        maxCredentialSize: '10MB',
        supportedFormats: ['JSON'],
        requiredFields: ['id', 'type', 'title', 'issuer', 'subject', 'issuanceDate', 'credentialSubject']
      }
    })

  } catch (error) {
    console.error('获取上传信息失败:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { success: false, error: t('credentials.upload.infoError') },
      { status: 500 }
    )
  }
}
