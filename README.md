# X-Portals

个人门户入口管理软件，统一管理你的设备、服务、网站入口和帐号密码。

## 特性

- 🔗 统一管理所有服务入口（路由器、PVE、NAS、GitHub 等）
- 🔐 帐号密码 AES-256 加密存储，一键复制
- 📁 自定义分组，卡片式展示
- 🔍 实时搜索过滤
- 🌐 自动获取网站 favicon
- 🤖 AI Skill 一键复制，教 AI Agent 管理你的门户
- 🔒 JWT 认证保护
- 🐳 Docker 一键部署

## 快速开始

### Docker 部署（推荐）

```bash
# 1. （可选）修改 docker-compose.yml 中的密钥
#    SECRET_KEY: JWT 签名密钥
#    ENCRYPTION_KEY: 密码加密密钥

# 2. 构建并启动
docker-compose up -d --build

# 3. 访问
#    浏览器打开 http://localhost:8080
#    首次使用会引导创建管理员账户
```

停止服务：

```bash
docker-compose down
```

数据持久化在 `./data/portals.db`，升级时不会丢失。

### 开发环境

一条命令同时启动前后端：

```bash
./dev.sh
```

- 前端：http://localhost:3000
- 后端：http://localhost:8000
- API 文档：http://localhost:8000/docs
- 按 `Ctrl+C` 停止

`dev.sh` 会自动：
- 创建 Python 虚拟环境（首次运行）
- 安装后端依赖（首次运行）
- 安装前端依赖（首次运行）
- 启动后端（支持热重载）
- 启动前端（支持热重载）
- 退出时清理所有子进程

### 手动启动

如果需要分别启动：

```bash
# 后端
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 前端（另一个终端）
cd frontend
npm install
npm run dev
```

## 测试

### 后端测试

```bash
cd backend
source venv/bin/activate
python -m pytest tests/ -v
```

70 个测试覆盖：
- `test_security.py` — 密码哈希、JWT、AES 加密
- `test_auth.py` — 认证全流程（setup/login/me）
- `test_groups.py` — 分组 CRUD
- `test_portals.py` — 门户 CRUD + 跨用户隔离

### 前端测试

```bash
cd frontend
npm test
```

38 个测试覆盖：
- 类型定义、API 服务层
- Login/Home/Admin 页面组件

## 使用说明

1. **首次访问**：创建管理员账户（单用户系统，仅此一次）
2. **添加分组**：在管理页面创建分组（如：服务器、NAS、开发工具）
3. **添加门户**：填写名称、地址、帐号密码等信息
4. **主页访问**：回到主页即可看到所有门户卡片
5. **查看凭据**：点击卡片上的"查看凭据"可显示/复制帐号密码
6. **搜索**：在主页顶部搜索框输入关键词实时过滤
7. **分组折叠**：点击分组标题可折叠/展开
8. **AI 集成**：点击顶部紫色 "AI Skill" 按钮，复制完整的 API 文档和认证 Token，粘贴给 AI Agent 即可通过自然语言管理门户

### AI Skill 使用

主页右上角有紫色的 **AI Skill** 按钮，点击后会复制一段完整的 Skill 文档到剪贴板，包含：
- API Base URL
- 当前有效的认证 Token（7 天有效期）
- 所有接口的完整说明和参数
- curl 示例命令

直接粘贴给 ChatGPT / Claude / Cursor 等 AI Agent，AI 就能帮你增删改查门户。例如：
- "帮我添加一个路由器管理入口，地址 192.168.1.1，密码 admin123"
- "把所有 NAS 相关的门户归到一个新分组里"
- "把 GitHub 那个门户的密码改成新密码"

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `SECRET_KEY` | JWT 签名密钥 | `change-me-in-production-please` |
| `ENCRYPTION_KEY` | 密码加密密钥 | 内置默认值 |

> 生产部署时请务必修改 `SECRET_KEY` 和 `ENCRYPTION_KEY`。

## API 接口

启动后端后访问 http://localhost:8000/docs 查看 Swagger 交互式文档。

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/setup` | 首次创建管理员 | 否 |
| POST | `/api/auth/login` | 登录 | 否 |
| GET | `/api/auth/check` | 检查是否已初始化 | 否 |
| GET | `/api/auth/me` | 当前用户信息 | 是 |
| GET | `/api/portals` | 门户列表（含密码） | 是 |
| GET | `/api/portals/public` | 门户列表（公开，无密码） | 否 |
| POST | `/api/portals` | 创建门户 | 是 |
| PUT | `/api/portals/:id` | 更新门户 | 是 |
| DELETE | `/api/portals/:id` | 删除门户 | 是 |
| POST | `/api/portals/sort` | 批量更新排序 | 是 |
| GET | `/api/groups` | 分组列表 | 是 |
| POST | `/api/groups` | 创建分组 | 是 |
| PUT | `/api/groups/:id` | 更新分组 | 是 |
| DELETE | `/api/groups/:id` | 删除分组 | 是 |

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite 5 + Tailwind CSS 3 |
| 后端 | Python 3.12 + FastAPI + SQLAlchemy |
| 数据库 | SQLite |
| 认证 | JWT (python-jose) |
| 加密 | AES-256 (Fernet) + bcrypt |
| 测试 | pytest + httpx / Vitest + React Testing Library |
| 部署 | Docker (多阶段构建) |

## 项目结构

```
x-portals/
├── dev.sh                      # 开发启动脚本
├── Dockerfile                  # 多阶段构建
├── docker-compose.yml          # Docker 编排
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI 入口
│   │   ├── api/                # 路由 (auth/portals/groups)
│   │   ├── core/               # 配置/数据库/安全
│   │   ├── models/             # ORM 模型
│   │   └── schemas/            # Pydantic 模式
│   ├── tests/                  # 测试 (70 cases)
│   ├── requirements.txt
│   └── requirements-dev.txt
└── frontend/
    ├── src/
    │   ├── pages/              # Login / Home / Admin
    │   ├── services/           # Axios API 封装
    │   ├── stores/             # Auth Context
    │   └── test/               # 测试 (38 cases)
    ├── package.json
    └── vite.config.ts
```
