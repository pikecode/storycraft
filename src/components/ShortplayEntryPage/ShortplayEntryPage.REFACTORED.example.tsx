/**
 * ShortplayEntryPage - 重构示例
 *
 * 这是一个示例文件，展示如何使用自定义 hooks 重构主文件
 *
 * 注意：这不是完整的实现，而是一个指导性示例
 */

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button, Select, Segmented } from 'antd';
import toast from 'react-hot-toast';
import { useI18n } from '../contexts/I18nContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

// 导入所有自定义 hooks
import {
  useSceneManagement,
  useAudioManagement,
  useImageManagement,
  useVideoManagement,
  useScriptGeneration
} from './hooks';

// 导入拆分后的组件
import { SortableAudioItem } from './Audio/SortableAudioItem';
import { SortableScriptCard } from './Script/SortableScriptCard';
import { SortableScriptItem } from './Script/SortableScriptItem';
import { BottomInputArea } from './Common/BottomInputArea';
import { TimeRangeInput } from './Common/TimeRangeInput';
import { SectionHeader } from './Common/SectionHeader';
import { SortableImageItem } from './Image/SortableImageItem';
import { SortableVideoItem } from './Video/SortableVideoItem';
import { SortableStoryboardItem } from './Storyboard/SortableStoryboardItem';
import { StoryboardList } from './Storyboard/StoryboardList';

const { Option } = Select;

