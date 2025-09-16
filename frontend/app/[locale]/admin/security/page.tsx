'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContentModerationPanel } from '@/components/security/content-moderation'
import { SecurityRulesPanel } from '@/components/security/security-rules'
import { UserSecurityProfilePanel } from '@/components/security/user-security-profile'

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">安全管理中心</h1>
          <p className="text-gray-600">管理平台安全规则、内容审核和用户风险评估</p>
        </div>

        <Tabs defaultValue="moderation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="moderation">内容审核</TabsTrigger>
            <TabsTrigger value="rules">安全规则</TabsTrigger>
            <TabsTrigger value="users">用户档案</TabsTrigger>
          </TabsList>

          <TabsContent value="moderation">
            <ContentModerationPanel />
          </TabsContent>

          <TabsContent value="rules">
            <SecurityRulesPanel />
          </TabsContent>

          <TabsContent value="users">
            <UserSecurityProfilePanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
