import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // GitHub OAuth应用配置
    const clientId = process.env.GITHUB_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/github-callback`
    const scope = 'user:email read:user'
    const state = Math.random().toString(36).substring(2, 15) // 防CSRF

    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'GitHub客户端ID未配置'
      }, { status: 500 })
    }

    // 构建GitHub OAuth授权URL
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize')
    githubAuthUrl.searchParams.set('client_id', clientId)
    githubAuthUrl.searchParams.set('redirect_uri', redirectUri)
    githubAuthUrl.searchParams.set('scope', scope)
    githubAuthUrl.searchParams.set('state', state)
    githubAuthUrl.searchParams.set('allow_signup', 'true')

    console.log('🔗 重定向到GitHub授权页面:', githubAuthUrl.toString())

    // 重定向到GitHub授权页面
    return NextResponse.redirect(githubAuthUrl)

  } catch (error) {
    console.error('GitHub登录启动错误:', error)
    
    return NextResponse.json({
      success: false,
      error: 'GitHub登录启动失败'
    }, { status: 500 })
  }
}
