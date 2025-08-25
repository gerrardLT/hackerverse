import { NextRequest, NextResponse } from 'next/server'
import { IPFSService } from '@/lib/ipfs'

/**
 * 测试Pinata IPFS配置和连接
 * GET /api/ipfs/test
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 开始测试Pinata IPFS配置...')
    
    // 1. 测试IPFS服务状态
    const statusCheck = await IPFSService.checkStatus()
    if (!statusCheck) {
      return NextResponse.json({
        success: false,
        error: 'IPFS服务不可用',
        details: '无法初始化Pinata客户端'
      }, { status: 500 })
    }

    // 2. 测试JSON上传
    const testData = {
      message: 'Hello from HackX!',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }

    console.log('🧪 测试JSON上传...')
    const jsonCID = await IPFSService.uploadJSON(testData, {
      name: 'test-data.json',
      description: 'Test data for Pinata configuration',
      tags: ['test', 'configuration'],
      version: '1.0.0',
      author: 'system'
    })

    // 3. 测试数据获取
    console.log('🧪 测试数据获取...')
    const retrievedData = await IPFSService.getFromIPFS(jsonCID)

    // 4. 验证数据完整性
    const isValid = retrievedData && 
                   retrievedData.message === testData.message &&
                   retrievedData.timestamp === testData.timestamp

    const result = {
      success: true,
      message: 'Pinata IPFS配置测试完成',
      results: {
        statusCheck: {
          passed: statusCheck,
          message: statusCheck ? '✅ 服务可用' : '❌ 服务不可用'
        },
        upload: {
          passed: !!jsonCID,
          cid: jsonCID,
          message: jsonCID ? '✅ 上传成功' : '❌ 上传失败'
        },
        retrieval: {
          passed: !!retrievedData,
          message: retrievedData ? '✅ 获取成功' : '❌ 获取失败'
        },
        dataIntegrity: {
          passed: isValid,
          message: isValid ? '✅ 数据完整' : '❌ 数据不匹配'
        }
      },
      testData: {
        uploaded: testData,
        retrieved: retrievedData,
        cid: jsonCID
      },
      environment: {
        hasJWT: !!process.env.PINATA_JWT,
        hasAPIKey: !!process.env.PINATA_API_KEY,
        hasGateway: !!process.env.PINATA_GATEWAY,
        gateway: process.env.PINATA_GATEWAY
      }
    }

    console.log('✅ Pinata配置测试完成:', result.results)
    
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('❌ Pinata配置测试失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '配置测试失败',
      details: error instanceof Error ? error.message : String(error),
      environment: {
        hasJWT: !!process.env.PINATA_JWT,
        hasAPIKey: !!process.env.PINATA_API_KEY,
        hasGateway: !!process.env.PINATA_GATEWAY,
        gateway: process.env.PINATA_GATEWAY
      }
    }, { status: 500 })
  }
}

/**
 * 测试文件上传
 * POST /api/ipfs/test
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 开始测试文件上传...')
    
    // 创建测试文件
    const testContent = JSON.stringify({
      message: 'Test file upload',
      timestamp: new Date().toISOString(),
      type: 'test-file'
    }, null, 2)
    
    const testBuffer = Buffer.from(testContent, 'utf8')
    const filename = `test-file-${Date.now()}.json`
    
    // 测试文件上传
    const fileResult = await IPFSService.uploadFile(testBuffer, filename)
    
    // 验证上传结果
    const isValid = fileResult.hash && fileResult.url && fileResult.name === filename
    
    return NextResponse.json({
      success: true,
      message: '文件上传测试完成',
      result: {
        passed: isValid,
        file: fileResult,
        message: isValid ? '✅ 文件上传成功' : '❌ 文件上传失败'
      }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ 文件上传测试失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '文件上传测试失败',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
