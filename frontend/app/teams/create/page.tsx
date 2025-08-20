'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Users, Plus, X, ArrowLeft, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TeamFormData {
  name: string
  description: string
  hackathonId: string
  maxMembers: number
  techStack: string[]
  lookingFor: string[]
  location: string
  isPublic: boolean
  contactInfo: string
  projectIdea: string
}

const techStackOptions = [
  'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'Go', 'Rust',
  'Solidity', 'Web3.js', 'Ethers.js', 'Hardhat', 'Truffle', 'IPFS',
  'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS',
  'TypeScript', 'JavaScript', 'HTML/CSS', 'Tailwind CSS', 'Next.js'
]

const roleOptions = [
  '前端开发', '后端开发', '全栈开发', '区块链开发', 'UI/UX 设计师',
  '产品经理', '数据科学家', '机器学习工程师', '移动端开发', 'DevOps 工程师',
  '测试工程师', '技术写作', '市场营销', '商务拓展'
]

const hackathonOptions = [
  { id: '1', name: 'Web3 创新大赛', deadline: '2024-02-15' },
  { id: '2', name: 'AI + Blockchain 黑客松', deadline: '2024-02-20' },
  { id: '3', name: 'GameFi 创新挑战', deadline: '2024-02-25' },
  { id: '4', name: 'DeFi 协议大赛', deadline: '2024-03-01' }
]

export default function CreateTeamPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    hackathonId: '',
    maxMembers: 4,
    techStack: [],
    lookingFor: [],
    location: '',
    isPublic: true,
    contactInfo: '',
    projectIdea: ''
  })

  const [newTech, setNewTech] = useState('')
  const [newRole, setNewRole] = useState('')

  const handleInputChange = (field: keyof TeamFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addTechStack = (tech: string) => {
    if (tech && !formData.techStack.includes(tech)) {
      setFormData(prev => ({
        ...prev,
        techStack: [...prev.techStack, tech]
      }))
    }
    setNewTech('')
  }

  const removeTechStack = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.filter(t => t !== tech)
    }))
  }

  const addLookingFor = (role: string) => {
    if (role && !formData.lookingFor.includes(role)) {
      setFormData(prev => ({
        ...prev,
        lookingFor: [...prev.lookingFor, role]
      }))
    }
    setNewRole('')
  }

  const removeLookingFor = (role: string) => {
    setFormData(prev => ({
      ...prev,
      lookingFor: prev.lookingFor.filter(r => r !== role)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.description || !formData.hackathonId) {
      toast({
        title: "请填写必填信息",
        description: "团队名称、描述和黑客松选择为必填项",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // 模拟创建团队
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "团队创建成功！",
        description: "你的团队已成功创建，现在可以开始招募成员了"
      })
      
      router.push('/teams')
    } catch (error) {
      toast({
        title: "创建失败",
        description: "团队创建过程中出现错误，请重试",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedHackathon = hackathonOptions.find(h => h.id === formData.hackathonId)

  if (showPreview) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回编辑
            </Button>
            <h1 className="text-2xl font-bold">团队预览</h1>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{formData.name}</CardTitle>
                  <CardDescription>{formData.description}</CardDescription>
                </div>
                <Badge variant="default">招募中</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>🏆 {selectedHackathon?.name}</span>
                <span>📍 {formData.location}</span>
                <span>👥 1/{formData.maxMembers} 成员</span>
              </div>

              {formData.techStack.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">技术栈</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.techStack.map(tech => (
                      <Badge key={tech} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.lookingFor.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">招募职位</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.lookingFor.map(role => (
                      <Badge key={role} variant="outline">{role}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.projectIdea && (
                <div>
                  <h4 className="font-medium mb-2">项目想法</h4>
                  <p className="text-sm text-muted-foreground">{formData.projectIdea}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button className="flex-1">申请加入团队</Button>
                <Button variant="outline">联系队长</Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              继续编辑
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '创建中...' : '确认创建'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        {/* 页面头部 */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Users className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">创建团队</h1>
            <p className="text-muted-foreground">
              组建你的梦之队，一起参加黑客松
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>
                设置团队的基本信息和参赛黑客松
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">团队名称 *</Label>
                <Input
                  id="name"
                  placeholder="输入团队名称"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">团队描述 *</Label>
                <Textarea
                  id="description"
                  placeholder="描述你的团队理念、目标和特色..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hackathon">参赛黑客松 *</Label>
                <Select value={formData.hackathonId} onValueChange={(value) => handleInputChange('hackathonId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择要参加的黑客松" />
                  </SelectTrigger>
                  <SelectContent>
                    {hackathonOptions.map(hackathon => (
                      <SelectItem key={hackathon.id} value={hackathon.id}>
                        <div className="flex flex-col">
                          <span>{hackathon.name}</span>
                          <span className="text-xs text-muted-foreground">
                            截止时间: {hackathon.deadline}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxMembers">团队规模</Label>
                  <Select value={formData.maxMembers.toString()} onValueChange={(value) => handleInputChange('maxMembers', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">3 人团队</SelectItem>
                      <SelectItem value="3">4 人团队</SelectItem>
                      <SelectItem value="4">5 人团队</SelectItem>
                      <SelectItem value="5">6 人团队</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">所在地</Label>
                  <Input
                    id="location"
                    placeholder="如：北京、上海、远程"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 技术栈 */}
          <Card>
            <CardHeader>
              <CardTitle>技术栈</CardTitle>
              <CardDescription>
                选择团队将使用的技术栈
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={newTech} onValueChange={setNewTech}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="选择技术栈" />
                  </SelectTrigger>
                  <SelectContent>
                    {techStackOptions.filter(tech => !formData.techStack.includes(tech)).map(tech => (
                      <SelectItem key={tech} value={tech}>{tech}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={() => addTechStack(newTech)} disabled={!newTech}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.techStack.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.techStack.map(tech => (
                    <Badge key={tech} variant="secondary" className="flex items-center gap-1">
                      {tech}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTechStack(tech)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 招募需求 */}
          <Card>
            <CardHeader>
              <CardTitle>招募需求</CardTitle>
              <CardDescription>
                你希望招募什么样的队友？
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="选择招募职位" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.filter(role => !formData.lookingFor.includes(role)).map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={() => addLookingFor(newRole)} disabled={!newRole}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.lookingFor.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.lookingFor.map(role => (
                    <Badge key={role} variant="outline" className="flex items-center gap-1">
                      {role}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeLookingFor(role)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 项目想法 */}
          <Card>
            <CardHeader>
              <CardTitle>项目想法</CardTitle>
              <CardDescription>
                分享你的项目想法，吸引志同道合的队友
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectIdea">项目描述</Label>
                <Textarea
                  id="projectIdea"
                  placeholder="描述你的项目想法、解决的问题、创新点..."
                  value={formData.projectIdea}
                  onChange={(e) => handleInputChange('projectIdea', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactInfo">联系方式</Label>
                <Input
                  id="contactInfo"
                  placeholder="微信、邮箱或其他联系方式"
                  value={formData.contactInfo}
                  onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 隐私设置 */}
          <Card>
            <CardHeader>
              <CardTitle>隐私设置</CardTitle>
              <CardDescription>
                控制团队的可见性
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="isPublic">公开团队</Label>
                  <p className="text-sm text-muted-foreground">允许其他用户搜索和查看你的团队</p>
                </div>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-2" />
              预览
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '创建中...' : '创建团队'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
