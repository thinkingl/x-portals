import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from '../pages/Login'

const mockLogin = vi.fn()
const mockSetup = vi.fn()

vi.mock('../stores/auth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    needsSetup: false,
    login: mockLogin,
    setup: mockSetup,
    logout: vi.fn(),
  }),
}))

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}))

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form', () => {
    render(<Login />)
    expect(screen.getByText('X-Portals')).toBeInTheDocument()
    expect(screen.getByText('登录到你的门户管理')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入用户名')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument()
    expect(screen.getByText('登录')).toBeInTheDocument()
  })

  it('updates input values', () => {
    render(<Login />)
    const usernameInput = screen.getByPlaceholderText('请输入用户名')
    const passwordInput = screen.getByPlaceholderText('请输入密码')
    fireEvent.change(usernameInput, { target: { value: 'admin' } })
    fireEvent.change(passwordInput, { target: { value: 'pass123' } })
    expect(usernameInput).toHaveValue('admin')
    expect(passwordInput).toHaveValue('pass123')
  })

  it('calls login on submit', async () => {
    mockLogin.mockResolvedValue(undefined)
    render(<Login />)
    fireEvent.change(screen.getByPlaceholderText('请输入用户名'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByPlaceholderText('请输入密码'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getByText('登录'))
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'pass123')
    })
  })

  it('shows error on empty submit', async () => {
    const toast = await import('react-hot-toast')
    render(<Login />)
    fireEvent.click(screen.getByText('登录'))
    expect(toast.default.error).toHaveBeenCalledWith('请输入用户名和密码')
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('shows error on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('fail'))
    const toast = await import('react-hot-toast')
    render(<Login />)
    fireEvent.change(screen.getByPlaceholderText('请输入用户名'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByPlaceholderText('请输入密码'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByText('登录'))
    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('用户名或密码错误')
    })
  })
})
