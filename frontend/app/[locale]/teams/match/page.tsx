'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { 
  Search, 
  Users, 
  Settings, 
  Target, 
  Sparkles, 
  UserPlus, 
  Heart, 
  Brain, 
  Zap, 
  Globe2,
  Clock,
  Star,
  TrendingUp,
  Filter,
  Loader2,
  Shield,
  Crown,
  Activity
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { AuthGuard } from '@/components/auth/auth-guard'

// 模拟数据类型
interface TeamMatch {
  id: string
  name: string
  description: string
  leader: {
    id: string
    name: string
    avatarUrl?: string
  }
  members: Array<{
    id: string
    name: string
    avatarUrl?: string
  }>
  hackathon: {
    id: string
    title: string
  }
  skills: string[]
  status: string
  maxMembers: number
  matchInfo: {
    score: number
    matchingSkills: string[]
    availableSlots: number
    pendingApplications: number
  }
}

interface UserPreferences {
  requiredSkills: string[]
  preferredSkills: string[]
  skillMatchWeight: number
  minExperience: string
  maxExperience: string
  experienceWeight: number
  preferredTimezones: string[]
  locationFlexible: boolean
  locationWeight: number
  communicationStyle: string[]
  workingHours: Record<string, string>
  collaborationStyle: string
  preferredTeamSize: number
  maxTeamSize: number
  projectTypes: string[]
  technologyStacks: string[]
  difficultyLevel: string
  personalityMatch: boolean
  diversityPreference: string
  leadershipStyle?: string
  isActive: boolean
  autoAcceptThreshold: number
  notifyOnMatch: boolean
}

// 兼容性组件
const CompatibilityMeter = ({ score }: { score: number }) => {
  const tMatch = useTranslations('teams.matching')
  
  const getColor = (score: number) => {
    if (score >= 0.8) return 'from-green-500 to-emerald-500'
    if (score >= 0.6) return 'from-blue-500 to-cyan-500'
    if (score >= 0.4) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-pink-500'
  }

  const getText = (score: number) => {
    if (score >= 0.8) return tMatch('highMatch')
    if (score >= 0.6) return tMatch('goodMatch')
    if (score >= 0.4) return tMatch('averageMatch')
    return tMatch('lowMatch')
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>{tMatch('compatibility')}</span>
        <span className="font-medium">{Math.round(score * 100)}%</span>
      </div>
      <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${getColor(score)} transition-all duration-500`}
          style={{ width: `${score * 100}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{getText(score)}</span>
    </div>
  )
}

