import { NextRequest, NextResponse } from 'next/server'
import { IPFSService } from '@/lib/ipfs'

/**
 * 从IPFS获取数据
 * GET /api/ipfs/get?hash=<cid>&type=json|file
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hash = searchParams.get('hash')
    const type = searchParams.get('type') || 'json'

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

    console.log(`📥 获取IPFS数据: ${hash} (类型: ${type})`)

    // 从IPFS获取数据
    const data = await IPFSService.getFromIPFS(hash)

    if (type === 'json') {
      return NextResponse.json({
        success: true,
        data,
        hash,
        message: '数据获取成功'
      })
    } else {
      // 返回原始数据用于文件下载
      return NextResponse.json({
        success: true,
        data,
        hash,
        message: '文件数据获取成功'
      })
    }

  } catch (error) {
    console.error('IPFS获取数据失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'IPFS数据获取失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
