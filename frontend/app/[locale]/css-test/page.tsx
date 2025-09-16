import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CSSTestPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">CSS 加载测试页面</h1>
        <p className="text-muted-foreground">这个页面用于测试 Tailwind CSS 和 shadcn/ui 组件是否正常工作</p>
      </div>

      {/* 基础 Tailwind 样式测试 */}
      <Card>
        <CardHeader>
          <CardTitle>基础 Tailwind CSS 测试</CardTitle>
          <CardDescription>测试基本的 Tailwind 类是否生效</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary text-primary-foreground p-4 rounded-lg">
              Primary 背景色
            </div>
            <div className="bg-secondary text-secondary-foreground p-4 rounded-lg">
              Secondary 背景色
            </div>
            <div className="bg-muted text-muted-foreground p-4 rounded-lg">
              Muted 背景色
            </div>
          </div>
        </CardContent>
      </Card>

      {/* shadcn/ui 组件测试 */}
      <Card>
        <CardHeader>
          <CardTitle>shadcn/ui 组件测试</CardTitle>
          <CardDescription>测试 shadcn/ui 组件是否正常渲染</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="default">默认按钮</Button>
            <Button variant="secondary">次要按钮</Button>
            <Button variant="outline">轮廓按钮</Button>
            <Button variant="destructive">危险按钮</Button>
          </div>
        </CardContent>
      </Card>

      {/* 响应式测试 */}
      <Card>
        <CardHeader>
          <CardTitle>响应式布局测试</CardTitle>
          <CardDescription>测试响应式类是否正常工作</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg">
              网格项 1
            </div>
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 rounded-lg">
              网格项 2
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-red-500 text-white p-4 rounded-lg">
              网格项 3
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg">
              网格项 4
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 动画测试 */}
      <Card>
        <CardHeader>
          <CardTitle>动画和过渡测试</CardTitle>
          <CardDescription>测试 CSS 动画和过渡效果</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="hover:scale-105 transition-transform duration-200 bg-primary text-primary-foreground p-4 rounded-lg cursor-pointer">
              悬停缩放
            </div>
            <div className="animate-pulse bg-secondary text-secondary-foreground p-4 rounded-lg">
              脉冲动画
            </div>
            <div className="hover:bg-accent hover:text-accent-foreground transition-colors duration-200 p-4 rounded-lg border cursor-pointer">
              颜色过渡
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 深色模式测试 */}
      <Card>
        <CardHeader>
          <CardTitle>深色模式测试</CardTitle>
          <CardDescription>测试深色模式切换（需要在头部切换主题）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-card text-card-foreground">
            <p>这个区域应该根据当前主题显示正确的颜色</p>
            <p className="text-muted-foreground mt-2">这是次要文本颜色</p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        如果你能看到以上所有样式都正确显示，说明 CSS 配置成功！
      </div>
    </div>
  )
}