// 团队匹配卡片组件
const TeamMatchCard = ({ team, onViewDetails, onApply }: { 
  team: TeamMatch
  onViewDetails: (team: TeamMatch) => void
  onApply: (team: TeamMatch) => void
}) => {
  const tMatch = useTranslations('teams.matching')
  return (
    <Card className="glass border border-primary/10 hover:border-primary/30 hover-lift hover-glow transition-all duration-500 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-2xl" />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {team.name}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {team.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
              <Target className="w-3 h-3 mr-1" />
              {tMatch('recruiting')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 黑客松信息 */}
        <div className="flex items-center gap-2 p-2 glass rounded-xl border border-primary/10">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{team.hackathon.title}</span>
        </div>

        {/* 兼容性评分 */}
        <CompatibilityMeter score={team.matchInfo.score} />

        {/* 匹配技能 */}
        {team.matchInfo.matchingSkills.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="h-3 w-3" />
              {tMatch('matchingSkills')}
            </div>
            <div className="flex flex-wrap gap-1">
              {team.matchInfo.matchingSkills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs border-green-200 text-green-700">
                  {skill}
                </Badge>
              ))}
              {team.matchInfo.matchingSkills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{team.matchInfo.matchingSkills.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* 团队信息 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span>
              {team.members.length}/{team.maxMembers} {tMatch('members')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-yellow-500" />
            <span>{team.matchInfo.availableSlots} {tMatch('slots')}</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 glass hover-lift border-primary/30"
            onClick={() => onViewDetails(team)}
          >
            <Activity className="h-4 w-4 mr-2" />
            {tMatch('viewDetails')}
          </Button>
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90 hover-lift hover-glow"
            onClick={() => onApply(team)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {tMatch('applyToJoin')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// 匹配偏好设置组件
const MatchingPreferences = ({ 
  preferences, 
  onSave, 
  isOpen, 
  onClose 
}: {
  preferences: UserPreferences
  onSave: (preferences: UserPreferences) => void
  isOpen: boolean
  onClose: () => void
}) => {
  const tMatch = useTranslations('teams.matching')
  const [localPreferences, setLocalPreferences] = useState<UserPreferences>(preferences)

  const handleSave = () => {
    onSave(localPreferences)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] glass border border-primary/20 rounded-3xl p-0 overflow-hidden max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-primary rounded-2xl">
                <Settings className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gradient">
                  {tMatch('preferencesTitle')}
                </DialogTitle>
                <DialogDescription>
                  {tMatch('preferencesDescription')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* 技能偏好 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                {tMatch('skillMatching')}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="required-skills">{tMatch('requiredSkills')}</Label>
                  <Input
                    id="required-skills"
                    placeholder="请输入技能，用逗号分隔"
                    value={localPreferences.requiredSkills.join(', ')}
                    onChange={(e) => setLocalPreferences({
                      ...localPreferences,
                      requiredSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="glass border-primary/20"
                  />
                </div>
                
                <div>
                  <Label htmlFor="preferred-skills">{tMatch('preferredSkills')}</Label>
                  <Input
                    id="preferred-skills"
                    placeholder="请输入技能，用逗号分隔"
                    value={localPreferences.preferredSkills.join(', ')}
                    onChange={(e) => setLocalPreferences({
                      ...localPreferences,
                      preferredSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="glass border-primary/20"
                  />
                </div>

                <div>
                  <Label>{tMatch('skillWeight')}: {Math.round(localPreferences.skillMatchWeight * 100)}%</Label>
                  <Slider
                    value={[localPreferences.skillMatchWeight]}
                    onValueChange={(value) => setLocalPreferences({
                      ...localPreferences,
                      skillMatchWeight: value[0]
                    })}
                    max={1}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            {/* 经验要求 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                {tMatch('experienceRequirements')}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>最低经验</Label>
                  <Select 
                    value={localPreferences.minExperience} 
                    onValueChange={(value) => setLocalPreferences({
                      ...localPreferences,
                      minExperience: value
                    })}
                  >
                    <SelectTrigger className="glass border-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">初学者</SelectItem>
                      <SelectItem value="intermediate">中级</SelectItem>
                      <SelectItem value="advanced">高级</SelectItem>
                      <SelectItem value="expert">专家</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>最高经验</Label>
                  <Select 
                    value={localPreferences.maxExperience} 
                    onValueChange={(value) => setLocalPreferences({
                      ...localPreferences,
                      maxExperience: value
                    })}
                  >
                    <SelectTrigger className="glass border-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">初学者</SelectItem>
                      <SelectItem value="intermediate">中级</SelectItem>
                      <SelectItem value="advanced">高级</SelectItem>
                      <SelectItem value="expert">专家</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 团队规模偏好 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                {tMatch('teamSize')}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>偏好团队规模: {localPreferences.preferredTeamSize} 人</Label>
                  <Slider
                    value={[localPreferences.preferredTeamSize]}
                    onValueChange={(value) => setLocalPreferences({
                      ...localPreferences,
                      preferredTeamSize: value[0]
                    })}
                    max={10}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>最大团队规模: {localPreferences.maxTeamSize} 人</Label>
                  <Slider
                    value={[localPreferences.maxTeamSize]}
                    onValueChange={(value) => setLocalPreferences({
                      ...localPreferences,
                      maxTeamSize: value[0]
                    })}
                    max={10}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            {/* 协作偏好 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                {tMatch('collaborationPreferences')}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <Label>协作风格</Label>
                  <Select 
                    value={localPreferences.collaborationStyle} 
                    onValueChange={(value) => setLocalPreferences({
                      ...localPreferences,
                      collaborationStyle: value
                    })}
                  >
                    <SelectTrigger className="glass border-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="structured">结构化</SelectItem>
                      <SelectItem value="flexible">灵活</SelectItem>
                      <SelectItem value="balanced">均衡</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>多样性偏好</Label>
                  <Select 
                    value={localPreferences.diversityPreference} 
                    onValueChange={(value) => setLocalPreferences({
                      ...localPreferences,
                      diversityPreference: value
                    })}
                  >
                    <SelectTrigger className="glass border-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="similar">相似背景</SelectItem>
                      <SelectItem value="diverse">多元化</SelectItem>
                      <SelectItem value="balanced">均衡</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 高级设置 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" />
                {tMatch('advancedSettings')}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>地理位置灵活</Label>
                  <Switch
                    checked={localPreferences.locationFlexible}
                    onCheckedChange={(checked) => setLocalPreferences({
                      ...localPreferences,
                      locationFlexible: checked
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>考虑性格匹配</Label>
                  <Switch
                    checked={localPreferences.personalityMatch}
                    onCheckedChange={(checked) => setLocalPreferences({
                      ...localPreferences,
                      personalityMatch: checked
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>启用匹配通知</Label>
                  <Switch
                    checked={localPreferences.notifyOnMatch}
                    onCheckedChange={(checked) => setLocalPreferences({
                      ...localPreferences,
                      notifyOnMatch: checked
                    })}
                  />
                </div>
                
                <div>
                  <Label>自动接受阈值: {Math.round(localPreferences.autoAcceptThreshold * 100)}%</Label>
                  <Slider
                    value={[localPreferences.autoAcceptThreshold]}
                    onValueChange={(value) => setLocalPreferences({
                      ...localPreferences,
                      autoAcceptThreshold: value[0]
                    })}
                    max={1}
                    min={0.5}
                    step={0.05}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-3 mt-8 pt-6 border-t border-primary/10">
            <Button
              variant="outline"
              onClick={onClose}
              className="glass hover-lift border-primary/30"
            >
              {tMatch('cancel')}
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 hover-lift hover-glow"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {tMatch('saveSettings')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function TeamMatchPage() {
  const t = useTranslations('teams')
  const tMatch = useTranslations('teams.matching')
  const tCommon = useTranslations('common')
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('recommendations')
  const [loading, setLoading] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [selectedHackathon, setSelectedHackathon] = useState<string>('all')
  
  // 模拟数据
  const [matches, setMatches] = useState<TeamMatch[]>([])
  const [suitableTeams, setSuitableTeams] = useState<TeamMatch[]>([])
  const [preferences, setPreferences] = useState<UserPreferences>({
    requiredSkills: [],
    preferredSkills: [],
    skillMatchWeight: 0.4,
    minExperience: 'beginner',
    maxExperience: 'expert',
    experienceWeight: 0.2,
    preferredTimezones: [],
    locationFlexible: true,
    locationWeight: 0.1,
    communicationStyle: [],
    workingHours: {},
    collaborationStyle: 'balanced',
    preferredTeamSize: 4,
    maxTeamSize: 6,
    projectTypes: [],
    technologyStacks: [],
    difficultyLevel: 'medium',
    personalityMatch: false,
    diversityPreference: 'balanced',
    isActive: true,
    autoAcceptThreshold: 0.8,
    notifyOnMatch: true
  })

  // 页面进入动画
  useEffect(() => {
    setIsVisible(true)
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟推荐数据
      const mockMatches: TeamMatch[] = [
        {
          id: '1',
          name: 'AI创新小队',
          description: '专注于人工智能和机器学习应用开发，寻找有激情的开发者加入我们的团队',
          leader: { id: 'u1', name: 'Alice Chen' },
          members: [
            { id: 'u2', name: 'Bob Wang' },
            { id: 'u3', name: 'Carol Li' }
          ],
          hackathon: { id: 'h1', title: 'AI Innovation Hackathon 2024' },
          skills: ['Python', 'TensorFlow', 'React', 'Node.js'],
          status: 'RECRUITING',
          maxMembers: 5,
          matchInfo: {
            score: 0.85,
            matchingSkills: ['Python', 'React', 'Node.js'],
            availableSlots: 2,
            pendingApplications: 3
          }
        },
        {
          id: '2',
          name: 'Web3先锋队',
          description: '构建下一代去中心化应用，需要区块链和前端开发专家',
          leader: { id: 'u4', name: 'David Zhang' },
          members: [
            { id: 'u5', name: 'Eva Liu' }
          ],
          hackathon: { id: 'h2', title: 'Web3 Future Hackathon' },
          skills: ['Solidity', 'JavaScript', 'React', 'Web3.js'],
          status: 'RECRUITING',
          maxMembers: 4,
          matchInfo: {
            score: 0.72,
            matchingSkills: ['JavaScript', 'React'],
            availableSlots: 2,
            pendingApplications: 1
          }
        }
      ]
      
      setMatches(mockMatches)
      setSuitableTeams(mockMatches)
    } catch (error) {
      toast({
        title: tMatch('loadingFailed'),
        description: tMatch('loadingFailedDesc'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (team: TeamMatch) => {
    // 跳转到团队详情页
    window.open(`/teams/${team.id}`, '_blank')
  }

  const handleApply = (team: TeamMatch) => {
    if (!user) {
      toast({
        title: tMatch('loginRequired'),
        description: tMatch('loginRequiredDesc'),
        variant: 'destructive'
      })
      return
    }

    toast({
      title: tMatch('applicationSubmitted'),
      description: `${tMatch('applicationSubmittedDesc')} "${team.name}"`,
    })
  }

  const handleSavePreferences = (newPreferences: UserPreferences) => {
    setPreferences(newPreferences)
    toast({
      title: tMatch('settingsSaved'),
      description: tMatch('settingsSavedDesc'),
    })
    loadRecommendations()
  }

  return (
    <AuthGuard>
      <div className="relative min-h-screen">
        {/* 动态背景 */}
        <div className="absolute inset-0 gradient-mesh opacity-15 -z-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/90 to-background -z-10" />

        <div className="container py-8 relative">
          <div className="space-y-8">
            {/* 页面头部 */}
            <div className={`transition-all duration-1000 ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-primary rounded-2xl">
                      <Target className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="text-responsive-lg font-bold text-gradient animate-shimmer">
                        {tMatch('pageTitle')}
                      </h1>
                      <p className="text-muted-foreground leading-relaxed">
                        {tMatch('pageDescription')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    className="glass hover-lift border-primary/30"
                    onClick={() => setShowPreferences(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {tMatch('matchingSettings')}
                  </Button>
                </div>
              </div>
            </div>

            {/* 筛选器 */}
            <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`}>
              <div className="glass border border-primary/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Filter className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold">{tMatch('filterConditions')}</h3>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <Select value={selectedHackathon} onValueChange={setSelectedHackathon}>
                    <SelectTrigger className="w-full md:w-64 glass border-primary/20">
                      <SelectValue placeholder={tMatch('selectHackathon')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tMatch('allHackathons')}</SelectItem>
                      <SelectItem value="h1">AI Innovation Hackathon 2024</SelectItem>
                      <SelectItem value="h2">Web3 Future Hackathon</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    className="glass hover-lift border-primary/30"
                    onClick={loadRecommendations}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    {tMatch('refreshRecommendations')}
                  </Button>
                </div>
              </div>
            </div>

            {/* 主要内容 */}
            <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'}`}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="glass border border-primary/10 rounded-2xl p-2">
                  <TabsList className="grid w-full grid-cols-2 bg-transparent gap-1 border-0">
                    <TabsTrigger 
                      value="recommendations"
                      className="glass hover-lift transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-white"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {tMatch('aiRecommendations')}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="suitable"
                      className="glass hover-lift transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-white"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {tMatch('suitableTeams')}
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* AI推荐标签页 */}
                <TabsContent value="recommendations" className="space-y-6 animate-fade-in">
                  {loading ? (
                    <div className="glass border border-primary/10 rounded-2xl p-12 text-center">
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-primary rounded-2xl w-fit mx-auto">
                          <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
                        </div>
                        <p className="text-muted-foreground">{tMatch('matchingTeams')}</p>
                      </div>
                    </div>
                  ) : matches.length === 0 ? (
                    <div className="glass border border-primary/10 rounded-2xl p-12 text-center">
                      <div className="space-y-6">
                        <div className="p-4 bg-gradient-primary rounded-2xl w-fit mx-auto">
                          <Target className="h-12 w-12 text-primary-foreground" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">{tMatch('noMatches')}</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {tMatch('noMatchesDescription')}
                          </p>
                        </div>
                        <Button 
                          className="bg-primary hover:bg-primary/90 hover-lift hover-glow"
                          onClick={() => setShowPreferences(true)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          {tMatch('adjustPreferences')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {matches.map((team, index) => (
                        <div
                          key={team.id}
                          className="animate-scale-in"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <TeamMatchCard
                            team={team}
                            onViewDetails={handleViewDetails}
                            onApply={handleApply}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* 适合团队标签页 */}
                <TabsContent value="suitable" className="space-y-6 animate-fade-in">
                  {suitableTeams.length === 0 ? (
                    <div className="glass border border-primary/10 rounded-2xl p-12 text-center">
                      <div className="space-y-6">
                        <div className="p-4 bg-gradient-primary rounded-2xl w-fit mx-auto">
                          <Users className="h-12 w-12 text-primary-foreground" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">{tMatch('noSuitableTeams')}</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {tMatch('noSuitableTeamsDescription')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {suitableTeams.map((team, index) => (
                        <div
                          key={team.id}
                          className="animate-scale-in"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <TeamMatchCard
                            team={team}
                            onViewDetails={handleViewDetails}
                            onApply={handleApply}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* 偏好设置对话框 */}
        <MatchingPreferences
          preferences={preferences}
          onSave={handleSavePreferences}
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
        />
      </div>
    </AuthGuard>
  )
}
