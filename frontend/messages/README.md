# 国际化文件管理系统

本项目采用模块化的国际化文件管理方式，将原本的大型 JSON 文件拆分成更易维护的小模块。

## 📁 文件结构

```
frontend/messages/
├── modules/                 # 模块化文件夹
│   ├── zh/                 # 中文模块
│   │   ├── common.json     # 通用词汇 (~100行)
│   │   ├── navigation.json # 导航 (~20行)
│   │   ├── auth.json       # 认证 (~130行)
│   │   ├── hackathons.json # 黑客松 (~500行)
│   │   ├── teams.json      # 团队 (~300行)
│   │   ├── projects.json   # 项目 (~120行)
│   │   ├── community.json  # 社区 (~350行)
│   │   ├── dashboard.json  # 仪表板 (~330行)
│   │   ├── admin.json      # 管理员 (~400行)
│   │   └── ...             # 其他模块
│   └── en/                 # 英文模块（结构相同）
│       └── ...
├── zh.json                 # 合并后的中文文件 (自动生成)
├── en.json                 # 合并后的英文文件 (自动生成)
└── README.md              # 本文档
```

## 🛠️ 可用脚本

在 `frontend` 目录下运行以下命令：

### 开发相关
```bash
# 查看可用的国际化命令
npm run i18n:help

# 将大文件拆分成模块（通常只需要执行一次）
npm run i18n:split

# 将模块合并成单一文件（构建时自动执行）
npm run i18n:merge

# 验证合并后的文件是否有效
npm run i18n:validate

# 开发环境启动（正常启动，无需合并）
npm run dev

# 生产构建（会自动合并模块）
npm run build
```

### 直接运行脚本
```bash
# 从项目根目录
node scripts/split-i18n-simple.js    # 拆分文件
node scripts/merge-i18n.js           # 合并文件
node scripts/merge-i18n.js validate  # 验证文件
```

## 📝 开发工作流

### 日常开发
1. **编辑模块文件**：直接编辑 `messages/modules/{lang}/{module}.json`
2. **开发测试**：`npm run dev`（使用现有的合并文件）
3. **构建发布**：`npm run build`（自动合并最新模块）

### 添加新翻译
1. 在对应语言的模块文件中添加新的翻译键值对
2. 确保中英文文件的键结构保持一致
3. 运行 `npm run i18n:merge` 更新合并文件

### 添加新模块
1. 在 `messages/modules/zh/` 和 `messages/modules/en/` 中创建新的 `.json` 文件
2. 合并脚本会自动识别并包含新模块

## ⚙️ 模块说明

| 模块名 | 文件大小 | 说明 |
|--------|----------|------|
| `common.json` | ~100行 | 通用词汇：loading, error, success等 |
| `navigation.json` | ~20行 | 导航菜单项 |
| `auth.json` | ~130行 | 登录、注册、钱包连接 |
| `web3.json` | ~80行 | Web3功能、网络、钱包 |
| `ui.json` | ~50行 | UI组件相关 |
| `footer.json` | ~40行 | 页脚信息 |
| `hackathons.json` | ~500行 | 黑客松创建、管理、详情 |
| `teams.json` | ~300行 | 团队创建、管理、申请 |
| `projects.json` | ~120行 | 项目管理、提交 |
| `community.json` | ~350行 | 社区讨论、帖子 |
| `dashboard.json` | ~330行 | 用户仪表板 |
| `admin.json` | ~400行 | 管理员功能 |
| `notifications.json` | ~16行 | 通知系统 |
| 其他模块 | 变化 | 根据功能拆分 |

## 🔧 技术细节

### 自动化构建
- **开发环境**：使用现有的合并文件，支持热重载
- **生产构建**：`npm run build` 时自动执行 `npm run i18n:merge`
- **CI/CD**：构建流程中自动合并最新的模块文件

### 文件同步
- 模块文件是**主要开发目标**
- 单一文件（zh.json, en.json）是**自动生成的**
- 避免直接编辑单一文件，修改会在合并时丢失

### 错误处理
- JSON 语法错误会在合并时被检测
- 空模块会被自动跳过
- 备份功能确保数据安全

## 📊 统计信息

### 拆分效果
- **原始文件**：每个文件 3122 行
- **拆分后**：27 个模块，每个通常少于 500 行
- **最大模块**：hackathons.json (~500行)
- **维护性**：显著提升，模块清晰

### 性能影响
- **开发环境**：无影响（仍使用合并文件）
- **构建时间**：增加 <1 秒（合并操作）
- **运行时性能**：无影响（最终仍为单一文件）

## 🚨 注意事项

1. **不要直接编辑** `zh.json` 和 `en.json`，这些是自动生成的文件
2. **保持键结构一致**：确保中英文模块的键结构完全匹配
3. **JSON 语法**：确保所有模块文件都是有效的 JSON 格式
4. **提交代码**：同时提交模块文件和生成的合并文件

## 🛟 故障排除

### JSON 语法错误
```bash
# 验证文件语法
npm run i18n:validate

# 如果发现错误，检查最近修改的模块文件
# 常见错误：引号未转义、缺少逗号、多余逗号
```

### 合并失败
```bash
# 检查模块目录结构
ls -la messages/modules/zh/
ls -la messages/modules/en/

# 手动合并
npm run i18n:merge
```

### 开发环境不生效
```bash
# 确保合并文件是最新的
npm run i18n:merge

# 重启开发服务器
npm run dev
```

## 📈 未来改进

- [ ] 支持更多语言
- [ ] 自动化翻译检查
- [ ] 翻译完整性验证
- [ ] 热重载模块文件（开发时）
- [ ] 可视化翻译管理界面

---

**维护者**: HackX 开发团队  
**更新时间**: 2024年9月22日
