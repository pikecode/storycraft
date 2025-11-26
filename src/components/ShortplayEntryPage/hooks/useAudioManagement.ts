import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
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
    console.error('🔴 [useAudioManagement] 检测到401未授权错误，触发统一处理');
    toast.error('用户未登录，请重新登陆');
    apiInterceptor.triggerUnauthorized();
    throw new Error('用户未登录');
  }

  return data;
};

/**
 * 音频管理 Hook
 * 管理音频相关的所有状态和函数，包括音色和音效
 */
export const useAudioManagement = () => {
  // 获取认证信息
  const { token } = useAuth();

  // 音色数据状态
  const [configuredVoices, setConfiguredVoices] = useState<any[]>([]);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [isConfiguredVoicesExpanded, setIsConfiguredVoicesExpanded] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [editingVoiceId, setEditingVoiceId] = useState<string | null>(null);
  const [editingVoiceName, setEditingVoiceName] = useState<string>('');

  // 音频类型选择状态（音色/音效）
  const [audioType, setAudioType] = useState<'voice' | 'sound'>('voice');
  const prevAudioTypeRef = useRef<'voice' | 'sound'>('voice');

  // 音频内容数据状态
  const [audioContent, setAudioContent] = useState<any[]>([]); // 存储音频tab的内容数据
  const [isLoadingAudioContent, setIsLoadingAudioContent] = useState(false);

  // 音效数据状态
  const [bgmList, setBgmList] = useState<any[]>([]);
  const [isLoadingBgm, setIsLoadingBgm] = useState(false);

  /**
   * 加载音色列表
   * @param status 状态：1=已设置, 2=可用
   */
  const loadVoiceList = async (status: number) => {
    try {
      // token from useAuth()
      const response = await fetch(`${STORYAI_API_BASE}/voice/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify({
          status: status
        })
      });

      if (response.ok) {
        const result = await handleApiResponse(response);
        if (result.code === 0 && result.data) {
          return result.data;
        }
      }
      return [];
    } catch (error) {
      console.error('获取音色列表失败:', error);
      return [];
    }
  };

  /**
   * 加载所有音色数据（已设置和可用）
   */
  const loadAllVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const [configured, available] = await Promise.all([
        loadVoiceList(1), // 已设置的音色
        loadVoiceList(2)  // 可用的音色
      ]);
      setConfiguredVoices(configured);
      setAvailableVoices(available);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  /**
   * 应用音色到已设置列表
   * @param voiceId 音色ID
   */
  const handleApplyVoice = async (voiceId: string) => {
    try {
      // token from useAuth()
      const response = await fetch(`${STORYAI_API_BASE}/voice/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify({
          voiceId: voiceId,
          status: 1
        })
      });

      if (response.ok) {
        const result = await handleApiResponse(response);
        if (result.code === 0) {
          // 应用成功，刷新已设置的音色列表和可用音色列表
          const updatedConfigured = await loadVoiceList(1);
          const updatedAvailable = await loadVoiceList(2);
          setConfiguredVoices(updatedConfigured);
          setAvailableVoices(updatedAvailable);
          toast.success('音色应用成功！');
        } else {
          throw new Error(result.message || '应用音色失败');
        }
      } else {
        throw new Error(`请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error('应用音色失败:', error);
      toast.error('应用音色失败：' + (error as Error).message);
    }
  };

  /**
   * 开始编辑音色名称
   */
  const handleStartEditVoiceName = (voiceId: string, currentName: string) => {
    setEditingVoiceId(voiceId);
    setEditingVoiceName(currentName);
  };

  /**
   * 保存音色名称修改
   */
  const handleSaveVoiceName = async () => {
    if (!editingVoiceId || !editingVoiceName.trim()) return;

    try {
      // token from useAuth()
      const response = await fetch(`${STORYAI_API_BASE}/voice/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify({
          voiceId: editingVoiceId,
          voiceName: editingVoiceName.trim()
        })
      });

      if (response.ok) {
        const result = await handleApiResponse(response);
        if (result.code === 0) {
          // 更新成功，刷新音色列表
          await loadAllVoices();
          toast.success('音色名称更新成功！');
        } else {
          throw new Error(result.message || '更新音色名称失败');
        }
      } else {
        throw new Error(`请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error('更新音色名称失败:', error);
      toast.error('更新音色名称失败：' + (error as Error).message);
    } finally {
      setEditingVoiceId(null);
      setEditingVoiceName('');
    }
  };

  /**
   * 取消编辑音色名称
   */
  const handleCancelEditVoiceName = () => {
    setEditingVoiceId(null);
    setEditingVoiceName('');
  };

  /**
   * 处理音色名称编辑的键盘事件
   */
  const handleVoiceNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveVoiceName();
    } else if (e.key === 'Escape') {
      handleCancelEditVoiceName();
    }
  };

  /**
   * 处理音色选择（绑定到内容项）
   * @param itemId 内容项ID
   * @param voiceId 音色ID
   */
  const handleVoiceSelect = async (itemId: string, voiceId: string) => {
    if (!voiceId) return;

    try {
      // token from useAuth()
      const response = await fetch(`${STORYAI_API_BASE}/ai/voice/batch-bind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify({
          bindings: [
            {
              voiceId: voiceId,
              subtitleId: parseInt(itemId)
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const result = await handleApiResponse(response);
      if (result.code === 0) {
        toast.success('音色绑定成功！');
      } else {
        throw new Error(result.message || '音色绑定失败');
      }
    } catch (error) {
      console.error('音色绑定失败:', error);
      toast.error('音色绑定失败：' + (error as Error).message);
    }
  };

  /**
   * 播放音频
   * @param itemId 内容项ID
   */
  const handlePlayAudio = async (itemId: string) => {
    try {
      // token from useAuth()
      const response = await fetch(`${STORYAI_API_BASE}/multimedia/audio/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify({
          sceneContentId: parseInt(itemId)
        })
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const result = await handleApiResponse(response);
      if (result.code === 0) {
        if (result.data?.audioUrl) {
          // 直接播放音频，不添加事件监听器
          const audio = new Audio(result.data.audioUrl);
          audio.play().catch((error) => {
            console.error('音频播放失败:', error);
            toast.error('音频播放失败');
          });
        } else {
          toast.error('音色生成中');
        }
      } else {
        throw new Error(result.message || '获取音频失败');
      }
    } catch (error) {
      console.error('播放音频失败:', error);
      toast.error('播放音频失败：' + (error as Error).message);
    }
  };

  /**
   * 加载音频内容（音频Tab专用）
   * @param sceneId 场次ID
   */
  const loadAudioContent = async (sceneId: number) => {
    setIsLoadingAudioContent(true);
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
          console.log('音频内容:', result.data);
          setAudioContent(result.data);
        } else {
          setAudioContent([]);
        }
      } else {
        setAudioContent([]);
      }
    } catch (error) {
      console.error('加载音频内容失败:', error);
      setAudioContent([]);
    } finally {
      setIsLoadingAudioContent(false);
    }
  };

  /**
   * 加载音效列表
   */
  const loadBgmList = async () => {
    setIsLoadingBgm(true);
    try {
      // token from useAuth()
      const response = await fetch(`${STORYAI_API_BASE}/bgm/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const result = await handleApiResponse(response);
        if (result.code === 0 && result.data) {
          setBgmList(result.data);
        }
      }
    } catch (error) {
      console.error('获取音效列表失败:', error);
    } finally {
      setIsLoadingBgm(false);
    }
  };

  /**
   * 应用音效到场次
   * @param bgm 音效数据
   * @param sceneId 场次ID
   */
  const handleApplyBgm = async (bgm: any, sceneId: number) => {
    if (!sceneId) {
      toast.error('请先选择场次');
      return;
    }

    if (!bgm.attachmentId) {
      toast.error('音效文件缺少attachmentId');
      return;
    }

    try {
      // token from useAuth()

      // 计算下一个排序号（当前音频内容列表长度 + 1）
      const orderNum = audioContent.length + 1;

      const response = await fetch(`${STORYAI_API_BASE}/scene/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify({
          sceneId: sceneId,
          type: 3,
          content: bgm.prompt || bgm.name || '音效',
          orderNum: orderNum,
          fileId: bgm.attachmentId,
          startTime: 0,
          endTime: 5000
        })
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const result = await handleApiResponse(response);
      if (result.code === 0) {
        toast.success('音效应用成功！');
        // 刷新音频内容列表
        await loadAudioContent(sceneId);
      } else {
        throw new Error(result.message || '应用音效失败');
      }
    } catch (error) {
      console.error('应用音效失败:', error);
      toast.error('应用音效失败：' + (error as Error).message);
    }
  };

  return {
    // 状态
    configuredVoices,
    availableVoices,
    isConfiguredVoicesExpanded,
    isLoadingVoices,
    editingVoiceId,
    editingVoiceName,
    audioType,
    prevAudioTypeRef,
    audioContent,
    isLoadingAudioContent,
    bgmList,
    isLoadingBgm,

    // 方法
    setConfiguredVoices,
    setAvailableVoices,
    setIsConfiguredVoicesExpanded,
    setAudioType,
    setEditingVoiceName,
    loadVoiceList,
    loadAllVoices,
    handleApplyVoice,
    handleStartEditVoiceName,
    handleSaveVoiceName,
    handleCancelEditVoiceName,
    handleVoiceNameKeyDown,
    handleVoiceSelect,
    handlePlayAudio,
    loadAudioContent,
    loadBgmList,
    handleApplyBgm,
  };
};
