import { useState } from 'react'
import { useAuth } from '../stores/auth'
import { LogIn, UserPlus, Shield, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { needsSetup, login, setup } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      toast.error('请输入用户名和密码')
      return
    }
    if (needsSetup && password.length < 6) {
      toast.error('密码至少需要 6 位')
      return
    }
    setLoading(true)
    try {
      if (needsSetup) {
        await setup(username, password)
        toast.success('账户创建成功，欢迎使用！')
      } else {
        await login(username, password)
        toast.success('登录成功')
      }
    } catch {
      toast.error(needsSetup ? '创建失败，请重试' : '用户名或密码错误')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              needsSetup
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              {needsSetup ? (
                <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
              ) : (
                <LogIn className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">X-Portals</h1>
            {needsSetup ? (
              <div className="mt-2">
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  欢迎！这是你的第一次使用
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  请设置一个管理员账户，之后用它来登录和管理你的门户
                </p>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                登录到你的门户管理
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {needsSetup ? '设置用户名' : '用户名'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder={needsSetup ? '输入一个你喜欢的用户名' : '请输入用户名'}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {needsSetup ? '设置密码' : '密码'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder={needsSetup ? '至少 6 位，用于保护你的数据' : '请输入密码'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-white font-medium transition ${
                needsSetup
                  ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
              }`}
            >
              {needsSetup ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {loading ? '请稍候...' : needsSetup ? '创建账户并开始使用' : '登录'}
            </button>
          </form>

          {needsSetup && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
              此账户仅你一人使用，创建后无法再注册新用户
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
