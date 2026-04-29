import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from '../pages/Home'

const { mockPortals, mockGroups } = vi.hoisted(() => ({
  mockPortals: [
    { id: 1, name: 'Router', url: 'http://192.168.1.1', icon: '', group_id: 1, sort_order: 0, account: 'admin', password: 'pass123', notes: 'router notes', is_visible: true, open_in_new_tab: true },
    { id: 2, name: 'GitHub', url: 'https://github.com', icon: '', group_id: null, sort_order: 1, account: '', password: '', notes: '', is_visible: true, open_in_new_tab: true },
    { id: 3, name: 'Hidden', url: 'http://hidden.local', icon: '', group_id: null, sort_order: 2, account: '', password: '', notes: '', is_visible: false, open_in_new_tab: true },
  ],
  mockGroups: [
    { id: 1, name: 'Network', icon: 'server', sort_order: 0 },
  ],
}))

vi.mock('../stores/auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    needsSetup: false,
    login: vi.fn(),
    setup: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock('../services/api', () => ({
  portalApi: {
    list: vi.fn().mockResolvedValue({ data: mockPortals }),
    listPublic: vi.fn().mockResolvedValue({ data: mockPortals.filter((p: any) => p.is_visible) }),
  },
  groupApi: {
    list: vi.fn().mockResolvedValue({ data: mockGroups }),
  },
}))

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}))

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )
}

describe('Home page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders header with title', () => {
    renderHome()
    expect(screen.getByText('X-Portals')).toBeInTheDocument()
  })

  it('displays portals after loading', async () => {
    renderHome()
    await waitFor(() => {
      expect(screen.getByText('Router')).toBeInTheDocument()
      expect(screen.getByText('GitHub')).toBeInTheDocument()
    })
  })

  it('shows group name for grouped portals', async () => {
    renderHome()
    await waitFor(() => {
      expect(screen.getByText('Network')).toBeInTheDocument()
    })
  })

  it('shows ungrouped section', async () => {
    renderHome()
    await waitFor(() => {
      expect(screen.getByText('未分组')).toBeInTheDocument()
      expect(screen.getByText('GitHub')).toBeInTheDocument()
    })
  })

  it('filters portals by search', async () => {
    renderHome()
    await waitFor(() => {
      expect(screen.getByText('Router')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByPlaceholderText('搜索门户...'), { target: { value: 'github' } })
    await waitFor(() => {
      expect(screen.queryByText('Router')).not.toBeInTheDocument()
      expect(screen.getByText('GitHub')).toBeInTheDocument()
    })
  })

  it('search is case-insensitive', async () => {
    renderHome()
    await waitFor(() => {
      expect(screen.getByText('Router')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByPlaceholderText('搜索门户...'), { target: { value: 'ROUTER' } })
    await waitFor(() => {
      expect(screen.getByText('Router')).toBeInTheDocument()
      expect(screen.queryByText('GitHub')).not.toBeInTheDocument()
    })
  })

  it('toggles group collapse', async () => {
    renderHome()
    await waitFor(() => {
      expect(screen.getByText('Router')).toBeInTheDocument()
    })
    const groupButton = screen.getByText('Network')
    fireEvent.click(groupButton)
    await waitFor(() => {
      expect(screen.queryByText('Router')).not.toBeInTheDocument()
    })
    fireEvent.click(groupButton)
    await waitFor(() => {
      expect(screen.getByText('Router')).toBeInTheDocument()
    })
  })

  it('shows credentials toggle for portals with account', async () => {
    renderHome()
    await waitFor(() => {
      expect(screen.getByText('查看凭据')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('查看凭据'))
    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
      expect(screen.getByText('••••••••')).toBeInTheDocument()
      expect(screen.getByText('router notes')).toBeInTheDocument()
    })
  })

  it('password is masked by default and can be revealed', async () => {
    renderHome()
    await waitFor(() => {
      expect(screen.getByText('查看凭据')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('查看凭据'))
    await waitFor(() => {
      expect(screen.getByText('••••••••')).toBeInTheDocument()
    })
    const eyeButtons = screen.getAllByRole('button')
    const pwRevealBtn = eyeButtons.find(b => {
      const svg = b.querySelector('svg')
      return svg && svg.classList.contains('lucide-eye')
    })
    if (pwRevealBtn) fireEvent.click(pwRevealBtn)
    await waitFor(() => {
      expect(screen.getByText('pass123')).toBeInTheDocument()
    })
  })

  it('hides credentials when toggle is clicked again', async () => {
    renderHome()
    await waitFor(() => {
      expect(screen.getByText('查看凭据')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('查看凭据'))
    await waitFor(() => {
      expect(screen.getByText('隐藏凭据')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('隐藏凭据'))
    await waitFor(() => {
      expect(screen.queryByText('admin')).not.toBeInTheDocument()
    })
  })

  it('portals have correct links', async () => {
    renderHome()
    await waitFor(() => {
      const link = screen.getByText('Router').closest('a')
      expect(link).toHaveAttribute('href', 'http://192.168.1.1')
    })
  })

  it('shows settings and logout for authenticated user', async () => {
    renderHome()
    await waitFor(() => {
      expect(screen.getByTitle('管理')).toBeInTheDocument()
      expect(screen.getByTitle('退出登录')).toBeInTheDocument()
    })
  })

  it('clearing search shows all portals again', async () => {
    renderHome()
    await waitFor(() => {
      expect(screen.getByText('Router')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('搜索门户...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })
    await waitFor(() => {
      expect(screen.queryByText('Router')).not.toBeInTheDocument()
    })
    fireEvent.change(searchInput, { target: { value: '' } })
    await waitFor(() => {
      expect(screen.getByText('Router')).toBeInTheDocument()
    })
  })
})
