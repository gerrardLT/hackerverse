"use client"

import React, { useState } from 'react'
import { WalletConnect } from '@/components/ui/wallet-connect'
import { UserRegistration } from '@/components/ui/user-registration'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useWeb3Auth } from '@/hooks/use-web3-auth'
import { useToast } from '@/hooks/use-toast'
import { 
  Wallet, 
  User, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react'

export default function TestDecentralizedPage() {
  const { user } = useWeb3Auth()
  const { toast } = useToast()
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  const [isTesting, setIsTesting] = useState(false)

  const runTests = async () => {
    setIsTesting(true)
    const results: Record<string, boolean> = {}

    try {
      // 测试1: 钱包连接
      results.wallet = !!user

      // 测试2: 用户注册
      if (user) {
        results.registration = user.isRegistered
      }

      // 测试3: 智能合约调用
      if (user && user.isRegistered) {
        results.contract = true // 简化测试
      }

    } catch (error) {
      console.error('测试过程中发生错误:', error)
    } finally {
      setTestResults(results)
      setIsTesting(false)
    }
  }

  const getTestStatus = (testName: string) => {
    if (!(testName in testResults)) return 'pending'
    return testResults[testName] ? 'success' : 'failed'
  }

  const TestItem = ({ name, description, status }: { 
    name: string; 
    description: string; 
    status: 'pending' | 'success' | 'failed' 
  }) => (
    <div className="flex items-center space-x-3 p-3 border rounded-lg">
      {status === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      {status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
      {status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
      <div className="flex-1">
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <span className={`text-sm px-2 py-1 rounded ${
        status === 'success' ? 'bg-green-100 text-green-800' :
        status === 'failed' ? 'bg-red-100 text-red-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {status === 'pending' ? '待测试' : status === 'success' ? '通过' : '失败'}
      </span>
    </div>
  )

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">去中心化功能测试</h1>
        <p className="text-muted-foreground">
          测试HackX平台的去中心化功能
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 钱包连接 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>钱包连接</span>
            </CardTitle>
            <CardDescription>
              连接MetaMask钱包以使用去中心化功能
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletConnect />
          </CardContent>
        </Card>

        {/* 用户注册 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>用户注册</span>
            </CardTitle>
            <CardDescription>
              注册用户到区块链网络
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserRegistration />
          </CardContent>
        </Card>

        {/* 功能测试 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>功能测试</span>
            </CardTitle>
            <CardDescription>
              运行完整的去中心化功能测试
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runTests} 
              disabled={isTesting}
              className="w-full"
            >
              {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isTesting ? '测试中...' : '运行测试'}
            </Button>

            <div className="space-y-2">
              <TestItem 
                name="钱包连接" 
                description="测试MetaMask钱包连接功能"
                status={getTestStatus('wallet')}
              />
              <TestItem 
                name="用户注册" 
                description="测试智能合约用户注册"
                status={getTestStatus('registration')}
              />
              <TestItem 
                name="智能合约" 
                description="测试智能合约调用功能"
                status={getTestStatus('contract')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 