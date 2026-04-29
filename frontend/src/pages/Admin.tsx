import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { portalApi, groupApi } from '../services/api'
import { Portal, Group, PortalFormData } from '../types'
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, X, GripVertical,
  FolderPlus, Globe, Eye, EyeOff, ExternalLink
} from 'lucide-react'
import { BUILTIN_ICONS, getIconComponent } from '../components/icons'
import toast from 'react-hot-toast'

const emptyPortal: PortalFormData = {
  name: '', url: '', icon: '', group_id: null, sort_order: 0,
  account: '', password: '', notes: '', is_visible: true, open_in_new_tab: true,
}

function PortalForm({
  initial,
  groups,
  onSave,
  onCancel,
}: {
  initial?: Portal
  groups: Group[]
  onSave: (data: PortalFormData) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<PortalFormData>(initial ? {
    name: initial.name,
    url: initial.url,
    icon: initial.icon || '',
    group_id: initial.group_id,
    sort_order: initial.sort_order,
    account: initial.account || '',
    password: initial.password || '',
    notes: initial.notes || '',
    is_visible: initial.is_visible,
    open_in_new_tab: initial.open_in_new_tab,
  } : emptyPortal)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.url) {
      toast.error('名称和地址不能为空')
      return
    }
    setSaving(true)
    try {
      await onSave(form)
    } catch {
      toast.error('保存失败')
    }
    setSaving(false)
  }

  const update = (key: keyof PortalFormData, value: any) => setForm({ ...form, [key]: value })

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名称 *</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="如：路由器管理、PVE 控制台" autoFocus />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">地址 *</label>
          <input value={form.url} onChange={(e) => update('url', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="https://192.168.1.1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">图标</label>
          <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
            <button
              type="button"
              onClick={() => update('icon', '')}
              className={`w-8 h-8 rounded flex items-center justify-center transition ${!form.icon ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500' : 'hover:bg-gray-100 dark:hover:bg-gray-600'}`}
              title="自动获取"
            >
              <Globe className="w-4 h-4 text-gray-500" />
            </button>
            {Object.entries(BUILTIN_ICONS).map(([key, { icon: IconComp, label }]) => (
              <button
                key={key}
                type="button"
                onClick={() => update('icon', key)}
                className={`w-8 h-8 rounded flex items-center justify-center transition ${form.icon === key ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500' : 'hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                title={label}
              >
                <IconComp className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            ))}
          </div>
          <input
            value={form.icon}
            onChange={(e) => update('icon', e.target.value)}
            className="mt-1 w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="或输入自定义图标 URL"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">分组</label>
          <select value={form.group_id ?? ''} onChange={(e) => update('group_id', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">无分组</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">账号</label>
          <input value={form.account} onChange={(e) => update('account', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="登录账号" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">密码</label>
          <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="登录密码（加密存储）" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">排序</label>
          <input type="number" value={form.sort_order} onChange={(e) => update('sort_order', Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="flex items-end gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={form.is_visible} onChange={(e) => update('is_visible', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            主页可见
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={form.open_in_new_tab} onChange={(e) => update('open_in_new_tab', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            新标签页打开
          </label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">备注</label>
        <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          placeholder="可选备注信息" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 text-sm font-medium transition">
          <Save className="w-4 h-4" /> {saving ? '保存中...' : '保存'}
        </button>
        <button type="button" onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm transition">
          <X className="w-4 h-4" /> 取消
        </button>
      </div>
    </form>
  )
}

export default function Admin() {
  const [portals, setPortals] = useState<Portal[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [editingPortal, setEditingPortal] = useState<Portal | null>(null)
  const [showNewPortal, setShowNewPortal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [showGroupForm, setShowGroupForm] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [pRes, gRes] = await Promise.all([portalApi.list(), groupApi.list()])
    setPortals(pRes.data)
    setGroups(gRes.data)
  }

  const handleCreatePortal = async (data: PortalFormData) => {
    await portalApi.create(data)
    toast.success('添加成功')
    setShowNewPortal(false)
    loadData()
  }

  const handleUpdatePortal = async (data: PortalFormData) => {
    if (!editingPortal) return
    await portalApi.update(editingPortal.id, data)
    toast.success('更新成功')
    setEditingPortal(null)
    loadData()
  }

  const handleDeletePortal = async (id: number) => {
    if (!confirm('确定删除此门户？')) return
    await portalApi.delete(id)
    toast.success('已删除')
    loadData()
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    await groupApi.create({ name: newGroupName.trim(), sort_order: groups.length })
    toast.success('分组已创建')
    setNewGroupName('')
    setShowGroupForm(false)
    loadData()
  }

  const handleUpdateGroup = async (group: Group) => {
    await groupApi.update(group.id, { name: group.name, sort_order: group.sort_order })
    toast.success('分组已更新')
    setEditingGroup(null)
    loadData()
  }

  const handleDeleteGroup = async (id: number) => {
    if (!confirm('删除分组后，组内门户将变为未分组。确定删除？')) return
    await groupApi.delete(id)
    toast.success('分组已删除')
    loadData()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">管理门户</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Groups Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-blue-600" /> 分组管理
            </h2>
            <button onClick={() => setShowGroupForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition">
              <Plus className="w-4 h-4" /> 新建分组
            </button>
          </div>

          {showGroupForm && (
            <div className="flex gap-2 mb-3">
              <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="分组名称" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()} />
              <button onClick={handleCreateGroup}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition">创建</button>
              <button onClick={() => setShowGroupForm(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 text-sm transition">取消</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {groups.map((group) => (
              <div key={group.id} className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {editingGroup?.id === group.id ? (
                  <>
                    <input value={editingGroup.name} onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                      className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    <button onClick={() => handleUpdateGroup(editingGroup)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save className="w-4 h-4" /></button>
                    <button onClick={() => setEditingGroup(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  <>
                    <GripVertical className="w-4 h-4 text-gray-300" />
                    <span className="flex-1 text-sm text-gray-900 dark:text-white">{group.name}</span>
                    <span className="text-xs text-gray-400">
                      {portals.filter((p) => p.group_id === group.id).length} 项
                    </span>
                    <button onClick={() => setEditingGroup(group)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteGroup(group.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Portals Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" /> 门户列表
              <span className="text-sm font-normal text-gray-500">({portals.length})</span>
            </h2>
            <button onClick={() => { setShowNewPortal(true); setEditingPortal(null) }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition">
              <Plus className="w-4 h-4" /> 添加门户
            </button>
          </div>

          {showNewPortal && (
            <div className="mb-4">
              <PortalForm groups={groups} onSave={handleCreatePortal} onCancel={() => setShowNewPortal(false)} />
            </div>
          )}

          {editingPortal && (
            <div className="mb-4">
              <PortalForm initial={editingPortal} groups={groups} onSave={handleUpdatePortal} onCancel={() => setEditingPortal(null)} />
            </div>
          )}

          <div className="space-y-2">
            {portals.map((portal) => (
              <div key={portal.id}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition">
                <div className="flex-shrink-0 w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {portal.icon ? (
                    <img src={portal.icon} alt="" className="w-5 h-5 object-contain" />
                  ) : (
                    <Globe className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{portal.name}</span>
                    {!portal.is_visible && <span title="主页隐藏"><EyeOff className="w-3 h-3 text-gray-400" /></span>}
                    {portal.group_id && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                        {groups.find((g) => g.id === portal.group_id)?.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{portal.url}</p>
                </div>
                <div className="flex items-center gap-1">
                  <a href={portal.url} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={() => { setEditingPortal(portal); setShowNewPortal(false) }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeletePortal(portal.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
