/**
 * ImageTab Component
 * 图片Tab - 负责图片生成和分镜板管理
 */

import React from 'react';
import { Icon } from '@iconify/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SectionHeader } from '../SectionHeader';
import { SortableStoryboardItem } from '../SortableStoryboardItem';
import { BottomInputArea } from '../BottomInputArea';
import type { ChatHistoryItem, StoryboardItem } from '../../../types/shortplay';
import { extractFilesFromChatHistory } from '../../../utils/shortplayUtils';

interface ImageTabProps {
  // 数据
  imageChatHistory: ChatHistoryItem[];
  storyboardItems: StoryboardItem[];
  selectedScene: string;
  sceneOptions: string[];

  // 状态
  isLoadingImageHistory: boolean;
  isLoadingStoryboard: boolean;
  userInput: string;
  isGenerating: boolean;
  generationStatus: string;

  // 时间编辑状态
  editingTimeId: string | null;
  editingStartMinutes: string;
  editingStartSeconds: string;
  editingEndMinutes: string;
  editingEndSeconds: string;

  // 事件处理
  onSceneSelect: (sceneName: string) => void;
  onSceneNameEdit: (newName: string) => Promise<boolean>;
  onUserInputChange: (value: string) => void;
  onGenerate: () => void;
  onApplyImage: (fileId: string, fileName: string) => void;
  onShowDeleteConfirm: (itemId: string) => void;
  onStoryboardDragEnd: (event: any) => void;
  onStartEditTime: (itemId: string, timeRange: string) => void;
  onSaveTimeEdit: (itemId: string) => void;
  onCancelTimeEdit: () => void;

  // Setters
  setEditingStartMinutes: (minutes: string) => void;
  setEditingStartSeconds: (seconds: string) => void;
  setEditingEndMinutes: (minutes: string) => void;
  setEditingEndSeconds: (seconds: string) => void;
}

export const ImageTab: React.FC<ImageTabProps> = ({
  imageChatHistory,
  storyboardItems,
  selectedScene,
  sceneOptions,
  isLoadingImageHistory,
  isLoadingStoryboard,
  userInput,
  isGenerating,
  generationStatus,
  editingTimeId,
  editingStartMinutes,
  editingStartSeconds,
  editingEndMinutes,
  editingEndSeconds,
  onSceneSelect,
  onSceneNameEdit,
  onUserInputChange,
  onGenerate,
  onApplyImage,
  onShowDeleteConfirm,
  onStoryboardDragEnd,
  onStartEditTime,
  onSaveTimeEdit,
  onCancelTimeEdit,
  setEditingStartMinutes,
  setEditingStartSeconds,
  setEditingEndMinutes,
  setEditingEndSeconds
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const imageFiles = extractFilesFromChatHistory(imageChatHistory, 'IMAGE');

  return (
    <div className="flex flex-col h-full">
      {/* 标题栏 */}
      <SectionHeader
        title="图片"
        subtitle={selectedScene}
        subtitleOptions={sceneOptions}
        onSubtitleChange={onSceneSelect}
        onSubtitleEdit={onSceneNameEdit}
      />

      {/* 内容区域 - 分为两个部分 */}
      <div className="flex-1 overflow-y-auto">
        {/* 图片生成记录 */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Icon icon="ri:image-line" className="w-4 h-4 mr-2" />
            生成的图片
            {isLoadingImageHistory && (
              <Icon icon="ri:loader-4-line" className="w-4 h-4 ml-2 animate-spin text-blue-500" />
            )}
          </h3>

          {imageFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              暂无生成的图片
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {imageFiles.map((file, index) => (
                <div
                  key={index}
                  className="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={file.downloadUrl}
                      alt={file.fileName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {file.recordContent}
                    </p>
                    <button
                      onClick={() => onApplyImage(file.fileId, file.fileName)}
                      className="w-full px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      应用到分镜板
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 分镜板 */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Icon icon="ri:layout-grid-line" className="w-4 h-4 mr-2" />
            分镜板
            {isLoadingStoryboard && (
              <Icon icon="ri:loader-4-line" className="w-4 h-4 ml-2 animate-spin text-blue-500" />
            )}
          </h3>

          {storyboardItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              暂无分镜板内容
              <p className="mt-2">将生成的图片应用到分镜板</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onStoryboardDragEnd}
            >
              <SortableContext
                items={storyboardItems.map((item) => item.id.toString())}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {storyboardItems.map((item) => (
                    <SortableStoryboardItem
                      key={item.id}
                      item={item}
                      editingTimeId={editingTimeId}
                      editingStartMinutes={editingStartMinutes}
                      editingStartSeconds={editingStartSeconds}
                      editingEndMinutes={editingEndMinutes}
                      editingEndSeconds={editingEndSeconds}
                      onEditingStartMinutesChange={setEditingStartMinutes}
                      onEditingStartSecondsChange={setEditingStartSeconds}
                      onEditingEndMinutesChange={setEditingEndMinutes}
                      onEditingEndSecondsChange={setEditingEndSeconds}
                      onStartEditTime={onStartEditTime}
                      onSaveTimeEdit={onSaveTimeEdit}
                      onCancelTimeEdit={onCancelTimeEdit}
                      onDelete={onShowDeleteConfirm}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* 底部输入区域 */}
      <BottomInputArea
        userInput={userInput}
        onUserInputChange={onUserInputChange}
        onGenerate={onGenerate}
        isGenerating={isGenerating}
        generationStatus={generationStatus}
        placeholder="描述你想要生成的图片，例如：一个现代都市的夜景..."
        buttonText="生成图片"
      />
    </div>
  );
};
