import { Toaster } from 'react-hot-toast'
import { Outlet } from 'react-router-dom'
import './App.css'
import TopBar from './components/TopBar'
import TokenExpiryHandler from './components/TokenExpiryHandler'

const App: React.FC = () => {
  return (
    <TokenExpiryHandler>
      <div className="min-h-screen flex flex-col">
        {/* 全局顶栏 */}
        <TopBar />
        <div className="flex flex-1 min-h-0 h-[calc(100vh-64px)]">
          {/* 主内容区域 - 占满整个宽度 */}
          <div className="flex-1 min-h-0 w-full">
            <Outlet />
          </div>
        </div>
        <Toaster />
      </div>
    </TokenExpiryHandler>
  )
}

export default App
