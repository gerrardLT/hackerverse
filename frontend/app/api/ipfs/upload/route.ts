import { NextRequest, NextResponse } from 'next/server'

/**
 * 前端IPFS上传代理 - 转发请求到后端
 */
export async function POST(request: NextRequest) {
  try {
    // 获取FormData
    const formData = await request.formData()
    
    // 获取认证token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('hackx-token')?.value

    // 构建后端请求
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/ipfs/upload`.replace('/api/api/', '/api/')
    const headers: Record<string, string> = {}
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    console.log('🔄 代理IPFS上传请求到后端:', backendUrl)
    console.log('🔑 Token状态:', {
      hasAuthHeader: !!authHeader,
      hasCookieToken: !!request.cookies.get('hackx-token')?.value,
      finalToken: token ? `${token.substring(0, 10)}...` : 'none'
    })

    // 如果没有token，返回401错误
    if (!token) {
      console.error('❌ 缺少认证token')
      return NextResponse.json(
        { 
          success: false,
          error: '未认证，请重新登录',
          details: '缺少认证token'
        },
        { status: 401 }
      )
    }

    // 转发请求到后端
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
      headers
    })

    // 获取响应数据
    const data = await response.json()

    console.log('📡 后端响应:', {
      status: response.status,
      success: data.success,
      error: data.error,
      hasData: !!data.data
    })

    // 返回后端响应
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })

  } catch (error) {
    console.error('IPFS上传代理失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '上传失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * PUT方法处理JSON数据上传
 */
export async function PUT(request: NextRequest) {
  try {
    // 获取JSON数据
    const jsonData = await request.json()
    
    // 获取认证token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('hackx-token')?.value

    // 构建后端请求
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/ipfs/upload`.replace('/api/api/', '/api/')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    console.log('🔄 代理IPFS JSON上传请求到后端:', backendUrl)
    console.log('📄 JSON数据大小:', JSON.stringify(jsonData).length)

    // 如果没有token，返回401错误
    if (!token) {
      console.error('❌ 缺少认证token')
      return NextResponse.json(
        { 
          success: false,
          error: '未认证，请重新登录',
          details: '缺少认证token'
        },
        { status: 401 }
      )
    }

    // 转发请求到后端
    const response = await fetch(backendUrl, {
      method: 'PUT',
      body: JSON.stringify(jsonData),
      headers
    })

    // 获取响应数据
    const data = await response.json()

    console.log('📡 后端响应:', {
      status: response.status,
      success: data.success,
      error: data.error,
      hasData: !!data.data
    })

    // 返回后端响应
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })

  } catch (error) {
    console.error('IPFS JSON上传代理失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '上传失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// 处理CORS预检请求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