function ShortplayEntryPageRefactored() {
  const { t } = useI18n();

  // ===== 基础状态 =====
  const [activeTab, setActiveTab] = useState<string>('script');
  const [selectedModel, setSelectedModel] = useState<string>('deepseek-r1');
  const [userInput, setUserInput] = useState<string>('');
  const [hasVideo, setHasVideo] = useState<boolean>(true);

  // 底部输入区域的额外状态
  const [voiceType, setVoiceType] = useState<string>('male');
  const [backgroundType, setBackgroundType] = useState<string>(t('shortplayEntry.image.background'));
  const [style, setStyle] = useState<string>(t('shortplayEntry.image.ancient'));
  const [videoLength, setVideoLength] = useState<string>('2s');
  const [resolution, setResolution] = useState<string>('1080p');
  const [singleGenerate, setSingleGenerate] = useState<boolean>(false);

  // ===== 使用自定义 Hooks =====

  // 1. 场次管理
  const {
    selectedScene,
    sceneOptions,
    scenesData,
    sceneContent,
    showTypeSelector,
    popoverPosition,
    setSelectedScene,
    setSceneContent,
    loadSceneContent,
    loadUserData,
    handleSceneChange,
    handleShowTypeSelector,
    handleHideTypeSelector,
    getCurrentSceneId,
  } = useSceneManagement();

  // 2. 音频管理
  const {
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
    setIsConfiguredVoicesExpanded,
    setAudioType,
    setEditingVoiceName,
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
  } = useAudioManagement();

  // 3. 图片管理
  const {
    imageChatHistory,
    isLoadingImageHistory,
    imageItems,
    storyboardItems,
    isLoadingStoryboard,
    editingTimeId,
    editingStartMinutes,
    editingStartSeconds,
    editingEndMinutes,
    editingEndSeconds,
    deleteStoryboardId,
    isUploading,
    uploadProgress,
    setImageItems,
    setEditingStartMinutes,
    setEditingStartSeconds,
    setEditingEndMinutes,
    setEditingEndSeconds,
    loadImageChatHistory,
    loadStoryboardList,
    handleCreateStoryboard,
    handleDeleteStoryboard,
    handleShowDeleteStoryboardConfirm,
    handleConfirmDeleteStoryboard,
    handleImageDragEnd,
    handleStoryboardDragEnd,
    handleFileUpload,
    handleMultipleFileUpload,
    handleStartEditTime,
    handleSaveTimeEdit,
    handleCancelTimeEdit,
    parseTimeRange,
  } = useImageManagement();

  // 4. 视频管理
  const {
    videoItems,
    videoRef,
    videoChatHistory,
    isLoadingVideoHistory,
    isVideoGenerating,
    isGeneratingPreview,
    uploadedImages,
    isPlaying,
    progress,
    isDragging,
    setVideoItems,
    setUploadedImages,
    setIsPlaying,
    setProgress,
    loadVideoChatHistory,
    handleVideoPreview,
    handleVideoGenerate,
    handleVideoDragEnd,
    handleRemoveUploadedImage,
    handleVideoLoaded,
    handleProgressMove,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  } = useVideoManagement();

  // 5. 脚本生成
  const {
    isGenerating,
    generatedContent,
    generationStatus,
    scriptCards,
    editingSceneItemId,
    editingSceneContent,
    editingSceneType,
    editingSceneRoleName,
    editingSceneStartMinutes,
    editingSceneStartSeconds,
    editingSceneEndMinutes,
    editingSceneEndSeconds,
    deleteConfirmId,
    setIsGenerating,
    setEditingSceneType,
    setEditingSceneContent,
    setEditingSceneRoleName,
    setEditingSceneStartMinutes,
    setEditingSceneStartSeconds,
    setEditingSceneEndMinutes,
    setEditingSceneEndSeconds,
    handleGenerate,
    handleImageGenerate,
    handleBgmGenerate,
    handleAudioGenerate,
    handleDeleteScriptCard,
    handleShowDeleteConfirm,
    handleConfirmDelete,
    handleCancelDelete,
    handleScriptDragEnd,
    handleEditSceneItem,
    handleSaveSceneItem,
    handleCancelEditSceneItem,
    handleStartAddNewItem,
    handleCreateNewItem,
  } = useScriptGeneration();

  // ===== 拖拽传感器配置 =====
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ===== 生命周期 =====

  // 组件加载时获取用户数据
  useEffect(() => {
    loadUserData();
  }, []);

  // Tab切换时加载数据
  useEffect(() => {
    const currentSceneId = getCurrentSceneId();

    if (activeTab === 'script') {
      // 加载剧本内容列表
      if (currentSceneId) {
        loadSceneContent(currentSceneId);
      }
    } else if (activeTab === 'audio') {
      // 加载音频内容列表
      if (currentSceneId) {
        loadAudioContent(currentSceneId);
      }

      // 首次进入音频Tab时也加载资源
      if (audioType === 'voice') {
        loadAllVoices();
      } else {
        loadBgmList();
      }
    } else if (activeTab === 'image') {
      loadImageChatHistory(currentSceneId);
      loadStoryboardList(currentSceneId);
    } else if (activeTab === 'video') {
      loadVideoChatHistory(currentSceneId);
      loadStoryboardList(currentSceneId);
    }
  }, [activeTab, selectedScene]);

  // 音色/音效切换时只加载左侧资源
  useEffect(() => {
    if (activeTab === 'audio' && prevAudioTypeRef.current !== audioType) {
      if (audioType === 'voice') {
        loadAllVoices();
      } else {
        loadBgmList();
      }
      prevAudioTypeRef.current = audioType;
    }
  }, [audioType, activeTab]);

  // ===== 事件处理函数 =====

  /**
   * 场次切换处理
   */
  const onSceneChange = (sceneName: string) => {
    const sceneId = handleSceneChange(sceneName);
    if (sceneId) {
      loadSceneContent(sceneId);
    }
  };

  /**
   * 统一的生成处理函数
   */
  const onGenerate = async () => {
    if (activeTab === 'script') {
      // 剧本生成
      const newInput = await handleGenerate(
        userInput,
        t,
        loadSceneContent,
        (data) => {/* 场次数据更新 */},
        (options) => {/* 场次选项更新 */},
        setSelectedScene
      );
      if (newInput === '') {
        setUserInput('');
      }
    } else if (activeTab === 'audio') {
      // 音频生成
      if (audioType === 'voice') {
        const newInput = await handleAudioGenerate(userInput, t, loadAllVoices);
        if (newInput === '') {
          setUserInput('');
        }
      } else {
        const newInput = await handleBgmGenerate(userInput, t);
        if (newInput === '') {
          setUserInput('');
        }
      }
    } else if (activeTab === 'image') {
      // 图片生成
      const newInput = await handleImageGenerate(userInput, getCurrentSceneId(), t);
      if (newInput === '') {
        setUserInput('');
      }
    } else if (activeTab === 'video') {
      // 视频生成
      await handleVideoGenerate(
        userInput,
        getCurrentSceneId(),
        setIsGenerating,
        (status) => {/* 设置生成状态 */}
      );
    }
  };

  /**
   * 文件上传处理（图片）
   */
  const onFileUpload = async (file: File) => {
    const result = await handleFileUpload(file, getCurrentSceneId());
    if (result) {
      // 创建分镜板
      await handleCreateStoryboard(result.attachmentId, file.name, getCurrentSceneId());
    }
    return result;
  };

  /**
   * 多文件上传处理（视频）
   */
  const onMultipleFileUpload = async (files: File[]) => {
    return await videoManagement.handleMultipleFileUpload(files);
  };

  // ===== 渲染 =====

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="flex flex-grow overflow-hidden">
        {/* 左侧面板 - 一键创作 */}
        <div className="flex-1 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
          {/* 顶部Logo和标题区 */}
          <div className="p-4 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base font-medium text-gray-900">AI创作</span>
              </div>

              {/* Tab切换 */}
              <Segmented
                value={activeTab}
                onChange={(value) => setActiveTab(value as string)}
                options={[
                  { label: '剧本', value: 'script' },
                  { label: '音频', value: 'audio' },
                  { label: '图片', value: 'image' },
                  { label: '视频', value: 'video' }
                ]}
              />
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex-grow p-4 min-h-0">
            <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
              <div className="flex-grow p-4 overflow-auto min-h-0">
                {activeTab === 'script' && (
                  <div className="space-y-4">
                    {generatedContent ? (
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {generatedContent}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        暂无剧本内容
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'audio' && (
                  <div>
                    {/* 音频Tab内容 */}
                    {/* 这里可以创建独立的 AudioTabContent 组件 */}
                  </div>
                )}

                {activeTab === 'image' && (
                  <div>
                    {/* 图片Tab内容 */}
                    {/* 这里可以创建独立的 ImageTabContent 组件 */}
                  </div>
                )}

                {activeTab === 'video' && (
                  <div>
                    {/* 视频Tab内容 */}
                    {/* 这里可以创建独立的 VideoTabContent 组件 */}
                  </div>
                )}
              </div>

              {/* 底部输入区域 */}
              <BottomInputArea
                activeTab={activeTab}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                userInput={userInput}
                onInputChange={setUserInput}
                isGenerating={isGenerating}
                onGenerate={onGenerate}
                generationStatus={generationStatus}
                voiceType={voiceType}
                onVoiceTypeChange={setVoiceType}
                backgroundType={backgroundType}
                onBackgroundTypeChange={setBackgroundType}
                style={style}
                onStyleChange={setStyle}
                videoLength={videoLength}
                onVideoLengthChange={setVideoLength}
                resolution={resolution}
                onResolutionChange={setResolution}
                singleGenerate={singleGenerate}
                onSingleGenerateChange={setSingleGenerate}
                onFileUpload={onFileUpload}
                onMultipleFileUpload={onMultipleFileUpload}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
            </div>
          </div>
        </div>

        {/* 右侧面板 - 内容展示 */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
          {/* 场次选择 */}
          <div className="p-4 border-b border-gray-200">
            <Select
              value={selectedScene}
              onChange={onSceneChange}
              className="w-full"
              placeholder="选择场次"
            >
              {sceneOptions.map(option => (
                <Option key={option} value={option}>{option}</Option>
              ))}
            </Select>
          </div>

          {/* 内容区域 */}
          <div className="flex-grow p-4 overflow-auto">
            {activeTab === 'script' && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => {/* 处理拖拽 */}}
              >
                {/* 剧本内容列表 */}
                {sceneContent.map((item, index) => (
                  <SortableScriptItem
                    key={item.id}
                    item={item}
                    index={index}
                    editingSceneItemId={editingSceneItemId}
                    editingSceneType={editingSceneType}
                    editingSceneContent={editingSceneContent}
                    editingSceneRoleName={editingSceneRoleName}
                    editingSceneStartMinutes={editingSceneStartMinutes}
                    editingSceneStartSeconds={editingSceneStartSeconds}
                    editingSceneEndMinutes={editingSceneEndMinutes}
                    editingSceneEndSeconds={editingSceneEndSeconds}
                    onEditingSceneTypeChange={setEditingSceneType}
                    onEditingSceneContentChange={setEditingSceneContent}
                    onEditingSceneRoleNameChange={setEditingSceneRoleName}
                    onEditingSceneStartMinutesChange={setEditingSceneStartMinutes}
                    onEditingSceneStartSecondsChange={setEditingSceneStartSeconds}
                    onEditingSceneEndMinutesChange={setEditingSceneEndMinutes}
                    onEditingSceneEndSecondsChange={setEditingSceneEndSeconds}
                    onEditSceneItem={handleEditSceneItem}
                    onSaveSceneItem={() => handleSaveSceneItem(sceneContent, setSceneContent)}
                    onCancelEditSceneItem={handleCancelEditSceneItem}
                    onShowDeleteConfirm={handleShowDeleteConfirm}
                    TimeRangeInput={TimeRangeInput}
                  />
                ))}
              </DndContext>
            )}

            {/* 其他Tab的内容... */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShortplayEntryPageRefactored;
