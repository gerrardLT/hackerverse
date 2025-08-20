"use client"

import React, { useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { useWeb3Auth } from '@/hooks/use-web3-auth'
import { useToast } from '@/hooks/use-toast'
import { User, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

interface UserRegistrationProps {
  onSuccess?: () => void
  className?: string
}

export function UserRegistration({ onSuccess, className }: UserRegistrationProps) {
  const { user, registerUser, loading } = useWeb3Auth()
  const { toast } = useToast()
  const [username, setUsername] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: "错误",
        description: "请先连接钱包",
        variant: "destructive"
      })
      return
    }

    if (!username) {
      toast({
        title: "错误",
        description: "请填写用户名",
        variant: "destructive"
      })
      return
    }

    try {
      // 简化的用户资料CID (实际应该上传到IPFS)
      const profileCID = `QmUserProfile${Date.now()}`
      const success = await registerUser(profileCID)
      
      if (success) {
        toast({
          title: "注册成功",
          description: "用户已注册到区块链",
        })
        onSuccess?.()
      }
    } catch (error) {
      console.error('用户注册失败:', error)
      toast({
        title: "注册失败",
        description: "请稍后重试",
        variant: "destructive"
      })
    }
  }

  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>用户注册</span>
          </CardTitle>
          <CardDescription>
            请先连接钱包以注册用户
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>用户注册</span>
        </CardTitle>
        <CardDescription>
          注册用户资料到去中心化平台
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">用户名 *</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {loading ? '注册中...' : '注册用户'}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>钱包地址:</strong> {user.address}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>注册状态:</strong> {user.isRegistered ? '已注册' : '未注册'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 