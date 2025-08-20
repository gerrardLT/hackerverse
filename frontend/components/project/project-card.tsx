import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, Users, Trophy, ExternalLink, Github, Play, Heart, Eye } from 'lucide-react'
import { type Project } from '@/lib/api'

interface ProjectCardProps {
  project: Project
  onLike?: () => void
}

export function ProjectCard({ project, onLike }: ProjectCardProps) {
  const getStatusBadge = () => {
    // 根据项目状态显示不同的徽章
    if (project.status === 'winner') {
      return (
        <Badge className="bg-yellow-500 text-white">
          <Trophy className="h-3 w-3 mr-1" />
          获奖项目
        </Badge>
      )
    }
    if (project.status === 'featured') {
      return (
        <Badge className="bg-blue-500 text-white">
          <Star className="h-3 w-3 mr-1" />
          精选项目
        </Badge>
      )
    }
    return null
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative">
        <img
          src="/placeholder.svg?height=200&width=400"
          alt={project.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 left-4">
          {getStatusBadge()}
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          {project.demoUrl && (
            <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
          {project.githubUrl && (
            <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Github className="h-3 w-3" />
            </Button>
          )}
          {project.videoUrl && (
            <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {project.hackathon?.title || '未知黑客松'}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="h-3 w-3" />
            <span>{project._count?.projectLikes || 0}</span>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
            <Link href={`/projects/${project.id}`}>
              {project.title}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* 技术栈 */}
        <div className="flex flex-wrap gap-1">
          {project.technologies?.slice(0, 3).map((tech: string) => (
            <Badge key={tech} variant="secondary" className="text-xs">
              {tech}
            </Badge>
          ))}
          {project.technologies && project.technologies.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{project.technologies.length - 3}
            </Badge>
          )}
        </div>
        
        {/* 团队信息 */}
        {project.team && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{project.team.name}</span>
          </div>
        )}
        
        {/* 评分和点赞 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>4.5</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onLike}
              className="flex items-center gap-1"
            >
              <Heart className="h-3 w-3" />
              <span>{project._count?.projectLikes || 0}</span>
            </Button>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span>创建于 {new Date(project.createdAt).toLocaleDateString('zh-CN')}</span>
          <div className="flex items-center gap-2">
            {project.demoUrl && (
              <Link href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  演示
                </Button>
              </Link>
            )}
            {project.githubUrl && (
              <Link href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  <Github className="h-3 w-3 mr-1" />
                  代码
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
