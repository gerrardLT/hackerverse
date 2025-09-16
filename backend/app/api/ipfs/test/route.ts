import { NextRequest, NextResponse } from 'next/server'

/**
 * IPFS服务测试接口
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 开始测试IPFS服务...')
    
    // 检查环境变量
    const envCheck = {
      PINATA_JWT: !!process.env.PINATA_JWT,
      PINATA_API_KEY: !!process.env.PINATA_API_KEY,
      PINATA_API_SECRET: !!process.env.PINATA_API_SECRET,
      PINATA_GATEWAY: !!process.env.PINATA_GATEWAY
    }
    
    console.log('🔍 环境变量检查:', envCheck)
    
    // 动态导入IPFS服务
    const { IPFSService } = await import('@/lib/ipfs')
    
    // 验证环境变量
    const validation = IPFSService.validateEnvironment()
    console.log('✅ 环境变量验证结果:', validation)
    
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'IPFS环境配置不完整',
        details: {
          missingVars: validation.missingVars,
          warnings: validation.warnings
        }
      }, { status: 500 })
    }
    
    // 检查服务状态
    const isServiceReady = await IPFSService.checkStatus()
    console.log('🔧 IPFS服务状态:', isServiceReady)
    
    if (!isServiceReady) {
      return NextResponse.json({
        success: false,
        error: 'IPFS服务初始化失败',
        details: 'Pinata服务不可用'
      }, { status: 503 })
    }
    
    // 获取网关健康报告
    const healthReport = await IPFSService.getGatewayHealthReport()
    console.log('📊 网关健康报告:', healthReport)
    
    return NextResponse.json({
      success: true,
      message: 'IPFS服务运行正常',
      data: {
        environment: envCheck,
        validation,
        serviceReady: isServiceReady,
        gatewayHealth: healthReport
      }
    })
    
  } catch (error) {
    console.error('❌ IPFS服务测试失败:', error)
    return NextResponse.json({
      success: false,
      error: 'IPFS服务测试失败',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 开始测试IPFS上传...')
    
    // 动态导入IPFS服务
    const { IPFSService } = await import('@/lib/ipfs')
    
    // 创建测试数据
    const testData = {
      message: 'IPFS服务测试',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
    
    // 测试JSON上传
    const ipfsHash = await IPFSService.uploadJSON(testData, {
      name: 'ipfs-test.json',
      description: 'IPFS服务测试文件'
    })
    
    console.log('✅ 测试上传成功，IPFS Hash:', ipfsHash)
    
    // 测试数据获取
    const retrievedData = await IPFSService.getFromIPFS(ipfsHash)
    console.log('✅ 测试获取成功:', retrievedData)
    
    return NextResponse.json({
      success: true,
      message: 'IPFS上传测试成功',
      data: {
        uploadedHash: ipfsHash,
        retrievedData,
        gatewayUrl: IPFSService.getGatewayURL(ipfsHash)
      }
    })
    
  } catch (error) {
    console.error('❌ IPFS上传测试失败:', error)
    return NextResponse.json({
      success: false,
      error: 'IPFS上传测试失败',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}