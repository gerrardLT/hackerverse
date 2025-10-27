import { NextRequest, NextResponse } from 'next/server'

/**
 * 前端IPFS代理 - 转发请求到后端
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

    // 构建后端代理URL
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api').replace(/\/api$/, '')
    const backendUrl = `${apiBase}/api/ipfs/proxy?hash=${hash}`
    
    console.log('🔄 代理IPFS文件请求到后端:', backendUrl)

    // 转发请求到后端
    const response = await fetch(backendUrl)

    if (!response.ok) {
      throw new Error(`后端代理失败: ${response.status}`)
    }

    // 获取响应数据和头信息
    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    // 返回文件数据
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Source': 'IPFS-Proxy',
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
