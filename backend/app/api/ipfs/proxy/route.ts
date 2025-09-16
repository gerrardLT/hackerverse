import { NextRequest, NextResponse } from 'next/server'
import { IPFSService } from '@/lib/ipfs'

/**
 * IPFS文件代理接口，返回原始文件数据
 * GET /api/ipfs/proxy?hash=<cid>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hash = searchParams.get('hash')

    if (!hash) {
      return NextResponse.json(
        { error: '缺少hash参数' },
        { status: 400 }
      )
    }

    if (!IPFSService.isValidHash(hash)) {
      return NextResponse.json(
        { error: '无效的IPFS hash格式' },
        { status: 400 }
      )
    }

    console.log(`🔗 代理IPFS文件访问: ${hash}`)

    // 构建Pinata网关URL
    const gateway = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud'
    const ipfsUrl = `${gateway}/ipfs/${hash}`

    // 代理请求到IPFS网关
    const response = await fetch(ipfsUrl, {
      headers: {
        'Accept': '*/*',
        'User-Agent': 'HackX-Backend/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`IPFS网关响应错误: ${response.status} ${response.statusText}`)
    }

    // 获取内容类型
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    
    // 获取文件数据
    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // 缓存1年，不可变
        'Access-Control-Allow-Origin': '*',
        'X-Content-Source': 'IPFS',
        'X-IPFS-Hash': hash,
      },
    })

  } catch (error) {
    console.error('IPFS代理失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'IPFS文件代理失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
