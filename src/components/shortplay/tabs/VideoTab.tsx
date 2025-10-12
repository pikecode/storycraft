/**
 * VideoTab Component
 * 视频Tab - 负责视频生成、文件上传、分镜板管理
 */

import React, { useRef } from 'react';
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
import type { ChatHistoryItem, StoryboardItem, UploadedImage } from '../../../types/shortplay';
import { extractFilesFromChatHistory } from '../../../utils/shortplayUtils';

interface VideoTabProps {
  // 数据
  videoChatHistory: ChatHistoryItem[];
  storyboardItems: StoryboardItem[];
  uploadedImages: UploadedImage[];
  selectedScene: string;
  sceneOptions: string[];

  // 状态
  isLoadingVideoHistory: boolean;
  isLoadingStoryboard: boolean;
  isUploading: boolean;
  uploadProgress: { current: number; total: number };
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
  onFileUpload: (files: File[]) => void;
  onShowRemoveImageConfirm: (fileId: string) => void;
  onUserInputChange: (value: string) => void;
  onGenerate: () => void;
  onApplyVideo: (fileId: string, fileName: string) => void;
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

export const VideoTab: React.FC<VideoTabProps> = ({
  videoChatHistory,
  storyboardItems,
  uploadedImages,
  selectedScene,
  sceneOptions,
  isLoadingVideoHistory,
  isLoadingStoryboard,
  isUploading,
  uploadProgress,
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
  onFileUpload,
  onShowRemoveImageConfirm,
  onUserInputChange,
  onGenerate,
  onApplyVideo,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const videoFiles = extractFilesFromChatHistory(videoChatHistory, 'VIDEO');

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFileUpload(files);
    }
    // 清空input，允许重复选择相同文件
    e.target.value = '';
  };

  // 触发文件选择
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full">
      {/* 标题栏 */}
      <SectionHeader
        title="视频"
        subtitle={selectedScene}
        subtitleOptions={sceneOptions}
        onSubtitleChange={onSceneSelect}
        onSubtitleEdit={onSceneNameEdit}
      />

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {/* 文件上传区域 */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Icon icon="ri:upload-cloud-line" className="w-4 h-4 mr-2" />
            上传素材图片
            {isUploading && (
              <span className="ml-2 text-xs text-blue-500">
                上传中 {uploadProgress.current}/{uploadProgress.total}
              </span>
            )}
          </h3>

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* 上传按钮 */}
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon icon="ri:add-line" className="w-6 h-6 mx-auto text-gray-400" />
            <p className="text-sm text-gray-600 mt-2">
              {isUploading ? '上传中...' : '点击上传图片'}
            </p>
            <p className="text-xs text-gray-400 mt-1">支持多选</p>
          </button>

          {/* 已上传图片列表 */}
          {uploadedImages.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {uploadedImages.map((image) => (
                <div
                  key={image.fileId}
                  className="relative group border border-gray-200 rounded overflow-hidden"
                >
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={image.fileUrl}
                      alt={image.fileName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => onShowRemoveImageConfirm(image.fileId)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除"
                  >
                    <Icon icon="ri:close-line" className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 视频生成记录 */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Icon icon="ri:video-line" className="w-4 h-4 mr-2" />
            生成的视频
            {isLoadingVideoHistory && (
              <Icon icon="ri:loader-4-line" className="w-4 h-4 ml-2 animate-spin text-blue-500" />
            )}
          </h3>

          {videoFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              暂无生成的视频
            </div>
          ) : (
            <div className="space-y-3">
              {videoFiles.map((file, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative w-full h-48 bg-gray-100">
                    <video
                      src={file.downloadUrl}
                      controls
                      className="w-full h-full object-cover"
                      preload="metadata"
                    >
                      您的浏览器不支持视频播放
                    </video>
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {file.recordContent}
                    </p>
                    {file.createTime && (
                      <p className="text-xs text-gray-400 mb-2">
                        生成时间: {new Date(file.createTime).toLocaleString()}
                      </p>
                    )}
                    <button
                      onClick={() => onApplyVideo(file.fileId, file.fileName)}
                      className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
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
              <p className="mt-2">将生成的视频应用到分镜板</p>
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
        placeholder={
          uploadedImages.length > 0
            ? '描述基于这些图片生成的视频内容...'
            : '描述你想要生成的视频，例如：一个城市夜景的延时摄影...'
        }
        buttonText="生成视频"
        showAttachment={true}
        onAttachmentClick={handleUploadClick}
        disabled={isGenerating || isUploading}
      />
    </div>
  );
};
