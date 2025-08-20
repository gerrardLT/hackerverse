import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Users, Trophy, Clock, ArrowRight } from 'lucide-react'

interface Hackathon {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  status: 'upcoming' | 'ongoing' | 'ended'
  participants: number
  totalPrize: string
  organizer: {
    name: string
    avatar: string
  }
  tags: string[]
  coverImage: string
}

interface HackathonCardProps {
  hackathon: Hackathon
}

export function HackathonCard({ hackathon }: HackathonCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500'
      case 'ongoing': return 'bg-green-500'
      case 'ended': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return '即将开始'
      case 'ongoing': return '进行中'
      case 'ended': return '已结束'
      default: return '未知'
    }
  }

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={hackathon.coverImage || "/placeholder.svg"}
          alt={hackathon.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 left-4">
          <Badge className={`${getStatusColor(hackathon.status)} text-white`}>
            {getStatusText(hackathon.status)}
          </Badge>
        </div>
        {hackathon.status === 'upcoming' && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
            <Clock className="inline h-3 w-3 mr-1" />
            {getDaysUntil(hackathon.startDate)} 天后开始
          </div>
        )}
      </div>
      
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={hackathon.organizer.avatar || "/placeholder.svg"} />
            <AvatarFallback>{hackathon.organizer.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{hackathon.organizer.name}</span>
        </div>
        <h3 className="text-xl font-semibold line-clamp-2">{hackathon.title}</h3>
        <p className="text-muted-foreground text-sm line-clamp-2">{hackathon.description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1">
          {/* 安全处理tags字段 */}
          {(() => {
            // 确保tags是数组
            const tags = Array.isArray(hackathon.tags) ? hackathon.tags : []
            const displayTags = tags.slice(0, 3)
            
            return (
              <>
                {displayTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{tags.length - 3}
                  </Badge>
                )}
              </>
            )
          })()}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {hackathon.participants.toLocaleString()} 参与者
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            {hackathon.totalPrize}
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {new Date(hackathon.startDate).toLocaleDateString('zh-CN')} - {new Date(hackathon.endDate).toLocaleDateString('zh-CN')}
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/hackathons/${hackathon.id}`}>
            查看详情
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
