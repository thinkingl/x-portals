import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { portalApi, groupApi, authApi } from '../services/api'
import { useAuth } from '../stores/auth'
import { Portal, Group } from '../types'
import { Settings, Search, ExternalLink, Copy, Eye, EyeOff, ChevronDown, ChevronRight, LogOut, Globe, Bot } from 'lucide-react'
import { getIconComponent, BUILTIN_ICONS } from '../components/icons'
import toast from 'react-hot-toast'

function PortalIcon({ portal }: { portal: Portal | { icon?: string; url?: string } }) {
  const [imgFailed, setImgFailed] = useState(false)
  const builtin = portal.icon ? getIconComponent(portal.icon) : null

  if (builtin) {
    const Icon = builtin
    return <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
  }

  if (portal.icon && !imgFailed) {
    return <img src={portal.icon} alt="" className="w-6 h-6 object-contain" onError={() => setImgFailed(true)} />
  }

  if (portal.url) {
    try {
      const domain = new URL(portal.url).hostname
      if (!imgFailed) {
        return (
          <img
            src={`/api/favicon?domain=${domain}`}
            alt=""
            className="w-6 h-6 object-contain"
            onError={() => setImgFailed(true)}
          />
        )
      }
    } catch {}
  }

  return <Globe className="w-5 h-5 text-gray-400" />
}

function PortalCard({ portal }: { portal: Portal }) {
  const [showCreds, setShowCreds] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const hasCreds = !!(portal.account || portal.password || portal.notes)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} 已复制`)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!portal.open_in_new_tab) return
    e.preventDefault()
    window.open(portal.url, '_blank', 'noopener')
  }

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-200">
      <a
        href={portal.url}
        onClick={handleClick}
        target={portal.open_in_new_tab ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="block p-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
            <PortalIcon portal={portal} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{portal.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{portal.url}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
      </a>

      {hasCreds && (
        <div className="px-4 pb-3">
          <button
            onClick={(e) => { e.stopPropagation(); setShowCreds(!showCreds); if (showCreds) setShowPw(false) }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition"
          >
            {showCreds ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showCreds ? '隐藏凭据' : '查看凭据'}
          </button>

          {showCreds && (
            <div className="mt-2 space-y-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
              {portal.account && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">账号</span>
                  <div className="flex items-center gap-1">
                    <code className="text-xs text-gray-900 dark:text-white font-mono">{portal.account}</code>
                    <button onClick={() => copyToClipboard(portal.account, '账号')} className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                      <Copy className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}
              {portal.password && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">密码</span>
                  <div className="flex items-center gap-1">
                    <code className="text-xs text-gray-900 dark:text-white font-mono">
                      {showPw ? portal.password : '••••••••'}
                    </code>
                    <button onClick={(e) => { e.stopPropagation(); setShowPw(!showPw) }} className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                      {showPw ? <EyeOff className="w-3 h-3 text-gray-400" /> : <Eye className="w-3 h-3 text-gray-400" />}
                    </button>
                    <button onClick={() => copyToClipboard(portal.password, '密码')} className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                      <Copy className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}
              {portal.notes && (
                <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{portal.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const { isAuthenticated, logout } = useAuth()
  const [portals, setPortals] = useState<Portal[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [search, setSearch] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set())
  const [copyingSkill, setCopyingSkill] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      if (isAuthenticated) {
        const [pRes, gRes] = await Promise.all([portalApi.list(), groupApi.list()])
        setPortals(pRes.data)
        setGroups(gRes.data)
      } else {
        const pRes = await portalApi.listPublic()
        setPortals(pRes.data)
      }
    } catch {
      // ignore
    }
  }

  const copySkill = async () => {
    setCopyingSkill(true)
    try {
      const { data } = await authApi.skill()
      await navigator.clipboard.writeText(data.skill)
      toast.success('AI Skill 已复制，粘贴给 AI Agent 即可使用')
    } catch {
      toast.error('获取 Skill 失败')
    }
    setCopyingSkill(false)
  }

  const filteredPortals = useMemo(() => {
    if (!search) return portals
    const q = search.toLowerCase()
    return portals.filter(
      (p) => p.name.toLowerCase().includes(q) || p.url.toLowerCase().includes(q)
    )
  }, [portals, search])

  const groupedPortals = useMemo(() => {
    const grouped = new Map<number | null, Portal[]>()
    for (const p of filteredPortals) {
      const key = p.group_id
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(p)
    }
    return grouped
  }, [filteredPortals])

  const toggleGroup = (id: number) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const ungroupedPortals = groupedPortals.get(null) || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            X-Portals
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索门户..."
                className="pl-9 pr-4 py-2 w-48 sm:w-64 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            {isAuthenticated && (
              <>
                <button
                  onClick={copySkill}
                  disabled={copyingSkill}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-sm font-medium transition"
                  title="复制 AI Skill 给 Agent 使用"
                >
                  <Bot className="w-4 h-4" />
                  <span className="hidden sm:inline">{copyingSkill ? '复制中...' : 'AI Skill'}</span>
                </button>
                <Link
                  to="/admin"
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition"
                  title="管理"
                >
                  <Settings className="w-5 h-5" />
                </Link>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition"
                  title="退出登录"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {portals.length === 0 ? (
          <div className="text-center py-20">
            <Globe className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {isAuthenticated ? '还没有添加任何门户，去管理页面添加吧' : '暂无公开的门户'}
            </p>
            {isAuthenticated && (
              <Link to="/admin" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Settings className="w-4 h-4" />
                前往管理
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => {
              const items = groupedPortals.get(group.id)
              if (!items || items.length === 0) return null
              const isCollapsed = collapsedGroups.has(group.id)
              return (
                <div key={group.id}>
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex items-center gap-2 mb-3 group"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {group.name}
                    </h2>
                    <span className="text-xs text-gray-400 dark:text-gray-500">({items.length})</span>
                  </button>
                  {!isCollapsed && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {items.map((p) => (
                        <PortalCard key={p.id} portal={p} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {ungroupedPortals.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  未分组
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {ungroupedPortals.map((p) => (
                    <PortalCard key={p.id} portal={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
