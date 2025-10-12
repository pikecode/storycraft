/**
 * ShortplayEntryPage (重构版)
 * 一键创作页面 - 使用模块化Hook和组件
 */

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useI18n } from '../contexts/I18nContext';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

// Hooks
import { useSceneManagement } from '../hooks/useSceneManagement';
import { useVoiceManagement } from '../hooks/useVoiceManagement';
import { useImageManagement } from '../hooks/useImageManagement';
import { useVideoManagement } from '../hooks/useVideoManagement';
import { useStoryboardManagement } from '../hooks/useStoryboardManagement';

// Services
import * as shortplayService from '../services/shortplayService';

// Components
import { ScriptTab } from './shortplay/tabs/ScriptTab';
import { AudioTab } from './shortplay/tabs/AudioTab';
import { ImageTab } from './shortplay/tabs/ImageTab';
import { VideoTab } from './shortplay/tabs/VideoTab';
import { PhonePreview } from './shortplay/PhonePreview';
import { DeleteConfirmDialog } from './shortplay/DeleteConfirmDialog';

// Types
import type { TabType } from '../types/shortplay';

export function ShortplayEntryPage() {
  const { t } = useI18n();

  // ============ 本地状态 ============
  const [activeTab, setActiveTab] = useState<TabType>('script');
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [seriesId, setSeriesId] = useState<string | null>(null);

  // 删除确认状态
  const [deleteStoryboardId, setDeleteStoryboardId] = useState<string | null>(null);
  const [removeUploadedImageId, setRemoveUploadedImageId] = useState<string | null>(null);

  // ============ 使用自定义Hooks ============
  const sceneManagement = useSceneManagement();
  const voiceManagement = useVoiceManagement();
  const imageManagement = useImageManagement();
  const videoManagement = useVideoManagement();
  const storyboardManagement = useStoryboardManagement();

  // ============ 初始化数据加载 ============
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // 加载剧本数据
      const result = await shortplayService.getSeriesDetail();
      if (result.code === 0 && result.data) {
        const { seriesId, scenes } = result.data;
        if (seriesId) {
          setSeriesId(seriesId);
        }
        if (scenes && scenes.length > 0) {
          sceneManagement.setScenesData(scenes);
          const options = scenes.map((s: any) => s.sceneName);
          sceneManagement.setSceneOptions(options);
          sceneManagement.setSelectedScene(scenes[0].sceneName);

          // 加载第一个场次的内容
          await sceneManagement.loadSceneContent(scenes[0].sceneId);
        }
      }

      // 加载音色数据
      await voiceManagement.loadAllVoices();
    } catch (error) {
      console.error('初始化数据加载失败:', error);
    }
  };

  // ============ Tab切换时的数据加载 ============
  useEffect(() => {
    const currentSceneData = sceneManagement.scenesData.find(
      (scene) => scene.sceneName === sceneManagement.selectedScene
    );
    const sceneId = currentSceneData?.sceneId;

    if (!sceneId) return;

    switch (activeTab) {
      case 'image':
        imageManagement.loadImageChatHistory(sceneId);
        storyboardManagement.loadStoryboardList(sceneId);
        break;
      case 'video':
        videoManagement.loadVideoChatHistory(sceneId);
        storyboardManagement.loadStoryboardList(sceneId);
        break;
    }
  }, [activeTab, sceneManagement.selectedScene]);

  // ============ 剧本生成 ============
  const handleScriptGenerate = async () => {
    if (!userInput.trim()) {
      toast.error('请输入创作需求');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('正在生成剧本...');

    try {
      const result = await shortplayService.createSeries(userInput.trim());

      if (result.code === 0 && result.data?.seriesId) {
        setSeriesId(result.data.seriesId);
        toast.success('剧本生成任务已开始！');
        pollForSeriesResult(result.data.seriesId);
      } else {
        throw new Error(result.message || '剧本生成失败');
      }
    } catch (error) {
      console.error('剧本生成失败:', error);
      toast.error('剧本生成失败：' + (error as Error).message);
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  const pollForSeriesResult = async (id: string) => {
    try {
      const result = await shortplayService.getSeriesDetail(id);

      if (result.code === 0 && result.data) {
        const { generationStatus, scenes } = result.data;

        if (generationStatus === 'COMPLETED') {
          setGenerationStatus('剧本生成完成！');
          toast.success('剧本生成成功！');

          if (scenes && scenes.length > 0) {
            sceneManagement.setScenesData(scenes);
            const options = scenes.map((s: any) => s.sceneName);
            sceneManagement.setSceneOptions(options);
            sceneManagement.setSelectedScene(scenes[0].sceneName);
            await sceneManagement.loadSceneContent(scenes[0].sceneId);
          }

          setIsGenerating(false);
          setGenerationStatus('');
          setUserInput('');
        } else if (generationStatus === 'PROCESSING') {
          setGenerationStatus('剧本生成中，请稍候...');
          setTimeout(() => pollForSeriesResult(id), 3000);
        } else if (generationStatus === 'FAILED') {
          throw new Error('剧本生成失败');
        }
      }
    } catch (error) {
      console.error('轮询失败:', error);
      toast.error('剧本生成失败');
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  // ============ 场次选择处理 ============
  const handleSceneSelect = async (sceneName: string) => {
    sceneManagement.setSelectedScene(sceneName);
    const selectedSceneData = sceneManagement.scenesData.find(
      (scene) => scene.sceneName === sceneName
    );

    if (selectedSceneData?.sceneId) {
      await sceneManagement.loadSceneContent(selectedSceneData.sceneId);

      // 如果是图片或视频Tab，也需要加载相应数据
      if (activeTab === 'image') {
        await imageManagement.loadImageChatHistory(selectedSceneData.sceneId);
        await storyboardManagement.loadStoryboardList(selectedSceneData.sceneId);
      } else if (activeTab === 'video') {
        await videoManagement.loadVideoChatHistory(selectedSceneData.sceneId);
        await storyboardManagement.loadStoryboardList(selectedSceneData.sceneId);
      }
    }
  };

  // ============ 场次内容拖拽排序 ============
  const handleSceneContentDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldItems = sceneManagement.sceneContent;
      const oldIndex = oldItems.findIndex((item) => item.id.toString() === active.id);
      const newIndex = oldItems.findIndex((item) => item.id.toString() === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(oldItems, oldIndex, newIndex);
        sceneManagement.setSceneContent(newItems);

        try {
          const movedItem = oldItems[oldIndex];
          const newOrderNum = newIndex + 1;
          await sceneManagement.updateSceneContentOrder(movedItem.id, newOrderNum);
          toast.success('排序已更新！');
        } catch (error) {
          sceneManagement.setSceneContent(oldItems);
          toast.error('排序更新失败');
        }
      }
    }
  };

  // ============ 图片生成 ============
  const handleImageGenerate = async () => {
    const currentSceneData = sceneManagement.scenesData.find(
      (scene) => scene.sceneName === sceneManagement.selectedScene
    );

    if (!currentSceneData?.sceneId) {
      toast.error('请先选择场次');
      return;
    }

    const success = await imageManagement.handleImageGenerate(
      currentSceneData.sceneId,
      userInput
    );

    if (success) {
      setUserInput('');
      await storyboardManagement.loadStoryboardList(currentSceneData.sceneId);
    }
  };

  // ============ 视频生成 ============
  const handleVideoGenerate = async () => {
    const currentSceneData = sceneManagement.scenesData.find(
      (scene) => scene.sceneName === sceneManagement.selectedScene
    );

    if (!currentSceneData?.sceneId) {
      toast.error('请先选择场次');
      return;
    }

    const success = await videoManagement.handleVideoGenerate(
      currentSceneData.sceneId,
      userInput
    );

    if (success) {
      setUserInput('');
    }
  };

  // ============ 音频生成（音色设计/BGM生成） ============
  const handleAudioGenerate = async () => {
    if (voiceManagement.audioType === 'voice') {
      // AI音色设计
      const success = await voiceManagement.handleVoiceDesign(userInput);
      if (success) {
        setUserInput('');
      }
    } else {
      // BGM生成
      toast.info('BGM生成功能开发中...');
    }
  };

  // ============ 应用图片到分镜板 ============
  const handleApplyImage = async (fileId: string, fileName: string) => {
    const currentSceneData = sceneManagement.scenesData.find(
      (scene) => scene.sceneName === sceneManagement.selectedScene
    );

    if (currentSceneData?.sceneId) {
      await storyboardManagement.handleCreateStoryboard(
        currentSceneData.sceneId,
        fileId,
        fileName
      );
    }
  };

  // ============ 应用视频到分镜板 ============
  const handleApplyVideo = async (fileId: string, fileName: string) => {
    const currentSceneData = sceneManagement.scenesData.find(
      (scene) => scene.sceneName === sceneManagement.selectedScene
    );

    if (currentSceneData?.sceneId) {
      await storyboardManagement.handleCreateStoryboard(
        currentSceneData.sceneId,
        fileId,
        fileName
      );
    }
  };

  // ============ 删除分镜板 ============
  const handleShowDeleteStoryboardConfirm = (itemId: string) => {
    console.log('🔍 删除分镜板确认 - itemId:', itemId);
    setDeleteStoryboardId(itemId);
    console.log('🔍 deleteStoryboardId 已设置为:', itemId);
  };

  const handleConfirmDeleteStoryboard = async () => {
    if (!deleteStoryboardId) return;

    const currentSceneData = sceneManagement.scenesData.find(
      (scene) => scene.sceneName === sceneManagement.selectedScene
    );

    if (currentSceneData?.sceneId) {
      await storyboardManagement.handleDeleteStoryboard(deleteStoryboardId, currentSceneData.sceneId);
    }

    setDeleteStoryboardId(null);
  };

  // ============ 删除已上传图片 ============
  const handleShowRemoveImageConfirm = (fileId: string) => {
    setRemoveUploadedImageId(fileId);
  };

  const handleConfirmRemoveImage = () => {
    if (!removeUploadedImageId) return;

    videoManagement.setUploadedImages((prev) =>
      prev.filter((img) => img.fileId !== removeUploadedImageId)
    );

    setRemoveUploadedImageId(null);
  };

  // ============ 分镜板拖拽排序 ============
  const handleStoryboardDragEnd = async (event: DragEndEvent) => {
    const currentSceneData = sceneManagement.scenesData.find(
      (scene) => scene.sceneName === sceneManagement.selectedScene
    );

    if (currentSceneData?.sceneId) {
      await storyboardManagement.handleDragEnd(event, currentSceneData.sceneId);
    }
  };

  // ============ 保存分镜板时间编辑 ============
  const handleSaveStoryboardTime = async (itemId: string) => {
    const currentSceneData = sceneManagement.scenesData.find(
      (scene) => scene.sceneName === sceneManagement.selectedScene
    );

    if (currentSceneData?.sceneId) {
      await storyboardManagement.handleSaveTimeEdit(itemId, currentSceneData.sceneId);
    }
  };

  // ============ 根据Tab决定生成处理函数 ============
  const handleGenerate = () => {
    switch (activeTab) {
      case 'script':
        handleScriptGenerate();
        break;
      case 'audio':
        handleAudioGenerate();
        break;
      case 'image':
        handleImageGenerate();
        break;
      case 'video':
        handleVideoGenerate();
        break;
    }
  };

  // ============ 渲染 ============
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧：Tab切换和内容 */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Tab导航 */}
        <div className="flex border-b border-gray-200">
          {[
            { key: 'script', label: t('shortplayEntry.tabs.script'), icon: 'ri:file-text-line' },
            { key: 'audio', label: t('shortplayEntry.tabs.audio'), icon: 'ri:music-line' },
            { key: 'image', label: t('shortplayEntry.tabs.image'), icon: 'ri:image-line' },
            { key: 'video', label: t('shortplayEntry.tabs.video'), icon: 'ri:video-line' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <Icon icon={tab.icon} className="w-5 h-5" />
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Tab内容 */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'script' && (
            <ScriptTab
              {...sceneManagement}
              userInput={userInput}
              isGenerating={isGenerating}
              generationStatus={generationStatus}
              onSceneSelect={handleSceneSelect}
              onSceneNameEdit={sceneManagement.updateSceneName}
              onAddNewItem={sceneManagement.handleStartAddNewItem}
              onEditSceneItem={sceneManagement.handleEditSceneItem}
              onSaveSceneItem={sceneManagement.handleSaveSceneItem}
              onCancelEditSceneItem={sceneManagement.handleCancelEditSceneItem}
              onShowDeleteConfirm={(id) => sceneManagement.setDeleteConfirmId(id)}
              onSceneContentDragEnd={handleSceneContentDragEnd}
              onUserInputChange={setUserInput}
              onGenerate={handleGenerate}
            />
          )}

          {activeTab === 'audio' && (
            <AudioTab
              {...voiceManagement}
              selectedScene={sceneManagement.selectedScene}
              sceneOptions={sceneManagement.sceneOptions}
              userInput={userInput}
              isGenerating={isGenerating}
              generationStatus={generationStatus}
              bgmList={[]} // TODO: 实现BGM列表加载
              onSceneSelect={handleSceneSelect}
              onSceneNameEdit={sceneManagement.updateSceneName}
              onConfiguredVoicesToggle={() =>
                voiceManagement.setIsConfiguredVoicesExpanded(!voiceManagement.isConfiguredVoicesExpanded)
              }
              onAvailableVoicesToggle={() =>
                voiceManagement.setIsAvailableVoicesExpanded(!voiceManagement.isAvailableVoicesExpanded)
              }
              onUserInputChange={setUserInput}
              onGenerate={handleGenerate}
            />
          )}

          {activeTab === 'image' && (
            <ImageTab
              {...imageManagement}
              {...storyboardManagement}
              selectedScene={sceneManagement.selectedScene}
              sceneOptions={sceneManagement.sceneOptions}
              userInput={userInput}
              isGenerating={isGenerating || imageManagement.isGenerating}
              generationStatus={generationStatus || imageManagement.generationStatus}
              onSceneSelect={handleSceneSelect}
              onSceneNameEdit={sceneManagement.updateSceneName}
              onUserInputChange={setUserInput}
              onGenerate={handleGenerate}
              onApplyImage={handleApplyImage}
              onShowDeleteConfirm={handleShowDeleteStoryboardConfirm}
              onStoryboardDragEnd={handleStoryboardDragEnd}
              onStartEditTime={storyboardManagement.handleStartEditTime}
              onSaveTimeEdit={handleSaveStoryboardTime}
              onCancelTimeEdit={storyboardManagement.handleCancelTimeEdit}
              setEditingStartMinutes={storyboardManagement.setEditingStartMinutes}
              setEditingStartSeconds={storyboardManagement.setEditingStartSeconds}
              setEditingEndMinutes={storyboardManagement.setEditingEndMinutes}
              setEditingEndSeconds={storyboardManagement.setEditingEndSeconds}
            />
          )}

          {activeTab === 'video' && (
            <VideoTab
              {...videoManagement}
              storyboardItems={storyboardManagement.storyboardItems}
              isLoadingStoryboard={storyboardManagement.isLoadingStoryboard}
              selectedScene={sceneManagement.selectedScene}
              sceneOptions={sceneManagement.sceneOptions}
              userInput={userInput}
              isGenerating={isGenerating || videoManagement.isGenerating}
              generationStatus={generationStatus || videoManagement.generationStatus}
              editingTimeId={storyboardManagement.editingTimeId}
              editingStartMinutes={storyboardManagement.editingStartMinutes}
              editingStartSeconds={storyboardManagement.editingStartSeconds}
              editingEndMinutes={storyboardManagement.editingEndMinutes}
              editingEndSeconds={storyboardManagement.editingEndSeconds}
              onSceneSelect={handleSceneSelect}
              onSceneNameEdit={sceneManagement.updateSceneName}
              onFileUpload={videoManagement.handleMultipleFileUpload}
              onShowRemoveImageConfirm={handleShowRemoveImageConfirm}
              onUserInputChange={setUserInput}
              onGenerate={handleGenerate}
              onApplyVideo={handleApplyVideo}
              onShowDeleteConfirm={handleShowDeleteStoryboardConfirm}
              onStoryboardDragEnd={handleStoryboardDragEnd}
              onStartEditTime={storyboardManagement.handleStartEditTime}
              onSaveTimeEdit={handleSaveStoryboardTime}
              onCancelTimeEdit={storyboardManagement.handleCancelTimeEdit}
              setEditingStartMinutes={storyboardManagement.setEditingStartMinutes}
              setEditingStartSeconds={storyboardManagement.setEditingStartSeconds}
              setEditingEndMinutes={storyboardManagement.setEditingEndMinutes}
              setEditingEndSeconds={storyboardManagement.setEditingEndSeconds}
            />
          )}
        </div>
      </div>

      {/* 中间：剧本编辑区（TODO） */}
      <div className="flex-1 bg-white">
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Icon icon="ri:file-edit-line" className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>剧本编辑区域</p>
            <p className="text-sm mt-2">（待实现）</p>
          </div>
        </div>
      </div>

      {/* 右侧：手机预览 */}
      <div className="w-[340px] bg-white border-l border-gray-200">
        <PhonePreview
          sceneContent={sceneManagement.sceneContent}
          storyboardItems={storyboardManagement.storyboardItems}
          selectedScene={sceneManagement.selectedScene}
        />
      </div>

      {/* 删除确认对话框 - 场次内容 */}
      <DeleteConfirmDialog
        isOpen={sceneManagement.deleteConfirmId !== null}
        title="确认删除"
        message="确定要删除这项场次内容吗？此操作无法撤销。"
        onConfirm={async () => {
          if (sceneManagement.deleteConfirmId !== null) {
            await sceneManagement.handleDeleteSceneItem(sceneManagement.deleteConfirmId);
            sceneManagement.setDeleteConfirmId(null);
          }
        }}
        onCancel={() => sceneManagement.setDeleteConfirmId(null)}
      />

      {/* 删除确认对话框 - 分镜板 */}
      <DeleteConfirmDialog
        isOpen={deleteStoryboardId !== null}
        title="确认删除"
        message="确定要删除这个分镜板吗？此操作无法撤销。"
        onConfirm={handleConfirmDeleteStoryboard}
        onCancel={() => setDeleteStoryboardId(null)}
      />

      {/* 删除确认对话框 - 已上传图片 */}
      <DeleteConfirmDialog
        isOpen={removeUploadedImageId !== null}
        title="确认删除"
        message="确定要删除这张已上传的图片吗？此操作无法撤销。"
        onConfirm={handleConfirmRemoveImage}
        onCancel={() => setRemoveUploadedImageId(null)}
      />
    </div>
  );
}

export default ShortplayEntryPage;
