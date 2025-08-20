import { NextRequest, NextResponse } from 'next/server'

// 简化的智能合约API路由
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const address = searchParams.get('address')

    if (!action) {
      return NextResponse.json(
        { error: '缺少action参数' },
        { status: 400 }
      )
    }

    // 模拟智能合约查询
    switch (action) {
      case 'getUserProfile':
        if (!address) {
          return NextResponse.json(
            { error: '缺少address参数' },
            { status: 400 }
          )
        }
        // 模拟返回用户资料CID
        const profileCID = `QmUserProfile${address.slice(2, 8)}`
        return NextResponse.json({ success: true, data: profileCID })

      case 'isUserRegistered':
        if (!address) {
          return NextResponse.json(
            { error: '缺少address参数' },
            { status: 400 }
          )
        }
        // 模拟检查用户注册状态
        const isRegistered = Math.random() > 0.5
        return NextResponse.json({ success: true, data: isRegistered })

      case 'getHackathonCount':
        // 模拟返回黑客松数量
        const count = Math.floor(Math.random() * 100)
        return NextResponse.json({ success: true, data: count })

      default:
        return NextResponse.json(
          { error: '不支持的操作' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('智能合约查询错误:', error)
    return NextResponse.json(
      { error: '查询失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, address, data } = body

    if (!action || !address) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 模拟智能合约操作
    switch (action) {
      case 'registerUser':
        if (!data.profileCID) {
          return NextResponse.json(
            { error: '缺少profileCID' },
            { status: 400 }
          )
        }
        return NextResponse.json({ 
          success: true, 
          message: '用户注册成功',
          txHash: `0x${Math.random().toString(16).slice(2, 66)}`
        })

      case 'createHackathon':
        if (!data.hackathonCID) {
          return NextResponse.json(
            { error: '缺少hackathonCID' },
            { status: 400 }
          )
        }
        return NextResponse.json({ 
          success: true, 
          message: '黑客松创建成功',
          txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
          hackathonId: Math.floor(Math.random() * 1000)
        })

      case 'joinHackathon':
        if (!data.hackathonId) {
          return NextResponse.json(
            { error: '缺少hackathonId' },
            { status: 400 }
          )
        }
        return NextResponse.json({ 
          success: true, 
          message: '加入黑客松成功',
          txHash: `0x${Math.random().toString(16).slice(2, 66)}`
        })

      case 'submitProject':
        if (!data.hackathonId || !data.projectCID) {
          return NextResponse.json(
            { error: '缺少hackathonId或projectCID' },
            { status: 400 }
          )
        }
        return NextResponse.json({ 
          success: true, 
          message: '项目提交成功',
          txHash: `0x${Math.random().toString(16).slice(2, 66)}`
        })

      default:
        return NextResponse.json(
          { error: '不支持的操作' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('智能合约操作错误:', error)
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    )
  }
} 