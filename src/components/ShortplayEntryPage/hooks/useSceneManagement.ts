import { useAuth } from '../../../contexts/AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { apiInterceptor } from '../../../services/apiInterceptor';

// API 基础路径
const STORYAI_API_BASE = '/storyai';

/**
 * 处理API响应，检查401未授权错误
 */
const handleApiResponse = async (response: Response) => {
  const data = await response.json();

  // 检查是否为401未授权错误
  if (data.code === 401) {
    console.error('🔴 [useSceneManagement] 检测到401未授权错误，触发统一处理');
    toast.error('用户未登录，请重新登陆');
    apiInterceptor.triggerUnauthorized();
    throw new Error('用户未登录');
  }

  return data;
};

/**
 * 场次管理 Hook
 * 管理场次相关的所有状态和函数
 */
export const useSceneManagement = () => {
  const { token, user } = useAuth();
  // 场次管理状态
  const [selectedScene, setSelectedScene] = useState<string>('');
  const [sceneOptions, setSceneOptions] = useState<string[]>([]);
  const [scenesData, setScenesData] = useState<any[]>([]); // 存储完整的场次数据
  const [sceneContent, setSceneContent] = useState<any[]>([]); // 存储当前场次的内容数据
  const [showTypeSelector, setShowTypeSelector] = useState(false); // 显示类型选择弹窗
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(false);

  /**
   * 加载场次内容
   * @param sceneId 场次ID
   */
  const loadSceneContent = async (sceneId: number) => {
    try {
      // token from useAuth()
      const response = await fetch(`${STORYAI_API_BASE}/scene/content?sceneId=${sceneId}`, {
        method: 'GET',
        headers: {
          'X-Prompt-Manager-Token': token || '',
        }
      });

      if (response.ok) {
        const result = await handleApiResponse(response);
        if (result.code === 0 && result.data) {
          console.log('场次内容:', result.data);
          setSceneContent(result.data);
        }
      }
    } catch (error) {
      console.error('加载场次内容失败:', error);
    }
  };

  /**
   * 加载用户数据（场次列表）
   */
  const loadUserData = async () => {
    // 防止重复调用
    if (isLoadingUserData) return;
    if (!user || !user.userId) return;
    setIsLoadingUserData(true);

    try {

      // token from useAuth()
      const response = await fetch(`${STORYAI_API_BASE}/series/detail?userId=${user.userId}`, {
        method: 'GET',
        headers: {
          'X-Prompt-Manager-Token': token || '',
        }
      });

      if (response.ok) {
        const result = await handleApiResponse(response);
        if (result.code === 0 && result.data) {
          const { scenes } = result.data;

          // 如果有场次数据，则更新下拉列表
          if (scenes && scenes.length > 0) {
            setScenesData(scenes);
            const sceneOptions = scenes.map((scene: any) => scene.sceneTitle);
            setSceneOptions(sceneOptions);
            setSelectedScene(sceneOptions[0] || '');
            // 返回第一个场次ID，以便主组件加载内容
            return scenes[0]?.id;
          }
        }
      }
    } catch (error) {
      console.error('加载用户历史数据失败:', error);
    } finally {
      setIsLoadingUserData(false);
    }
    return null;
  };

  /**
   * 场次切换处理
   * @param sceneName 场次名称
   */
  const handleSceneChange = (sceneName: string) => {
    setSelectedScene(sceneName);
    const currentSceneData = scenesData.find((scene: any) => scene.sceneTitle === sceneName);
    return currentSceneData?.id || null;
  };

  /**
   * 显示类型选择器
   * @param position 位置
   */
  const handleShowTypeSelector = (position: { top: number; left: number }) => {
    setPopoverPosition(position);
    setShowTypeSelector(true);
  };

  /**
   * 隐藏类型选择器
   */
  const handleHideTypeSelector = () => {
    setShowTypeSelector(false);
    setPopoverPosition(null);
  };

  /**
   * 获取当前场次的 sceneId
   */
  const getCurrentSceneId = () => {
    const currentSceneData = scenesData.find((scene: any) => scene.sceneTitle === selectedScene);
    return currentSceneData?.id || null;
  };

  return {
    // 状态
    selectedScene,
    sceneOptions,
    scenesData,
    sceneContent,
    showTypeSelector,
    popoverPosition,
    isLoadingUserData,

    // 方法
    setSelectedScene,
    setSceneOptions,
    setScenesData,
    setSceneContent,
    setShowTypeSelector,
    setPopoverPosition,
    loadSceneContent,
    loadUserData,
    handleSceneChange,
    handleShowTypeSelector,
    handleHideTypeSelector,
    getCurrentSceneId,
  };
};
