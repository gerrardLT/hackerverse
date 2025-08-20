import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      )
    }
    
    // 检查请求内容类型
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: '请求必须是multipart/form-data格式' },
        { status: 400 }
      )
    }
    
    // 解析FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: '未找到文件' },
        { status: 400 }
      )
    }
    
    // 检查文件大小（限制为50MB）
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '文件大小不能超过50MB' },
        { status: 400 }
      )
    }
    
    // 检查文件类型
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/json',
      'application/zip',
      'application/x-zip-compressed',
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型' },
        { status: 400 }
      )
    }
    
    // 将文件转换为Buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // 动态导入IPFS服务并上传
    try {
      const { IPFSService } = await import('@/lib/ipfs')
      const ipfsFile = await IPFSService.uploadFile(buffer, file.name)
      
      return NextResponse.json({
        success: true,
        message: '文件上传成功',
        file: ipfsFile,
      })
    } catch (ipfsError) {
      console.error('IPFS上传失败:', ipfsError)
      return NextResponse.json(
        { error: 'IPFS服务不可用，文件上传失败' },
        { status: 503 }
      )
    }
    
  } catch (error) {
    console.error('IPFS文件上传错误:', error)
    return NextResponse.json(
      { error: '文件上传失败' },
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
    const { data, metadata } = body
    
    if (!data) {
      return NextResponse.json(
        { error: '数据不能为空' },
        { status: 400 }
      )
    }
    
    // 动态导入IPFS服务并上传JSON数据
    try {
      const { IPFSService } = await import('@/lib/ipfs')
      const ipfsHash = await IPFSService.uploadJSON(data, metadata)
      
      return NextResponse.json({
        success: true,
        message: '数据上传成功',
        hash: ipfsHash,
        url: IPFSService.getGatewayURL(ipfsHash),
      })
    } catch (ipfsError) {
      console.error('IPFS上传失败:', ipfsError)
      return NextResponse.json(
        { error: 'IPFS服务不可用，数据上传失败' },
        { status: 503 }
      )
    }
    
  } catch (error) {
    console.error('IPFS JSON上传错误:', error)
    return NextResponse.json(
      { error: '数据上传失败' },
      { status: 500 }
    )
  }
} 