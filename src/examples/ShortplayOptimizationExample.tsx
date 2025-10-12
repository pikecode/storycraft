/**
 * ShortplayEntryPage 快速优化应用示例
 *
 * 本文件展示如何将新创建的服务、工具、Hook应用到现有代码中
 * 可以逐步替换原有代码，降低风险
 */

// ============ 步骤1: 替换API调用 ============

// 原来的代码 (❌):
/*
const handleImageGenerate = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${STORYAI_API_BASE}/ai/image/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Prompt-Manager-Token': token || '',
      },
      body: JSON.stringify({
        sceneId: sceneId,
        userInput: userInput.trim()
      })
    });
    // ... 更多代码
  } catch (error) {
    // ...
  }
};
*/

// 优化后的代码 (✅):
import * as shortplayService from '@/services/shortplayService';

const handleImageGenerate = async () => {
  try {
    const currentSceneData = scenesData.find((scene: any) => scene.sceneName === selectedScene);
    const sceneId = currentSceneData?.sceneId;

    if (!sceneId) {
      toast.error('请先选择场次');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('正在生成图片...');

    const result = await shortplayService.generateImage(sceneId, userInput.trim());

    if (result.code === 0) {
      setGenerationStatus('生成完成！');
      setUserInput('');
      await loadImageChatHistory();
      toast.success('图片生成完成！');
    } else {
      throw new Error(result.message || '图片生成失败');
    }
  } catch (error) {
    console.error('图片生成失败:', error);
    toast.error('图片生成失败：' + (error as Error).message);
  } finally {
    setIsGenerating(false);
    setGenerationStatus('');
  }
};

// ============ 步骤2: 使用工具函数 ============

// 原来的代码 (❌):
/*
const parseTimeRange = (timeRange: string) => {
  const match = timeRange.match(/(\d{2}):(\d{2})'-(\d{2}):(\d{2})'/);
  if (match) {
    return {
      startMinutes: match[1],
      startSeconds: match[2],
      endMinutes: match[3],
      endSeconds: match[4]
    };
  }
  return { startMinutes: '00', startSeconds: '00', endMinutes: '00', endSeconds: '05' };
};
*/

// 优化后的代码 (✅):
import { parseTimeRange, validateTimeLogic, formatTimeRange } from '@/utils/shortplayUtils';

// 直接使用工具函数
const timeData = parseTimeRange(item.timeRange);

// 验证时间
const validation = validateTimeLogic(startMinutes, startSeconds, endMinutes, endSeconds);
if (!validation.valid) {
  toast.error(validation.error);
  return;
}

// 格式化时间
const formattedTime = formatTimeRange(startMin, startSec, endMin, endSec);

// ============ 步骤3: 使用场次管理Hook ============

// 原来的代码 (❌): 在组件内部维护大量状态
/*
const [scenesData, setScenesData] = useState<any[]>([]);
const [sceneOptions, setSceneOptions] = useState<string[]>([]);
const [selectedScene, setSelectedScene] = useState<string>('');
const [sceneContent, setSceneContent] = useState<any[]>([]);
const [editingSceneItemId, setEditingSceneItemId] = useState<number | null>(null);
// ... 更多状态

const handleEditSceneItem = (item: any) => {
  // ... 大量逻辑
};

const handleSaveSceneItem = async () => {
  // ... 大量逻辑和API调用
};
*/

// 优化后的代码 (✅):
import { useSceneManagement } from '@/hooks/useSceneManagement';

function ShortplayEntryPage() {
  const {
    scenesData,
    sceneOptions,
    selectedScene,
    sceneContent,
    loadSceneContent,
    updateSceneName,
    handleEditSceneItem,
    handleSaveSceneItem,
    handleCancelEditSceneItem,
    handleStartAddNewItem,
    handleDeleteSceneItem
  } = useSceneManagement();

  // 所有场次管理逻辑都封装在Hook中
  // 组件代码大大简化
}

// ============ 步骤4: 使用UI组件 ============

// 原来的代码 (❌): 内联时间输入组件
/*
<div className="flex items-center space-x-1">
  <input type="number" min="0" max="59" value={startMinutes}
    onChange={(e) => setStartMinutes(e.target.value)} />
  <span>:</span>
  <input type="number" min="0" max="59" value={startSeconds}
    onChange={(e) => setStartSeconds(e.target.value)} />
  // ... 更多代码
</div>
*/

// 优化后的代码 (✅):
import { TimeRangeInput } from '@/components/shortplay/TimeRangeInput';

<TimeRangeInput
  startMinutes={editingSceneStartMinutes}
  startSeconds={editingSceneStartSeconds}
  endMinutes={editingSceneEndMinutes}
  endSeconds={editingSceneEndSeconds}
  onStartMinutesChange={setEditingSceneStartMinutes}
  onStartSecondsChange={setEditingSceneStartSeconds}
  onEndMinutesChange={setEditingSceneEndMinutes}
  onEndSecondsChange={setEditingSceneEndSeconds}
/>

// ============ 步骤5: 使用标题组件 ============

// 原来的代码 (❌): 内联复杂的标题栏逻辑
/*
<div className="p-4 bg-white border-b border-gray-100">
  <div className="flex items-center justify-between">
    // ... 大量代码
  </div>
</div>
*/

// 优化后的代码 (✅):
import { SectionHeader } from '@/components/shortplay/SectionHeader';

<SectionHeader
  title={activeTab === 'script' ? t('shortplayEntry.tabs.script') : '...'}
  subtitle={selectedScene}
  subtitleOptions={sceneOptions}
  onSubtitleChange={(value) => {
    setSelectedScene(value);
    const selectedSceneData = scenesData.find((scene: any) => scene.sceneName === value);
    if (selectedSceneData?.sceneId) {
      loadSceneContent(selectedSceneData.sceneId);
    }
  }}
  onSubtitleEdit={async (value) => {
    const currentSceneData = scenesData.find((scene: any) => scene.sceneName === selectedScene);
    if (currentSceneData?.sceneId) {
      return await updateSceneName(currentSceneData.sceneId, value);
    }
    return false;
  }}
  onAddClick={handleStartAddNewItem}
/>

// ============ 完整的优化示例 ============

import React from 'react';
import toast from 'react-hot-toast';
import { useI18n } from '@/contexts/I18nContext';

// 新的导入
import * as shortplayService from '@/services/shortplayService';
import { parseTimeRange, validateTimeLogic } from '@/utils/shortplayUtils';
import { useSceneManagement } from '@/hooks/useSceneManagement';
import { TimeRangeInput } from '@/components/shortplay/TimeRangeInput';
import { SectionHeader } from '@/components/shortplay/SectionHeader';

function ShortplayEntryPageOptimized() {
  const { t } = useI18n();

  // 使用场次管理Hook
  const {
    scenesData,
    sceneOptions,
    selectedScene,
    sceneContent,
    setSelectedScene,
    loadSceneContent,
    updateSceneName,
    handleStartAddNewItem,
    // ... 其他需要的方法
  } = useSceneManagement();

  // 使用API服务
  const handleGenerateScript = async (userInput: string) => {
    try {
      const result = await shortplayService.createSeries(userInput);
      if (result.code === 0 && result.data?.seriesId) {
        // 轮询获取结果
        pollForSeriesResult(result.data.seriesId);
      }
    } catch (error) {
      toast.error('剧本生成失败');
    }
  };

  const pollForSeriesResult = async (seriesId: string) => {
    try {
      const result = await shortplayService.getSeriesDetail(seriesId);
      if (result.code === 0 && result.data) {
        const { generationStatus, seriesContent, scenes } = result.data;
        if (generationStatus === 'COMPLETED') {
          // 处理完成逻辑
        } else if (generationStatus === 'PROCESSING') {
          setTimeout(() => pollForSeriesResult(seriesId), 3000);
        }
      }
    } catch (error) {
      console.error('轮询失败:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 使用标题组件 */}
      <SectionHeader
        title="剧本"
        subtitle={selectedScene}
        subtitleOptions={sceneOptions}
        onSubtitleChange={setSelectedScene}
        onSubtitleEdit={async (value) => {
          const scene = scenesData.find(s => s.sceneName === selectedScene);
          return scene ? await updateSceneName(scene.sceneId, value) : false;
        }}
        onAddClick={handleStartAddNewItem}
      />

      {/* 其他内容 */}
    </div>
  );
}

export default ShortplayEntryPageOptimized;

// ============ 迁移建议 ============

/*
建议的迁移步骤：

1. 首先替换所有API调用为 shortplayService
   - 风险低，收益高
   - 可以立即统一错误处理

2. 引入工具函数
   - 替换内联的时间处理逻辑
   - 减少重复代码

3. 逐步应用UI组件
   - 从TimeRangeInput开始
   - 再引入SectionHeader

4. 最后引入Hooks
   - 这是最大的重构
   - 建议先在新功能中使用
   - 验证稳定后再替换现有代码

每一步都可以独立完成和测试，降低风险。
*/
