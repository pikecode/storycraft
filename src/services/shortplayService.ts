/**
 * Shortplay API Service
 * 一键创作相关的API调用服务
 */

const STORYAI_API_BASE = '/episode-api/storyai';

const getToken = () => localStorage.getItem('token') || '';

const getUserId = (): string => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return '';
  try {
    const user = JSON.parse(userStr);
    return user.userId || '';
  } catch (error) {
    console.error('Failed to parse user info:', error);
    return '';
  }
};

// ============ 剧本相关 API ============

/**
 * 创建剧本生成任务
 */
export const createSeries = async (userInput: string) => {
  const userId = getUserId();
  if (!userId) throw new Error('User ID not found');

  const response = await fetch(`${STORYAI_API_BASE}/series/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Prompt-Manager-Token': getToken(),
    },
    body: JSON.stringify({
      userId,
      userInput: userInput.trim(),
      provider: ""
    })
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

/**
 * 获取剧本详情
 */
export const getSeriesDetail = async (seriesId?: string) => {
  const userId = getUserId();
  const url = seriesId
    ? `${STORYAI_API_BASE}/series/detail?seriesId=${seriesId}`
    : `${STORYAI_API_BASE}/series/detail?userId=${userId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Prompt-Manager-Token': getToken(),
    }
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

// ============ 场次相关 API ============

/**
 * 获取场次内容
 */
export const getSceneContent = async (sceneId: number) => {
  const response = await fetch(`${STORYAI_API_BASE}/scene/content?sceneId=${sceneId}`, {
    method: 'GET',
    headers: {
      'X-Prompt-Manager-Token': getToken(),
    }
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

/**
 * 更新场次信息
 */
export const updateScene = async (sceneId: number, sceneTitle: string) => {
  const response = await fetch(`${STORYAI_API_BASE}/scene`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Prompt-Manager-Token': getToken(),
    },
    body: JSON.stringify({
      id: sceneId,
      sceneTitle
    })
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

/**
 * 创建场次内容
 */
export const createSceneContent = async (data: {
  sceneId: number;
  type: number;
  content: string;
  roleName?: string;
  startTime: string;
  endTime: string;
}) => {
  const response = await fetch(`${STORYAI_API_BASE}/scene/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Prompt-Manager-Token': getToken(),
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

/**
 * 更新场次内容
 */
export const updateSceneContent = async (data: {
  id: number;
  type?: number;
  content?: string;
  roleName?: string;
  startTime?: string;
  endTime?: string;
  orderNum?: number;
}) => {
  const response = await fetch(`${STORYAI_API_BASE}/scene/content`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Prompt-Manager-Token': getToken(),
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

/**
 * 删除场次内容
 */
export const deleteSceneContent = async (id: number) => {
  const response = await fetch(`${STORYAI_API_BASE}/scene/content/${id}`, {
    method: 'DELETE',
    headers: {
      'X-Prompt-Manager-Token': getToken(),
    }
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

// ============ 音色相关 API ============

/**
 * 获取音色列表
 */
export const getVoiceList = async (status: number) => {
  const userId = getUserId();
  if (!userId) return [];

  const response = await fetch(`${STORYAI_API_BASE}/voice/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Prompt-Manager-Token': getToken(),
    },
    body: JSON.stringify({
      userId,
      status
    })
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  const result = await response.json();
  return result.code === 0 && result.data ? result.data : [];
};

/**
 * 更新音色
 */
export const updateVoice = async (data: {
  voiceId: string;
  status?: number;
  voiceName?: string;
}) => {
  const response = await fetch(`${STORYAI_API_BASE}/voice/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Prompt-Manager-Token': getToken(),
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

/**
 * 批量绑定音色
 */
export const batchBindVoice = async (bindings: Array<{
  voiceId: string;
  subtitleId: number;
}>) => {
  const response = await fetch(`${STORYAI_API_BASE}/ai/voice/batch-bind`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Prompt-Manager-Token': getToken(),
    },
    body: JSON.stringify({ bindings })
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

/**
 * AI音色设计
 */
export const designVoice = async (prompt: string) => {
  const userId = getUserId();
  if (!userId) throw new Error('User ID not found');

  const response = await fetch(`${STORYAI_API_BASE}/ai/voice/design`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Prompt-Manager-Token': getToken(),
    },
    body: JSON.stringify({
      prompt: prompt.trim(),
      userId
    })
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

// ============ BGM相关 API ============

/**
 * 获取BGM列表
 */
export const getBgmList = async () => {
  const userId = getUserId();
  if (!userId) return [];

  const response = await fetch(`${STORYAI_API_BASE}/bgm/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Prompt-Manager-Token': getToken(),
    },
    body: JSON.stringify({
      userId
    })
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  const result = await response.json();
  return result.code === 0 && result.data ? result.data : [];
};

/**
 * AI生成BGM
 */
export const generateBgm = async (userInput: string, style: string) => {
  const userId = getUserId();
  if (!userId) throw new Error('User ID not found');

  const response = await fetch(`${STORYAI_API_BASE}/ai/bgm/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Prompt-Manager-Token': getToken(),
    },
    body: JSON.stringify({
      userId: parseInt(userId),
      style,
      userInput: userInput.trim()
    })
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

// ============ 图片相关 API ============

/**
 * AI生成图片
 */
export const generateImage = async (sceneId: number, userInput: string) => {
  const response = await fetch(`${STORYAI_API_BASE}/ai/image/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Prompt-Manager-Token': getToken(),
    },
    body: JSON.stringify({
      sceneId,
      userInput: userInput.trim()
    })
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

/**
 * 查询聊天记录
 */
export const queryChatHistory = async (data: {
  sceneId: string;
  chatScene: 'IMAGE' | 'VIDEO';
  type: string;
  pageNum: number;
  pageSize: number;
}) => {
  const response = await fetch(`${STORYAI_API_BASE}/chat-history/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Prompt-Manager-Token': getToken(),
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

// ============ 分镜板相关 API ============

/**
 * 获取分镜板列表
 */
export const getStoryboardList = async (sceneId: number) => {
  const response = await fetch(`${STORYAI_API_BASE}/storyboard/list?sceneId=${sceneId}`, {
    method: 'GET',
    headers: {
      'X-Prompt-Manager-Token': getToken(),
    }
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

/**
 * 创建分镜板
 */
export const createStoryboard = async (data: {
  sceneId: number;
  storyboardOrder: number;
  fileId: string;
}) => {
  const response = await fetch(`${STORYAI_API_BASE}/storyboard/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Prompt-Manager-Token': getToken(),
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

/**
 * 更新分镜板
 */
export const updateStoryboard = async (data: {
  id: number;
  storyboardOrder?: number;
  startTime?: number;
  endTime?: number;
}) => {
  const response = await fetch(`${STORYAI_API_BASE}/storyboard/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Prompt-Manager-Token': getToken(),
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

/**
 * 删除分镜板
 */
export const deleteStoryboard = async (id: string) => {
  const response = await fetch(`${STORYAI_API_BASE}/storyboard/${id}`, {
    method: 'DELETE',
    headers: {
      'X-Prompt-Manager-Token': getToken(),
    }
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

// ============ 视频相关 API ============

/**
 * AI生成视频
 */
export const generateVideo = async (data: {
  sceneId: string;
  llmName: string;
  userMessage: string;
  useImageGeneration: boolean;
  images: string[];
}) => {
  const response = await fetch(`${STORYAI_API_BASE}/ai/video/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Prompt-Manager-Token': getToken(),
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

/**
 * 查询视频生成进度
 */
export const getVideoProgress = async (fileId: number) => {
  const response = await fetch(`${STORYAI_API_BASE}/ai/video/progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Prompt-Manager-Token': getToken(),
    },
    body: JSON.stringify({ fileId })
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

// ============ 文件上传 API ============

/**
 * 上传文件
 */
export const uploadFile = async (file: File) => {
  const userId = getUserId();
  if (!userId) throw new Error('User ID not found');

  const fileName = encodeURIComponent(file.name);
  const uploadUrl = `${STORYAI_API_BASE}/file/upload?userId=${userId}&fileName=${fileName}`;

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Prompt-Manager-Token': getToken(),
    },
    body: formData
  });

  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
  return response.json();
};
