import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Admin from '../pages/Admin'

const { mockGroups, mockPortals, mockPortalList, mockPortalCreate, mockPortalUpdate, mockPortalDelete, mockGroupList, mockGroupCreate, mockGroupUpdate, mockGroupDelete } = vi.hoisted(() => {
  const mockGroups = [
    { id: 1, name: 'Network', icon: 'server', sort_order: 0 },
  ]
  const mockPortals = [
    { id: 1, name: 'Router', url: 'http://192.168.1.1', icon: '', group_id: 1, sort_order: 0, account: 'admin', password: 'pass123', notes: '', is_visible: true, open_in_new_tab: true },
    { id: 2, name: 'NAS', url: 'http://nas.local', icon: '', group_id: null, sort_order: 1, account: '', password: '', notes: '', is_visible: false, open_in_new_tab: true },
  ]
  return {
    mockGroups, mockPortals,
    mockPortalList: vi.fn().mockResolvedValue({ data: mockPortals }),
    mockPortalCreate: vi.fn().mockResolvedValue({ data: { id: 3, name: 'New', url: 'https://new.com' } }),
    mockPortalUpdate: vi.fn().mockResolvedValue({ data: {} }),
    mockPortalDelete: vi.fn().mockResolvedValue({ data: { ok: true } }),
    mockGroupList: vi.fn().mockResolvedValue({ data: mockGroups }),
    mockGroupCreate: vi.fn().mockResolvedValue({ data: { id: 2, name: 'New Group', icon: '', sort_order: 1 } }),
    mockGroupUpdate: vi.fn().mockResolvedValue({ data: {} }),
    mockGroupDelete: vi.fn().mockResolvedValue({ data: { ok: true } }),
  }
})

vi.mock('../services/api', () => ({
  portalApi: {
    list: mockPortalList,
    create: mockPortalCreate,
    update: mockPortalUpdate,
    delete: mockPortalDelete,
  },
  groupApi: {
    list: mockGroupList,
    create: mockGroupCreate,
    update: mockGroupUpdate,
    delete: mockGroupDelete,
  },
}))

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}))

function renderAdmin() {
  return render(
    <MemoryRouter>
      <Admin />
    </MemoryRouter>
  )
}

describe('Admin page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title', () => {
    renderAdmin()
    expect(screen.getByText('管理门户')).toBeInTheDocument()
  })

  it('renders section headers', () => {
    renderAdmin()
    expect(screen.getByText('分组管理')).toBeInTheDocument()
    expect(screen.getByText('门户列表')).toBeInTheDocument()
  })

  it('displays portals after loading', async () => {
    renderAdmin()
    await waitFor(() => {
      expect(screen.getByText('Router')).toBeInTheDocument()
      expect(screen.getByText('NAS')).toBeInTheDocument()
    })
  })

  it('displays groups after loading', async () => {
    renderAdmin()
    await waitFor(() => {
      expect(screen.getAllByText('Network').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows group item count', async () => {
    renderAdmin()
    await waitFor(() => {
      expect(screen.getByText('1 项')).toBeInTheDocument()
    })
  })

  it('shows new portal form when add button clicked', async () => {
    renderAdmin()
    await waitFor(() => {
      expect(screen.getByText('Router')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('添加门户'))
    expect(screen.getByPlaceholderText('如：路由器管理、PVE 控制台')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://192.168.1.1')).toBeInTheDocument()
  })

  it('shows new group form when add button clicked', () => {
    renderAdmin()
    fireEvent.click(screen.getByText('新建分组'))
    expect(screen.getByPlaceholderText('分组名称')).toBeInTheDocument()
  })

  it('creates a new group', async () => {
    renderAdmin()
    await waitFor(() => {
      expect(screen.getAllByText('Network').length).toBeGreaterThanOrEqual(1)
    })
    fireEvent.click(screen.getByText('新建分组'))
    fireEvent.change(screen.getByPlaceholderText('分组名称'), { target: { value: 'Servers' } })
    fireEvent.click(screen.getByText('创建'))
    await waitFor(() => {
      expect(mockGroupCreate).toHaveBeenCalledWith({ name: 'Servers', sort_order: 1 })
    })
  })

  it('portal form shows cancel and save buttons', async () => {
    renderAdmin()
    await waitFor(() => {
      expect(screen.getByText('Router')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('添加门户'))
    expect(screen.getByText('取消')).toBeInTheDocument()
    expect(screen.getByText('保存')).toBeInTheDocument()
  })

  it('hides form on cancel', async () => {
    renderAdmin()
    await waitFor(() => {
      expect(screen.getByText('Router')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('添加门户'))
    expect(screen.getByPlaceholderText('如：路由器管理、PVE 控制台')).toBeInTheDocument()
    fireEvent.click(screen.getByText('取消'))
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('如：路由器管理、PVE 控制台')).not.toBeInTheDocument()
    })
  })

  it('back link points to home', () => {
    renderAdmin()
    const backLink = screen.getAllByRole('link')[0]
    expect(backLink).toHaveAttribute('href', '/')
  })

  it('renders portal URLs in list', async () => {
    renderAdmin()
    await waitFor(() => {
      expect(screen.getByText('http://192.168.1.1')).toBeInTheDocument()
      expect(screen.getByText('http://nas.local')).toBeInTheDocument()
    })
  })

  it('portal count is displayed', async () => {
    renderAdmin()
    await waitFor(() => {
      expect(screen.getByText('(2)')).toBeInTheDocument()
    })
  })

  it('new group form cancel works', () => {
    renderAdmin()
    fireEvent.click(screen.getByText('新建分组'))
    expect(screen.getByPlaceholderText('分组名称')).toBeInTheDocument()
    const cancelButtons = screen.getAllByText('取消')
    fireEvent.click(cancelButtons[cancelButtons.length - 1])
    expect(screen.queryByPlaceholderText('分组名称')).not.toBeInTheDocument()
  })
})
