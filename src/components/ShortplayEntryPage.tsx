import React, { useState, useRef } from 'react';
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
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 一键创作API基础路径
const STORYAI_API_BASE = '/episode-api/storyai';

const { Option } = Select;

// 时间格式化工具函数：毫秒转 mm:ss
const formatMillisecondsToTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// 可排序的音频项组件
interface AudioItem {
  id: string;
  type: 'voice' | 'sound';
  itemType?: number; // 原始类型：1=场景描述, 2=对话, 3=音效
  speaker: string;
  content: string;
  timeRange: string;
  icon: string;
}

interface SortableAudioItemProps {
  item: AudioItem;
  audioType: 'voice' | 'sound';
  configuredVoices: any[];
  onVoiceSelect?: (itemId: string, voiceId: string) => void;
  onPlayAudio?: (itemId: string) => void;
}

function SortableAudioItem({ item, audioType, configuredVoices, onVoiceSelect, onPlayAudio }: SortableAudioItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    // 防止拖动时字体变形
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    // 强制硬件加速，避免亚像素渲染问题
    willChange: isDragging ? 'transform' : 'auto',
    // 确保像素完美渲染
    backfaceVisibility: 'hidden',
    transformStyle: 'preserve-3d',
    // 防止拖动时卡片伸缩
    width: isDragging ? '100%' : 'auto',
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-gray-200 px-3 py-2 cursor-move transition-all ${
        isDragging ? 'shadow-lg z-10' : ''
      }`}
      {...attributes}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div {...listeners}>
            <Icon icon="ri:drag-move-line" className="w-4 h-4 text-gray-400 cursor-grab" />
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            item.type === 'sound' ? 'bg-blue-500' : 'bg-gray-100'
          }`}>
            <Icon
              icon={item.icon}
              className={`w-4 h-4 ${item.type === 'sound' ? 'text-white' : 'text-gray-600'}`}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium" style={{ color: item.itemType === 1 ? '#3E83F6' : '#1F2937' }}>
            {item.speaker}
          </span>
          {item.type === 'voice' && (
            <div className="relative">
              <select
                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-500"
                onChange={(e) => onVoiceSelect?.(item.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">选择音色</option>
                {configuredVoices.map((voice) => (
                  <option key={voice.voiceId} value={voice.voiceId}>
                    {voice.voiceName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex-1 text-sm" style={{ color: item.itemType === 1 ? '#3E83F6' : '#4B5563' }}>
          {item.content}
        </div>
        <div className="text-xs text-gray-400">{item.timeRange}</div>
        <div className="flex items-center space-x-2">
          <Icon
            icon="ri:play-circle-line"
            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-500"
            onClick={() => onPlayAudio?.(item.id)}
            title="播放音频"
          />
          <Icon icon="ri:time-line" className="w-4 h-4 text-gray-400" />
          <Icon icon="ri:delete-bin-line" className="w-4 h-4 text-gray-400 cursor-pointer hover:text-red-500" />
        </div>
      </div>
    </div>
  );
}

// 剧本卡片组件
interface ScriptCardProps {
  id: string;
  description: string;
  dialogues: Array<{
    character: string;
    content: string;
  }>;
  descriptionColor?: string;
  characterColor?: string;
  contentColor?: string;
  onDelete?: (id: string) => void;
}

interface SortableScriptCardProps {
  item: ScriptCardProps;
}


function SortableScriptCard({ item }: SortableScriptCardProps) {
  const { t } = useI18n();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    // 防止拖动时字体变形
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    // 强制硬件加速，避免亚像素渲染问题
    willChange: isDragging ? 'transform' : 'auto',
    // 确保像素完美渲染
    backfaceVisibility: 'hidden',
    transformStyle: 'preserve-3d',
    // 防止拖动时卡片伸缩
    width: isDragging ? '100%' : 'auto',
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex items-center space-x-4 transition-all ${
        isDragging ? 'shadow-lg z-10' : ''
      }`}
    >
      <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4">
        {/* 拖拽手柄 */}
        <div className="flex items-start space-x-3">
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing mt-1 p-1 hover:bg-gray-100 rounded"
            title={t('shortplayEntry.dragSort.title')}
          >
            <Icon icon="ri:drag-move-2-line" className="w-4 h-4 text-gray-400" />
          </div>

          <div className="flex-1">
            <div className={`text-sm mb-2 font-medium ${item.descriptionColor || 'text-blue-600'}`}>
              {t('shortplayEntry.dragSort.scriptDescription')}{item.description}
            </div>
            <div className="space-y-3">
              {item.dialogues.map((dialogue, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-start space-x-2">
                    <span className={`text-sm font-medium min-w-0 ${item.characterColor || 'text-gray-800'}`}>
                      {dialogue.character}：
                    </span>
                    <div className="flex-1">
                      <span className={`text-sm ${item.contentColor || 'text-gray-600'}`}>
                        {dialogue.content}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* 独立的删除按钮列 */}
      <div className="flex items-center">
        <Icon
          icon="ri:delete-bin-line"
          className="w-4 h-4 text-gray-400 cursor-pointer hover:text-red-500"
          onClick={() => item.onDelete?.(item.id)}
        />
      </div>
    </div>
  );
}

// 可排序的剧本项组件
interface SortableScriptItemProps {
  item: any;
  editingSceneItemId: number | null;
  editingSceneType: number;
  editingSceneContent: string;
  editingSceneRoleName: string;
  editingSceneStartMinutes: string;
  editingSceneStartSeconds: string;
  editingSceneEndMinutes: string;
  editingSceneEndSeconds: string;
  onEditingSceneTypeChange: (type: number) => void;
  onEditingSceneContentChange: (content: string) => void;
  onEditingSceneRoleNameChange: (name: string) => void;
  onEditingSceneStartMinutesChange: (minutes: string) => void;
  onEditingSceneStartSecondsChange: (seconds: string) => void;
  onEditingSceneEndMinutesChange: (minutes: string) => void;
  onEditingSceneEndSecondsChange: (seconds: string) => void;
  onEditSceneItem: (item: any) => void;
  onSaveSceneItem: () => void;
  onCancelEditSceneItem: () => void;
  onShowDeleteConfirm: (id: number) => void;
  TimeRangeInput: React.ComponentType<any>;
}

function SortableScriptItem({
  item,
  editingSceneItemId,
  editingSceneType,
  editingSceneContent,
  editingSceneRoleName,
  editingSceneStartMinutes,
  editingSceneStartSeconds,
  editingSceneEndMinutes,
  editingSceneEndSeconds,
  onEditingSceneTypeChange,
  onEditingSceneContentChange,
  onEditingSceneRoleNameChange,
  onEditingSceneStartMinutesChange,
  onEditingSceneStartSecondsChange,
  onEditingSceneEndMinutesChange,
  onEditingSceneEndSecondsChange,
  onEditSceneItem,
  onSaveSceneItem,
  onCancelEditSceneItem,
  onShowDeleteConfirm,
  TimeRangeInput,
}: SortableScriptItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    willChange: isDragging ? 'transform' : 'auto',
    backfaceVisibility: 'hidden',
    transformStyle: 'preserve-3d',
    width: isDragging ? '100%' : 'auto',
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`p-3 bg-white border border-gray-200 rounded-lg transition-all ${
        isDragging ? 'shadow-lg z-10' : ''
      }`}
    >
      {editingSceneItemId === item.id ? (
        // 编辑模式
        <div className="space-y-3">
          {/* 拖拽手柄和类型选择 */}
          <div className="flex items-center space-x-2">
            <div
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
              title="拖拽排序"
            >
              <Icon icon="ri:drag-move-2-line" className="w-4 h-4 text-gray-400" />
            </div>
            <select
              value={editingSceneType}
              onChange={(e) => onEditingSceneTypeChange(parseInt(e.target.value))}
              className="px-2 py-1 text-xs rounded border border-gray-300"
            >
              <option value={1}>画面脚本</option>
              <option value={2}>对话</option>
              <option value={3}>音效</option>
            </select>
            <TimeRangeInput
              startMinutes={editingSceneStartMinutes}
              startSeconds={editingSceneStartSeconds}
              endMinutes={editingSceneEndMinutes}
              endSeconds={editingSceneEndSeconds}
              onStartMinutesChange={onEditingSceneStartMinutesChange}
              onStartSecondsChange={onEditingSceneStartSecondsChange}
              onEndMinutesChange={onEditingSceneEndMinutesChange}
              onEndSecondsChange={onEditingSceneEndSecondsChange}
            />
          </div>

          {/* 编辑内容输入 */}
          <textarea
            value={editingSceneContent}
            onChange={(e) => onEditingSceneContentChange(e.target.value)}
            className="w-full p-2 text-sm border border-gray-300 rounded resize-none"
            rows={3}
            placeholder="输入内容..."
          />

          {/* 编辑操作按钮 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onSaveSceneItem}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              保存
            </button>
            <button
              onClick={onCancelEditSceneItem}
              className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        // 显示模式
        <div className="flex items-start space-x-3">
          {/* 拖拽手柄 */}
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing mt-1 p-1 hover:bg-gray-100 rounded"
            title="拖拽排序"
          >
            <Icon icon="ri:drag-move-2-line" className="w-4 h-4 text-gray-400" />
          </div>

          {/* 内容区域 */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded ${
                  item.type === 1
                    ? 'bg-blue-100'
                    : item.type === 2
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                }`} style={item.type === 1 ? { color: '#3E83F6' } : {}}>
                  {item.type === 1 ? '画面脚本' : item.type === 2 ? '对话' : '音效'}
                </span>
                <span className="text-sm text-gray-500">
                  {formatMillisecondsToTime(item.startTime || 0)} - {formatMillisecondsToTime(item.endTime || 0)}
                </span>
                {item.roleName && (
                  <span className="text-sm text-purple-600 font-medium">
                    {item.roleName}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Icon
                  icon="ri:edit-line"
                  className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-500"
                  onClick={() => onEditSceneItem(item)}
                />
                <Icon
                  icon="ri:delete-bin-line"
                  className="w-4 h-4 text-gray-400 cursor-pointer hover:text-red-500"
                  onClick={() => onShowDeleteConfirm(item.id)}
                />
              </div>
            </div>
            <div className="text-sm" style={{ color: item.type === 1 ? '#3E83F6' : '#1F2937' }}>
              {item.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 底部输入区域组件
interface BottomInputAreaProps {
  activeTab: string;
  selectedModel: string;
  onModelChange: (model: string) => void;
  userInput: string;
  onInputChange: (value: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  placeholder?: string;
  generationStatus?: string;
  // 音频tab特有属性
  voiceType?: string;
  onVoiceTypeChange?: (voice: string) => void;
  // 图片tab特有属性
  backgroundType?: string;
  onBackgroundTypeChange?: (bg: string) => void;
  style?: string;
  onStyleChange?: (style: string) => void;
  // 视频tab特有属性
  videoLength?: string;
  onVideoLengthChange?: (length: string) => void;
  resolution?: string;
  onResolutionChange?: (res: string) => void;
  singleGenerate?: boolean;
  onSingleGenerateChange?: (single: boolean) => void;
  onFileUpload?: (file: File) => Promise<any>;
  onMultipleFileUpload?: (files: File[]) => Promise<any>;
  isUploading?: boolean;
  uploadProgress?: { current: number; total: number };
}

function BottomInputArea({
  activeTab,
  selectedModel,
  onModelChange,
  userInput,
  onInputChange,
  isGenerating,
  onGenerate,
  placeholder,
  generationStatus,
  // 音频tab属性
  voiceType = "male",
  onVoiceTypeChange,
  // 图片tab属性
  backgroundType = "背景",
  onBackgroundTypeChange,
  style = "古风",
  onStyleChange,
  // 视频tab属性
  videoLength = "2s",
  onVideoLengthChange,
  resolution = "1080p",
  onResolutionChange,
  singleGenerate = false,
  onSingleGenerateChange,
  onFileUpload,
  onMultipleFileUpload,
  isUploading = false,
  uploadProgress = { current: 0, total: 0 }
}: BottomInputAreaProps) {
  const { t } = useI18n();

  // Use translated placeholder if not provided
  const finalPlaceholder = placeholder || t('shortplayEntry.input.placeholder');

  return (
    <div className="border-t border-gray-100 p-4">
      {activeTab === 'script' && (
        <>
          <div className="mb-3">
            <div className="relative w-40">
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
              >
                <option value="gemini-2.5pro">Gemini2.5pro</option>
                <option value="deepseek-r1">DeepSeek-R1</option>
                <option value="gpt-4">GPT-4</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* 生成状态显示 */}
          {isGenerating && generationStatus && (
            <div className="mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-blue-700">{generationStatus}</span>
              </div>
            </div>
          )}

          <div className="relative">
            <textarea
              value={userInput}
              onChange={(e) => onInputChange(e.target.value)}
              className="w-full h-12 py-2 pl-4 pr-24 text-xs rounded-lg bg-white focus:outline-none resize-none overflow-y-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', border: '1px solid rgba(116, 116, 116, 0.41)' }}
              placeholder={finalPlaceholder}
              disabled={isGenerating}
            />
            <button
              onClick={onGenerate}
              disabled={isGenerating || !userInput.trim()}
              className={`absolute bottom-2 right-2 px-3 py-1 text-white text-xs font-medium rounded transition-colors flex items-center space-x-1 ${
                isGenerating || !userInput.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isGenerating && (
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{isGenerating ? t('shortplayEntry.generation.generating') : t('shortplayEntry.generation.oneClickGenerate')}</span>
            </button>
          </div>
        </>
      )}

      {activeTab === 'audio' && (
        <>
          <div className="mb-3">
            <div className="flex space-x-3">
              <div className="relative w-32">
                <select
                  value={selectedModel}
                  onChange={(e) => onModelChange(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
                >
                  <option value="gemini-2.5pro">Gemini2.5pro</option>
                  <option value="deepseek-r1">DeepSeek-R1</option>
                  <option value="gpt-4">GPT-4</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="relative w-20">
                <select
                  value={voiceType}
                  onChange={(e) => onVoiceTypeChange?.(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
                >
                  <option value="male">{t('shortplayEntry.audio.male')}</option>
                  <option value="female">{t('shortplayEntry.audio.female')}</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={userInput}
              onChange={(e) => onInputChange(e.target.value)}
              className="w-full h-12 py-2 pl-4 pr-24 text-xs rounded-lg bg-white focus:outline-none resize-none overflow-y-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', border: '1px solid rgba(116, 116, 116, 0.41)' }}
              placeholder={finalPlaceholder}
              disabled={isGenerating}
            />
            <button
              onClick={onGenerate}
              disabled={isGenerating || !userInput.trim()}
              className={`absolute bottom-2 right-2 px-3 py-1 text-white text-xs font-medium rounded transition-colors ${
                isGenerating || !userInput.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isGenerating ? t('shortplayEntry.generation.generating') : '一键生成'}
            </button>
          </div>
        </>
      )}

      {activeTab === 'image' && (
        <>
          <div className="mb-3">
            <div className="flex space-x-3">
              <div className="relative w-32">
                <select
                  value={selectedModel}
                  onChange={(e) => onModelChange(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
                >
                  <option value="gemini-2.5pro">Gemini2.5pro</option>
                  <option value="deepseek-r1">DeepSeek-R1</option>
                  <option value="gpt-4">GPT-4</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="relative w-20">
                <select
                  value={backgroundType}
                  onChange={(e) => onBackgroundTypeChange?.(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
                >
                  <option value="背景">{t('shortplayEntry.image.background')}</option>
                  <option value="人物">{t('shortplayEntry.image.character')}</option>
                  <option value="物体">{t('shortplayEntry.image.object')}</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="relative w-20">
                <select
                  value={style}
                  onChange={(e) => onStyleChange?.(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
                >
                  <option value="古风">{t('shortplayEntry.image.ancient')}</option>
                  <option value="现代">{t('shortplayEntry.image.modern')}</option>
                  <option value="科幻">{t('shortplayEntry.image.scifi')}</option>
                  <option value="卡通">{t('shortplayEntry.image.cartoon')}</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={userInput}
              onChange={(e) => onInputChange(e.target.value)}
              className="w-full h-12 py-2 pl-4 pr-24 text-xs rounded-lg bg-white focus:outline-none resize-none overflow-y-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', border: '1px solid rgba(116, 116, 116, 0.41)' }}
              placeholder={finalPlaceholder}
              disabled={isGenerating}
            />
            <button
              onClick={onGenerate}
              disabled={isGenerating || !userInput.trim()}
              className={`absolute bottom-2 right-2 px-3 py-1 text-white text-xs font-medium rounded transition-colors ${
                isGenerating || !userInput.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isGenerating ? t('shortplayEntry.generation.generating') : t('shortplayEntry.generation.oneClickGenerate')}
            </button>
          </div>
        </>
      )}

      {activeTab === 'video' && (
        <>
          <div className="mb-3">
            <div className="flex space-x-2">
              <div className="relative w-32">
                <select
                  value={selectedModel}
                  onChange={(e) => onModelChange(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
                >
                  <option value="gemini-2.5pro">Gemini2.5pro</option>
                  <option value="deepseek-r1">DeepSeek-R1</option>
                  <option value="gpt-4">GPT-4</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="relative w-24">
                <select
                  value={videoLength}
                  onChange={(e) => onVideoLengthChange?.(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
                >
                  <option value="2s">{t('shortplayEntry.video.duration2s')}</option>
                  <option value="5s">{t('shortplayEntry.video.duration5s')}</option>
                  <option value="10s">{t('shortplayEntry.video.duration10s')}</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="relative w-24">
                <select
                  value={resolution}
                  onChange={(e) => onResolutionChange?.(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
                >
                  <option value="1080p">{t('shortplayEntry.video.resolution1080p')}</option>
                  <option value="720p">{t('shortplayEntry.video.resolution720p')}</option>
                  <option value="4K">{t('shortplayEntry.video.resolution4k')}</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="relative w-24">
                <select
                  value={singleGenerate ? "single" : "batch"}
                  onChange={(e) => onSingleGenerateChange?.(e.target.value === "single")}
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
                >
                  <option value="batch">{t('shortplayEntry.video.batchMode')}</option>
                  <option value="single">{t('shortplayEntry.video.singleMode')}</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={userInput}
              onChange={(e) => onInputChange(e.target.value)}
              className="w-full h-12 py-2 pl-12 pr-24 text-xs rounded-lg bg-white focus:outline-none resize-none overflow-y-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', border: '1px solid rgba(116, 116, 116, 0.41)' }}
              placeholder={finalPlaceholder}
              disabled={isGenerating}
            />
            <label className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 ${
              activeTab === 'video' ? '' : 'hidden'
            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`} title={isUploading && uploadProgress.total > 0 ? `上传进度: ${uploadProgress.current}/${uploadProgress.total}` : '上传图片'}>
              {isUploading ? (
                <div className="relative w-4 h-4">
                  <Icon icon="ri:loader-4-line" className="w-4 h-4 text-gray-400 animate-spin" />
                  {uploadProgress.total > 1 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center" style={{ fontSize: '6px' }}>
                      {uploadProgress.current}
                    </div>
                  )}
                </div>
              ) : (
                <Icon icon="ri:image-line" className="w-4 h-4 text-gray-400" />
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={isUploading}
                onChange={async (e) => {
                  console.log('文件选择事件触发');
                  const files = Array.from(e.target.files || []);
                  console.log('选择的文件:', files);
                  console.log('当前上传状态:', isUploading);
                  console.log('onMultipleFileUpload 函数:', onMultipleFileUpload);

                  if (files.length > 0 && !isUploading) {
                    console.log('开始上传文件:', files.map(f => f.name));

                    // 使用批量上传处理
                    if (onMultipleFileUpload) {
                      console.log('调用批量上传函数');
                      await onMultipleFileUpload(files);
                    } else {
                      console.log('批量上传函数不存在');
                    }

                    // 重置input的value，允许重复选择相同文件
                    e.target.value = '';
                  } else {
                    console.log('跳过上传，原因:', {
                      filesLength: files.length,
                      isUploading
                    });
                  }
                }}
              />
            </label>
            <button
              onClick={onGenerate}
              disabled={isGenerating || !userInput.trim()}
              className={`absolute bottom-2 right-2 px-3 py-1 text-white text-xs font-medium rounded transition-colors ${
                isGenerating || !userInput.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isGenerating ? t('shortplayEntry.generation.generating') : t('shortplayEntry.generation.oneClickGenerate')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// 可排序的图片项组件
interface SortableImageItemProps {
  item: ImageItem;
  index: number;
  editingTimeId: string | null;
  editingStartMinutes: string;
  editingStartSeconds: string;
  editingEndMinutes: string;
  editingEndSeconds: string;
  onEditingStartMinutesChange: (value: string) => void;
  onEditingStartSecondsChange: (value: string) => void;
  onEditingEndMinutesChange: (value: string) => void;
  onEditingEndSecondsChange: (value: string) => void;
  onStartEditTime: (itemId: string, timeRange: string) => void;
  onSaveTimeEdit: (itemId: string) => void;
  onCancelTimeEdit: () => void;
  parseTimeRange: (timeRange: string) => { startMinutes: string; startSeconds: string; endMinutes: string; endSeconds: string; };
}

function SortableImageItem({
  item,
  index,
  editingTimeId,
  editingStartMinutes,
  editingStartSeconds,
  editingEndMinutes,
  editingEndSeconds,
  onEditingStartMinutesChange,
  onEditingStartSecondsChange,
  onEditingEndMinutesChange,
  onEditingEndSecondsChange,
  onStartEditTime,
  onSaveTimeEdit,
  onCancelTimeEdit,
  parseTimeRange,
}: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ImageItemComponent
        item={item}
        index={index}
        editingTimeId={editingTimeId}
        editingStartMinutes={editingStartMinutes}
        editingStartSeconds={editingStartSeconds}
        editingEndMinutes={editingEndMinutes}
        editingEndSeconds={editingEndSeconds}
        onEditingStartMinutesChange={onEditingStartMinutesChange}
        onEditingStartSecondsChange={onEditingStartSecondsChange}
        onEditingEndMinutesChange={onEditingEndMinutesChange}
        onEditingEndSecondsChange={onEditingEndSecondsChange}
        onStartEditTime={onStartEditTime}
        onSaveTimeEdit={onSaveTimeEdit}
        onCancelTimeEdit={onCancelTimeEdit}
        parseTimeRange={parseTimeRange}
        dragListeners={listeners}
      />
    </div>
  );
}

// 图片项组件
interface ImageItem {
  id: string;
  description: string;
  parameters: string;
  timeRange: string;
}

interface ImageItemProps {
  item: ImageItem;
  index: number;
  editingTimeId: string | null;
  editingStartMinutes: string;
  editingStartSeconds: string;
  editingEndMinutes: string;
  editingEndSeconds: string;
  onEditingStartMinutesChange: (value: string) => void;
  onEditingStartSecondsChange: (value: string) => void;
  onEditingEndMinutesChange: (value: string) => void;
  onEditingEndSecondsChange: (value: string) => void;
  onStartEditTime: (itemId: string, timeRange: string) => void;
  onSaveTimeEdit: (itemId: string) => void;
  onCancelTimeEdit: () => void;
  parseTimeRange: (timeRange: string) => { startMinutes: string; startSeconds: string; endMinutes: string; endSeconds: string; };
  dragListeners?: any;
}

function ImageItemComponent({
  item,
  index,
  editingTimeId,
  editingStartMinutes,
  editingStartSeconds,
  editingEndMinutes,
  editingEndSeconds,
  onEditingStartMinutesChange,
  onEditingStartSecondsChange,
  onEditingEndMinutesChange,
  onEditingEndSecondsChange,
  onStartEditTime,
  onSaveTimeEdit,
  onCancelTimeEdit,
  parseTimeRange,
  dragListeners,
}: ImageItemProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-stretch space-x-3 min-h-[100px]">
      {/* 序号和操作按钮列 */}
      <div className="flex flex-col justify-between items-center h-full min-w-[20px]">
        <div className="text-lg font-medium text-blue-600">
          {index + 1}
        </div>
        <div className="flex flex-col items-center space-y-1">
          {dragListeners && (
            <button className="p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing" {...dragListeners}>
              <Icon icon="ri:drag-move-2-line" className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button className="p-1 hover:bg-gray-100 rounded">
            <Icon icon="ri:add-circle-line" className="w-4 h-4 text-gray-400" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <Icon icon="ri:delete-bin-line" className="w-4 h-4 text-gray-400 hover:text-red-500" />
          </button>
        </div>
      </div>

      {/* 图片缩略图 */}
      <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200"></div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 min-w-0 flex space-x-4">
        {/* 左侧：描述 */}
        <div className="flex-1 text-sm text-gray-800 leading-relaxed">
          {item.description}
        </div>
        {/* 右侧：参数和时间 */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="text-xs text-gray-500 leading-relaxed">
            {item.parameters}
          </div>
          <div className="flex items-center space-x-2">
            {editingTimeId === item.id ? (
              <div className="flex items-center space-x-1">
                <TimeRangeInput
                  startMinutes={editingStartMinutes}
                  startSeconds={editingStartSeconds}
                  endMinutes={editingEndMinutes}
                  endSeconds={editingEndSeconds}
                  onStartMinutesChange={onEditingStartMinutesChange}
                  onStartSecondsChange={onEditingStartSecondsChange}
                  onEndMinutesChange={onEditingEndMinutesChange}
                  onEndSecondsChange={onEditingEndSecondsChange}
                />
                {/* 统一的保存和取消按钮 */}
                <button
                  onClick={() => onSaveTimeEdit(item.id)}
                  className="text-green-600 hover:text-green-800 ml-1 p-0 border-0 bg-transparent outline-none cursor-pointer"
                >
                  <Icon icon="ri:check-line" className="w-3 h-3" />
                </button>
                <button
                  onClick={onCancelTimeEdit}
                  className="text-red-600 hover:text-red-800 p-0 border-0 bg-transparent outline-none cursor-pointer"
                >
                  <Icon icon="ri:close-line" className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                {(() => {
                  const timeData = parseTimeRange(item.timeRange);
                  return (
                    <>
                      <span>{timeData.startMinutes}:{timeData.startSeconds}</span>
                      <span>-</span>
                      <span>{timeData.endMinutes}:{timeData.endSeconds}</span>
                      <button
                        onClick={() => onStartEditTime(item.id, item.timeRange)}
                        className="text-gray-400 hover:text-blue-600 ml-1 p-0 border-0 bg-transparent outline-none cursor-pointer"
                      >
                        <Icon icon="ri:edit-line" className="w-3 h-3" />
                      </button>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 视频项组件
interface VideoItem {
  id: string;
  description: string;
  parameters: string;
  timeRange: string;
}

interface VideoItemProps {
  item: VideoItem;
  index: number;
  editingTimeId: string | null;
  editingStartMinutes: string;
  editingStartSeconds: string;
  editingEndMinutes: string;
  editingEndSeconds: string;
  onEditingStartMinutesChange: (value: string) => void;
  onEditingStartSecondsChange: (value: string) => void;
  onEditingEndMinutesChange: (value: string) => void;
  onEditingEndSecondsChange: (value: string) => void;
  onStartEditTime: (itemId: string, timeRange: string) => void;
  onSaveTimeEdit: (itemId: string) => void;
  onCancelTimeEdit: () => void;
  parseTimeRange: (timeRange: string) => { startMinutes: string; startSeconds: string; endMinutes: string; endSeconds: string; };
  dragListeners?: any;
}

function VideoItemComponent({
  item,
  index,
  editingTimeId,
  editingStartMinutes,
  editingStartSeconds,
  editingEndMinutes,
  editingEndSeconds,
  onEditingStartMinutesChange,
  onEditingStartSecondsChange,
  onEditingEndMinutesChange,
  onEditingEndSecondsChange,
  onStartEditTime,
  onSaveTimeEdit,
  onCancelTimeEdit,
  parseTimeRange,
  dragListeners,
}: VideoItemProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-stretch space-x-3 min-h-[100px]">
      {/* 序号和操作按钮列 */}
      <div className="flex flex-col justify-between items-center h-full min-w-[20px]">
        <div className="text-lg font-medium text-blue-600">
          {index + 1}
        </div>
        <div className="flex flex-col items-center space-y-1">
          {dragListeners && (
            <button className="p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing" {...dragListeners}>
              <Icon icon="ri:drag-move-2-line" className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button className="p-1 hover:bg-gray-100 rounded">
            <Icon icon="ri:add-circle-line" className="w-4 h-4 text-gray-400" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <Icon icon="ri:delete-bin-line" className="w-4 h-4 text-gray-400 hover:text-red-500" />
          </button>
        </div>
      </div>

      {/* 视频缩略图 */}
      <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200"></div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 min-w-0 flex space-x-4">
        {/* 左侧：描述 */}
        <div className="flex-1 text-sm text-gray-800 leading-relaxed">
          {item.description}
        </div>
        {/* 右侧：参数和时间 */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="text-xs text-gray-500 leading-relaxed">
            {item.parameters}
          </div>
          <div className="flex items-center space-x-2">
            {editingTimeId === item.id ? (
              <div className="flex items-center space-x-1">
                <TimeRangeInput
                  startMinutes={editingStartMinutes}
                  startSeconds={editingStartSeconds}
                  endMinutes={editingEndMinutes}
                  endSeconds={editingEndSeconds}
                  onStartMinutesChange={onEditingStartMinutesChange}
                  onStartSecondsChange={onEditingStartSecondsChange}
                  onEndMinutesChange={onEditingEndMinutesChange}
                  onEndSecondsChange={onEditingEndSecondsChange}
                />
                {/* 统一的保存和取消按钮 */}
                <button
                  onClick={() => onSaveTimeEdit(item.id)}
                  className="text-green-600 hover:text-green-800 ml-1"
                >
                  <Icon icon="ri:check-line" className="w-3 h-3" />
                </button>
                <button
                  onClick={onCancelTimeEdit}
                  className="text-red-600 hover:text-red-800 p-0 border-0 bg-transparent outline-none cursor-pointer"
                >
                  <Icon icon="ri:close-line" className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                {(() => {
                  const timeData = parseTimeRange(item.timeRange);
                  return (
                    <>
                      <span>{timeData.startMinutes}:{timeData.startSeconds}</span>
                      <span>-</span>
                      <span>{timeData.endMinutes}:{timeData.endSeconds}</span>
                      <button
                        onClick={() => onStartEditTime(item.id, item.timeRange)}
                        className="text-gray-400 hover:text-blue-600 ml-1 p-0 border-0 bg-transparent outline-none cursor-pointer"
                      >
                        <Icon icon="ri:edit-line" className="w-3 h-3" />
                      </button>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 可排序的分镜板项组件
interface SortableStoryboardItemProps {
  item: any;
  index: number;
  editingTimeId: string | null;
  editingStartMinutes: string;
  editingStartSeconds: string;
  editingEndMinutes: string;
  editingEndSeconds: string;
  onEditingStartMinutesChange: (value: string) => void;
  onEditingStartSecondsChange: (value: string) => void;
  onEditingEndMinutesChange: (value: string) => void;
  onEditingEndSecondsChange: (value: string) => void;
  onStartEditTime: (itemId: string, timeRange: string) => void;
  onSaveTimeEdit: (itemId: string) => void;
  onCancelTimeEdit: () => void;
  onDeleteItem: (itemId: string) => void;
  TimeRangeInput: React.ComponentType<any>;
}

function SortableStoryboardItem({
  item,
  index,
  editingTimeId,
  editingStartMinutes,
  editingStartSeconds,
  editingEndMinutes,
  editingEndSeconds,
  onEditingStartMinutesChange,
  onEditingStartSecondsChange,
  onEditingEndMinutesChange,
  onEditingEndSecondsChange,
  onStartEditTime,
  onSaveTimeEdit,
  onCancelTimeEdit,
  onDeleteItem,
  TimeRangeInput,
}: SortableStoryboardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    willChange: isDragging ? 'transform' : 'auto',
    backfaceVisibility: 'hidden',
    transformStyle: 'preserve-3d',
    width: isDragging ? '100%' : 'auto',
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-white rounded-lg border border-gray-200 p-3 flex items-stretch space-x-3 min-h-[100px] transition-all ${
        isDragging ? 'shadow-lg z-10' : ''
      }`}
    >
      {/* 序号和操作按钮列 */}
      <div className="flex flex-col justify-between items-center h-full min-w-[20px]">
        <div className="text-lg font-medium text-blue-600">
          {index + 1}
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
            title="拖拽排序"
          >
            <Icon icon="ri:drag-move-2-line" className="w-4 h-4 text-gray-400" />
          </div>
          <button className="p-1 hover:bg-gray-100 rounded">
            <Icon icon="ri:add-circle-line" className="w-4 h-4 text-gray-400" />
          </button>
          <button
            className="p-1 hover:bg-gray-100 rounded"
            onClick={() => {
              onDeleteItem(item.id.toString());
            }}
          >
            <Icon icon="ri:delete-bin-line" className="w-4 h-4 text-gray-400 hover:text-red-500" />
          </button>
        </div>
      </div>

      {/* 图片/视频缩略图 */}
      <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
        {item.fileUrl ? (
          // 判断是否为视频文件 (.mp4, .webm, .mov, .avi)
          /\.(mp4|webm|mov|avi)$/i.test(item.fileUrl) || /\.(mp4|webm|mov|avi)$/i.test(item.fileName || '') ? (
            <video
              src={item.fileUrl}
              className="w-full h-full object-cover cursor-pointer"
              controls
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <img
              src={item.fileUrl}
              alt={item.fileName || '分镜图片'}
              className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              onClick={() => {
                window.open(item.fileUrl, '_blank');
              }}
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 flex items-center justify-center">
            <Icon icon="ri:image-line" className="w-8 h-8 text-white" />
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 min-w-0 flex space-x-4">
        {/* 左侧：描述 */}
        <div className="flex-1 text-sm text-gray-800 leading-relaxed">
          分镜板 #{index + 1}
          {item.description && (
            <div className="text-xs text-gray-600 mt-1">{item.description}</div>
          )}
        </div>
        {/* 右侧：参数和时间 */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="text-xs text-gray-500 leading-relaxed">
            文件ID: {item.fileId}
            {item.fileName && (
              <div>文件名: {item.fileName}</div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {editingTimeId === item.id ? (
              <div className="flex items-center space-x-1">
                <TimeRangeInput
                  startMinutes={editingStartMinutes}
                  startSeconds={editingStartSeconds}
                  endMinutes={editingEndMinutes}
                  endSeconds={editingEndSeconds}
                  onStartMinutesChange={onEditingStartMinutesChange}
                  onStartSecondsChange={onEditingStartSecondsChange}
                  onEndMinutesChange={onEditingEndMinutesChange}
                  onEndSecondsChange={onEditingEndSecondsChange}
                />
                <button
                  onClick={() => onSaveTimeEdit(item.id)}
                  className="text-green-600 hover:text-green-800 ml-1 p-0 border-0 bg-transparent outline-none cursor-pointer"
                >
                  <Icon icon="ri:check-line" className="w-3 h-3" />
                </button>
                <button
                  onClick={onCancelTimeEdit}
                  className="text-red-600 hover:text-red-800 p-0 border-0 bg-transparent outline-none cursor-pointer"
                >
                  <Icon icon="ri:close-line" className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <span>{formatMillisecondsToTime(item.startTime || 0)}</span>
                <span>-</span>
                <span>{formatMillisecondsToTime(item.endTime || 0)}</span>
                <button
                  onClick={() => {
                    const startTime = formatMillisecondsToTime(item.startTime || 0);
                    const endTime = formatMillisecondsToTime(item.endTime || 0);
                    onStartEditTime(item.id, `${startTime}-${endTime}`);
                  }}
                  className="text-gray-400 hover:text-blue-600 ml-1 p-0 border-0 bg-transparent outline-none cursor-pointer"
                >
                  <Icon icon="ri:edit-line" className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 通用分镜板列表组件
interface StoryboardListProps {
  storyboardItems: any[];
  isLoadingStoryboard: boolean;
  editingTimeId: string | null;
  editingStartMinutes: string;
  editingStartSeconds: string;
  editingEndMinutes: string;
  editingEndSeconds: string;
  sensors: any;
  onEditingStartMinutesChange: (value: string) => void;
  onEditingStartSecondsChange: (value: string) => void;
  onEditingEndMinutesChange: (value: string) => void;
  onEditingEndSecondsChange: (value: string) => void;
  onStartEditTime: (itemId: string, timeRange: string) => void;
  onSaveTimeEdit: (itemId: string) => void;
  onCancelTimeEdit: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDeleteItem: (itemId: string) => void;
  TimeRangeInput: React.ComponentType<any>;
}

function StoryboardList({
  storyboardItems,
  isLoadingStoryboard,
  editingTimeId,
  editingStartMinutes,
  editingStartSeconds,
  editingEndMinutes,
  editingEndSeconds,
  sensors,
  onEditingStartMinutesChange,
  onEditingStartSecondsChange,
  onEditingEndMinutesChange,
  onEditingEndSecondsChange,
  onStartEditTime,
  onSaveTimeEdit,
  onCancelTimeEdit,
  onDragEnd,
  onDeleteItem,
  TimeRangeInput,
}: StoryboardListProps) {
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={storyboardItems.map(item => item.id.toString())}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {isLoadingStoryboard ? (
            <div className="flex items-center justify-center p-4 text-gray-500">
              <Icon icon="ri:loader-4-line" className="w-4 h-4 animate-spin mr-2" />
              加载中...
            </div>
          ) : storyboardItems.length > 0 ? (
            storyboardItems.map((item, index) => (
              <SortableStoryboardItem
                key={item.id}
                item={item}
                index={index}
                editingTimeId={editingTimeId}
                editingStartMinutes={editingStartMinutes}
                editingStartSeconds={editingStartSeconds}
                editingEndMinutes={editingEndMinutes}
                editingEndSeconds={editingEndSeconds}
                onEditingStartMinutesChange={onEditingStartMinutesChange}
                onEditingStartSecondsChange={onEditingStartSecondsChange}
                onEditingEndMinutesChange={onEditingEndMinutesChange}
                onEditingEndSecondsChange={onEditingEndSecondsChange}
                onStartEditTime={onStartEditTime}
                onSaveTimeEdit={onSaveTimeEdit}
                onCancelTimeEdit={onCancelTimeEdit}
                onDeleteItem={onDeleteItem}
                TimeRangeInput={TimeRangeInput}
              />
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              暂无分镜板数据
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// 可排序的视频项组件
interface SortableVideoItemProps {
  item: VideoItem;
  index: number;
  editingTimeId: string | null;
  editingStartMinutes: string;
  editingStartSeconds: string;
  editingEndMinutes: string;
  editingEndSeconds: string;
  onEditingStartMinutesChange: (value: string) => void;
  onEditingStartSecondsChange: (value: string) => void;
  onEditingEndMinutesChange: (value: string) => void;
  onEditingEndSecondsChange: (value: string) => void;
  onStartEditTime: (itemId: string, timeRange: string) => void;
  onSaveTimeEdit: (itemId: string) => void;
  onCancelTimeEdit: () => void;
  parseTimeRange: (timeRange: string) => { startMinutes: string; startSeconds: string; endMinutes: string; endSeconds: string; };
}

function SortableVideoItem({
  item,
  index,
  editingTimeId,
  editingStartMinutes,
  editingStartSeconds,
  editingEndMinutes,
  editingEndSeconds,
  onEditingStartMinutesChange,
  onEditingStartSecondsChange,
  onEditingEndMinutesChange,
  onEditingEndSecondsChange,
  onStartEditTime,
  onSaveTimeEdit,
  onCancelTimeEdit,
  parseTimeRange,
}: SortableVideoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <VideoItemComponent
        item={item}
        index={index}
        editingTimeId={editingTimeId}
        editingStartMinutes={editingStartMinutes}
        editingStartSeconds={editingStartSeconds}
        editingEndMinutes={editingEndMinutes}
        editingEndSeconds={editingEndSeconds}
        onEditingStartMinutesChange={onEditingStartMinutesChange}
        onEditingStartSecondsChange={onEditingStartSecondsChange}
        onEditingEndMinutesChange={onEditingEndMinutesChange}
        onEditingEndSecondsChange={onEditingEndSecondsChange}
        onStartEditTime={onStartEditTime}
        onSaveTimeEdit={onSaveTimeEdit}
        onCancelTimeEdit={onCancelTimeEdit}
        parseTimeRange={parseTimeRange}
        dragListeners={listeners}
      />
    </div>
  );
}

// 通用标题栏组件
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  subtitleOptions?: string[];
  onSubtitleChange?: (value: string) => void;
  onSubtitleEdit?: (value: string) => Promise<boolean>; // 新增：专门处理编辑的回调
  onOptionsChange?: (options: string[]) => void;
  onAddClick?: () => void;
}

function SectionHeader({ title, subtitle, subtitleOptions, onSubtitleChange, onSubtitleEdit, onOptionsChange, onAddClick }: SectionHeaderProps) {
  const { t } = useI18n();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState('');
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [editingOptionValue, setEditingOptionValue] = useState('');

  // 处理单击文本开始编辑
  const handleTextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingValue(subtitle || '');
    setIsDropdownOpen(false);
  };

  // 处理点击箭头显示下拉框
  const handleArrowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
    setIsEditing(false);
  };

  // 处理编辑完成
  const handleEditComplete = async () => {
    if (editingValue.trim() && editingValue !== subtitle) {
      // 如果有专门的编辑回调，优先使用它
      if (onSubtitleEdit) {
        const success = await onSubtitleEdit(editingValue.trim());
        if (!success) {
          // 编辑失败，恢复原值
          setEditingValue(subtitle || '');
          return;
        }
      } else {
        // 否则使用通用的变更回调
        onSubtitleChange?.(editingValue.trim());
      }
    }
    setIsEditing(false);
    setEditingValue('');
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditComplete();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingValue('');
    }
  };

  // 处理下拉选项编辑
  const handleOptionDoubleClick = (index: number, option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingOptionIndex(index);
    setEditingOptionValue(option);
  };

  // 处理下拉选项编辑完成
  const handleOptionEditComplete = () => {
    if (editingOptionIndex !== null && subtitleOptions && onOptionsChange) {
      const newOptions = [...subtitleOptions];
      if (editingOptionValue.trim()) {
        newOptions[editingOptionIndex] = editingOptionValue.trim();
        onOptionsChange(newOptions);
      }
    }
    setEditingOptionIndex(null);
    setEditingOptionValue('');
  };

  // 处理下拉选项键盘事件
  const handleOptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleOptionEditComplete();
    } else if (e.key === 'Escape') {
      setEditingOptionIndex(null);
      setEditingOptionValue('');
    }
  };

  return (
    <div className="p-4 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg width="40" height="36" viewBox="0 0 56 51" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* 边框 */}
            <rect width="56" height="51" rx="10" fill="#3E83F6"/>
            {/* Logo内容 - 星星 */}
            <g transform="translate(28, 25.5) scale(0.7, 0.7) translate(-19, -19)">
              <path d="M34.8333 15.3109C34.7333 15.0213 34.5515 14.767 34.3098 14.5787C34.0681 14.3904 33.7769 14.2762 33.4717 14.2501L24.4625 12.9359L20.425 4.75011C20.2954 4.48241 20.0929 4.25665 19.8409 4.09868C19.5889 3.94072 19.2974 3.85693 19 3.85693C18.7026 3.85693 18.4111 3.94072 18.1591 4.09868C17.9071 4.25665 17.7047 4.48241 17.575 4.75011L13.5375 12.9201L4.52834 14.2501C4.2353 14.2918 3.9598 14.4147 3.73311 14.605C3.50642 14.7953 3.33761 15.0454 3.24584 15.3268C3.16183 15.6018 3.1543 15.8944 3.22403 16.1734C3.29377 16.4523 3.43815 16.707 3.64167 16.9101L10.1808 23.2434L8.59751 32.2368C8.54098 32.5336 8.57058 32.8404 8.6828 33.121C8.79503 33.4015 8.98519 33.6441 9.23084 33.8201C9.47027 33.9913 9.75266 34.0923 10.0463 34.1119C10.34 34.1315 10.6333 34.0688 10.8933 33.9309L19 29.7034L27.075 33.9468C27.2972 34.0721 27.5482 34.1376 27.8033 34.1368C28.1387 34.138 28.4658 34.0326 28.7375 33.8359C28.9832 33.66 29.1733 33.4174 29.2855 33.1368C29.3978 32.8563 29.4274 32.5494 29.3708 32.2526L27.7875 23.2593L34.3267 16.9259C34.5553 16.7323 34.7242 16.4777 34.8139 16.1918C34.9036 15.9059 34.9103 15.6005 34.8333 15.3109ZM25.0958 21.6443C24.9102 21.8239 24.7712 22.0462 24.6912 22.2918C24.6112 22.5374 24.5924 22.7989 24.6367 23.0534L25.7767 29.6876L19.8233 26.5209C19.5943 26.399 19.3387 26.3352 19.0792 26.3352C18.8196 26.3352 18.5641 26.399 18.335 26.5209L12.3817 29.6876L13.5217 23.0534C13.5659 22.7989 13.5472 22.5374 13.4671 22.2918C13.3871 22.0462 13.2482 21.8239 13.0625 21.6443L8.31251 16.8943L14.9783 15.9284C15.2348 15.8928 15.4787 15.7947 15.6885 15.6429C15.8983 15.4911 16.0676 15.2901 16.1817 15.0576L19 9.02511L21.9767 15.0734C22.0907 15.3059 22.2601 15.5069 22.4699 15.6587C22.6797 15.8105 22.9235 15.9086 23.18 15.9443L29.8458 16.9101L25.0958 21.6443Z" fill="white"/>
            </g>
          </svg>
          <span className="text-base font-medium text-gray-900">{title}</span>
          {subtitle && (
            <div className="relative">
              {isEditing ? (
                // 编辑模式
                <input
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={handleEditComplete}
                  onKeyDown={handleKeyDown}
                  className="text-sm text-gray-600 bg-white border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  style={{ minWidth: '200px' }}
                />
              ) : (
                // 显示模式
                <div className="flex items-center space-x-1 text-sm text-gray-600 select-none">
                  <span
                    className="cursor-pointer hover:text-gray-800 transition-colors"
                    onClick={handleTextClick}
                    title={t('shortplayEntry.scenes.editSceneName')}
                  >
                    {subtitle}
                  </span>
                  <Icon
                    icon="ri:arrow-down-s-line"
                    className={`w-4 h-4 cursor-pointer hover:text-blue-500 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    onClick={handleArrowClick}
                    title={t('shortplayEntry.scenes.selectPresetScene')}
                  />
                </div>
              )}

              {/* 下拉选择器 */}
              {isDropdownOpen && subtitleOptions && !isEditing && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                  {subtitleOptions.map((option, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg"
                      onClick={() => {
                        if (editingOptionIndex !== index) {
                          onSubtitleChange?.(option);
                          setIsDropdownOpen(false);
                        }
                      }}
                      onDoubleClick={(e) => handleOptionDoubleClick(index, option, e)}
                      title={t('shortplayEntry.scenes.clickToSelectDoubleClickToEdit')}
                    >
                      {editingOptionIndex === index ? (
                        <input
                          type="text"
                          value={editingOptionValue}
                          onChange={(e) => setEditingOptionValue(e.target.value)}
                          onBlur={handleOptionEditComplete}
                          onKeyDown={handleOptionKeyDown}
                          className="w-full bg-transparent border-none outline-none text-sm text-gray-700"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        option
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {onAddClick && (
          <Icon icon="ri:add-circle-line" className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" onClick={onAddClick} />
        )}
      </div>

      {/* 点击其他地方关闭下拉框和编辑框 */}
      {(isDropdownOpen || isEditing || editingOptionIndex !== null) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsDropdownOpen(false);
            if (isEditing) {
              handleEditComplete();
            }
            if (editingOptionIndex !== null) {
              handleOptionEditComplete();
            }
          }}
        />
      )}
    </div>
  );
}

function ShortplayEntryPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<string>('script');
  const [selectedModel, setSelectedModel] = useState<string>('deepseek-r1');
  const [progress, setProgress] = useState<number>(75); // 进度百分比
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasVideo, setHasVideo] = useState<boolean>(true); // 默认有视频
  const [userInput, setUserInput] = useState<string>(''); // 用户输入内容
  const [isGenerating, setIsGenerating] = useState<boolean>(false); // 生成状态
  const [generatedContent, setGeneratedContent] = useState<string>(''); // 生成的内容
  const [generationStatus, setGenerationStatus] = useState<string>(''); // 生成状态文本
  const [isGeneratingPreview, setIsGeneratingPreview] = useState<boolean>(false); // 预览生成状态

  // 底部输入区域的额外状态
  const [voiceType, setVoiceType] = useState<string>('male');
  const [backgroundType, setBackgroundType] = useState<string>(t('shortplayEntry.image.background'));
  const [style, setStyle] = useState<string>(t('shortplayEntry.image.ancient'));
  const [videoLength, setVideoLength] = useState<string>('2s');
  const [resolution, setResolution] = useState<string>('1080p');
  const [singleGenerate, setSingleGenerate] = useState<boolean>(false);

  // 场次管理状态
  const [selectedScene, setSelectedScene] = useState<string>('');
  const [sceneOptions, setSceneOptions] = useState<string[]>([]);
  const [scenesData, setScenesData] = useState<any[]>([]); // 存储完整的场次数据
  const [sceneContent, setSceneContent] = useState<any[]>([]); // 存储当前场次的内容数据

  // 剧本卡片数据状态
  const [scriptCards, setScriptCards] = useState<ScriptCardProps[]>([]);

  // 音色数据状态
  const [configuredVoices, setConfiguredVoices] = useState<any[]>([]);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [isConfiguredVoicesExpanded, setIsConfiguredVoicesExpanded] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [editingVoiceId, setEditingVoiceId] = useState<string | null>(null);
  const [editingVoiceName, setEditingVoiceName] = useState<string>('');

  // 音频类型选择状态（音色/音效）
  const [audioType, setAudioType] = useState<'voice' | 'sound'>('voice');

  // 音频内容数据状态
  const [audioContent, setAudioContent] = useState<any[]>([]); // 存储音频tab的内容数据
  const [isLoadingAudioContent, setIsLoadingAudioContent] = useState(false);

  // 音效数据状态
  const [bgmList, setBgmList] = useState<any[]>([]);
  const [isLoadingBgm, setIsLoadingBgm] = useState(false);

  // 图片聊天记录数据状态
  const [imageChatHistory, setImageChatHistory] = useState<any[]>([]);
  const [isLoadingImageHistory, setIsLoadingImageHistory] = useState<boolean>(false);

  // 加载图片聊天记录
  const loadImageChatHistory = async () => {
    // 获取当前选中场次的sceneId
    const currentSceneData = scenesData.find((scene: any) => scene.sceneName === selectedScene);
    const sceneId = currentSceneData?.sceneId;

    console.log('LoadImageChatHistory - selectedScene:', selectedScene);
    console.log('LoadImageChatHistory - scenesData:', scenesData);
    console.log('LoadImageChatHistory - sceneId:', sceneId);

    if (!sceneId) {
      console.log('No scene selected, skipping image chat history load');
      setIsLoadingImageHistory(false); // 确保loading状态被重置
      return;
    }

    setIsLoadingImageHistory(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${STORYAI_API_BASE}/chat-history/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify({
          sceneId: sceneId.toString(),
          chatScene: "IMAGE",
          type: "AI_ANSWER",
          pageNum: 1,
          pageSize: 24
        })
      });

      console.log('LoadImageChatHistory - response:', response);

      if (response.ok) {
        const result = await response.json();
        console.log('LoadImageChatHistory - result:', result);
        if (result.code === 0 && result.data) {
          setImageChatHistory(result.data.records || result.data || []);
        } else {
          console.log('LoadImageChatHistory - API returned error:', result);
          setImageChatHistory([]);
        }
      } else {
        console.error('LoadImageChatHistory - HTTP error:', response.status);
        setImageChatHistory([]);
      }
    } catch (error) {
      console.error('加载图片聊天记录失败:', error);
      setImageChatHistory([]);
    } finally {
      setIsLoadingImageHistory(false);
    }
  };

  // 图片数据状态
  const [imageItems, setImageItems] = useState([]);

  // 图片分镜板数据状态
  const [storyboardItems, setStoryboardItems] = useState<any[]>([]);
  const [isLoadingStoryboard, setIsLoadingStoryboard] = useState<boolean>(false);

  // 加载分镜板列表
  const loadStoryboardList = async () => {
    // 获取当前选中场次的sceneId
    const currentSceneData = scenesData.find((scene: any) => scene.sceneName === selectedScene);
    const sceneId = currentSceneData?.sceneId;

    console.log('LoadStoryboardList - selectedScene:', selectedScene);
    console.log('LoadStoryboardList - scenesData:', scenesData);
    console.log('LoadStoryboardList - sceneId:', sceneId);

    if (!sceneId) {
      console.log('No scene selected, skipping storyboard list load');
      setIsLoadingStoryboard(false); // 确保loading状态被重置
      return;
    }

    setIsLoadingStoryboard(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${STORYAI_API_BASE}/storyboard/list?sceneId=${sceneId}`, {
        method: 'GET',
        headers: {
          'X-Prompt-Manager-Token': token || '',
        }
      });

      console.log('LoadStoryboardList - response:', response);

      if (response.ok) {
        const result = await response.json();
        console.log('LoadStoryboardList - result:', result);
        if (result.code === 0 && result.data) {
          // 按 storyboardOrder 排序后设置数据
          const sortedData = (result.data || []).sort((a: any, b: any) =>
            (a.storyboardOrder || 0) - (b.storyboardOrder || 0)
          );
          setStoryboardItems(sortedData);
        } else {
          console.log('LoadStoryboardList - API returned error:', result);
          setStoryboardItems([]);
        }
      } else {
        console.error('LoadStoryboardList - HTTP error:', response.status);
        setStoryboardItems([]);
      }
    } catch (error) {
      console.error('加载分镜板列表失败:', error);
      setStoryboardItems([]);
    } finally {
      setIsLoadingStoryboard(false);
    }
  };

  // 视频预览
  const handleVideoPreview = async () => {
    // 获取当前选中场次的sceneId
    const currentSceneData = scenesData.find((scene: any) => scene.sceneName === selectedScene);
    const sceneId = currentSceneData?.sceneId;

    if (!sceneId) {
      toast.error('请先选择场次');
      return;
    }

    setIsGeneratingPreview(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${STORYAI_API_BASE}/multimedia/video/preview?sceneId=${sceneId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        }
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.code === 0) {
        toast.success('视频预览生成成功！');
        // 可以在这里处理返回的预览视频URL
        if (result.data?.videoUrl) {
          // 打开预览视频
          window.open(result.data.videoUrl, '_blank');
        }
      } else {
        throw new Error(result.message || '视频预览生成失败');
      }
    } catch (error) {
      console.error('视频预览失败:', error);
      toast.error('视频预览失败：' + (error as Error).message);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // 创建分镜板
  const handleCreateStoryboard = async (fileId: string, fileName: string) => {
    // 获取当前选中场次的sceneId
    const currentSceneData = scenesData.find((scene: any) => scene.sceneName === selectedScene);
    const sceneId = currentSceneData?.sceneId;

    if (!sceneId) {
      toast.error('请先选择场次');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      // 计算下一个排序号 (当前列表长度 + 1)
      const storyboardOrder = storyboardItems.length + 1;

      const response = await fetch(`${STORYAI_API_BASE}/storyboard/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify({
          sceneId: sceneId,
          storyboardOrder: storyboardOrder,
          fileId: fileId
        })
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.code === 0) {
        toast.success(`已应用图片: ${fileName}`);
        // 刷新分镜板列表
        await loadStoryboardList();
      } else {
        throw new Error(result.message || '应用图片失败');
      }
    } catch (error) {
      console.error('创建分镜板失败:', error);
      toast.error('应用图片失败：' + (error as Error).message);
    }
  };

  // 编辑时间状态
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingStartMinutes, setEditingStartMinutes] = useState<string>('');
  const [editingStartSeconds, setEditingStartSeconds] = useState<string>('');
  const [editingEndMinutes, setEditingEndMinutes] = useState<string>('');
  const [editingEndSeconds, setEditingEndSeconds] = useState<string>('');

  // 场次内容编辑状态
  const [editingSceneItemId, setEditingSceneItemId] = useState<number | null>(null);
  const [editingSceneContent, setEditingSceneContent] = useState<string>('');
  const [editingSceneType, setEditingSceneType] = useState<number>(0); // 0: 画面, 1: 对话
  const [editingSceneRoleName, setEditingSceneRoleName] = useState<string>(''); // 角色名称
  const [editingSceneStartMinutes, setEditingSceneStartMinutes] = useState<string>('');
  const [editingSceneStartSeconds, setEditingSceneStartSeconds] = useState<string>('');
  const [editingSceneEndMinutes, setEditingSceneEndMinutes] = useState<string>('');
  const [editingSceneEndSeconds, setEditingSceneEndSeconds] = useState<string>('');

  // 删除确认状态
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteStoryboardId, setDeleteStoryboardId] = useState<string | null>(null);
  const [removeUploadedImageId, setRemoveUploadedImageId] = useState<string | null>(null);

  // 视频数据状态 (使用与图片相同的数据结构)
  const [videoItems, setVideoItems] = useState([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = "/32767410413-1-192.mp4"; // 视频文件路径

  // 用于跟踪上一次的audioType值
  const prevAudioTypeRef = useRef<'voice' | 'sound'>(audioType);

  // 进度条拖拽状态
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 处理拖拽结束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldItems = sceneContent;
      const oldIndex = oldItems.findIndex((item) => item.id.toString() === active.id);
      const newIndex = oldItems.findIndex((item) => item.id.toString() === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // 先更新本地状态
        const newItems = arrayMove(oldItems, oldIndex, newIndex);
        setSceneContent(newItems);

        // 调用API更新排序
        try {
          const token = localStorage.getItem('token');
          const movedItem = oldItems[oldIndex];

          // 计算新的orderNum：使用新位置的索引+1作为orderNum
          const newOrderNum = newIndex + 1;

          const response = await fetch(`${STORYAI_API_BASE}/scene/content`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Prompt-Manager-Token': token || '',
            },
            body: JSON.stringify({
              id: movedItem.id,
              orderNum: newOrderNum
            })
          });

          if (!response.ok) {
            throw new Error(`请求失败: ${response.status}`);
          }

          const result = await response.json();
          if (result.code !== 0) {
            throw new Error(result.message || '更新排序失败');
          }

          console.log('排序更新成功:', result);
        } catch (error) {
          console.error('更新排序失败:', error);
          // API调用失败时，恢复原来的排序
          setSceneContent(oldItems);
          toast.error('排序更新失败：' + (error as Error).message);
        }
      }
    }
  };

  // 图片拖拽处理
  const handleImageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImageItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // 显示删除分镜板确认对话框
  const handleShowDeleteStoryboardConfirm = (itemId: string) => {
    setDeleteStoryboardId(itemId);
  };

  // 删除分镜板
  const handleDeleteStoryboard = async (itemId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${STORYAI_API_BASE}/storyboard/${itemId}`, {
        method: 'DELETE',
        headers: {
          'X-Prompt-Manager-Token': token || '',
        }
      });

      if (!response.ok) {
        throw new Error(`删除失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.code === 0) {
        toast.success('分镜板删除成功！');
        // 刷新分镜板列表
        await loadStoryboardList();
      } else {
        throw new Error(result.message || '删除分镜板失败');
      }
    } catch (error) {
      console.error('删除分镜板失败:', error);
      toast.error('删除失败：' + (error as Error).message);
    }
  };

  // 确认删除分镜板
  const handleConfirmDeleteStoryboard = async () => {
    if (deleteStoryboardId === null) return;
    await handleDeleteStoryboard(deleteStoryboardId);
    setDeleteStoryboardId(null);
  };

  // 分镜板拖拽处理
  const handleStoryboardDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldItems = storyboardItems;
      const oldIndex = oldItems.findIndex((item) => item.id.toString() === active.id);
      const newIndex = oldItems.findIndex((item) => item.id.toString() === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // 先更新本地状态
        const newItems = arrayMove(oldItems, oldIndex, newIndex);
        setStoryboardItems(newItems);

        // 调用API更新分镜板排序
        try {
          const token = localStorage.getItem('token');
          const movedItem = oldItems[oldIndex];

          // 计算新的storyboardOrder：使用新位置的索引+1作为storyboardOrder
          const newStoryboardOrder = newIndex + 1;

          const response = await fetch(`${STORYAI_API_BASE}/storyboard/update`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Prompt-Manager-Token': token || '',
            },
            body: JSON.stringify({
              id: parseInt(movedItem.id),
              storyboardOrder: newStoryboardOrder
            })
          });

          if (!response.ok) {
            throw new Error(`更新排序失败: ${response.status}`);
          }

          const result = await response.json();
          if (result.code === 0) {
            toast.success('分镜板排序已更新！');
          } else {
            throw new Error(result.message || '更新排序失败');
          }
        } catch (error) {
          console.error('更新分镜板排序失败:', error);
          // API调用失败时，恢复原来的排序
          setStoryboardItems(oldItems);
          toast.error('排序更新失败：' + (error as Error).message);
        }
      }
    }
  };

  // 视频拖拽处理
  const handleVideoDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setVideoItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // 剧本卡片拖动处理
  const handleScriptDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setScriptCards((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // 删除剧本卡片
  const handleDeleteScriptCard = (id: string) => {
    setScriptCards((items) => items.filter((item) => item.id !== id));
  };

  // 显示删除确认对话框
  const handleShowDeleteConfirm = (id: number) => {
    setDeleteConfirmId(id);
  };

  // 确认删除场次内容项
  const handleConfirmDelete = async () => {
    if (deleteConfirmId === null) return;

    const id = deleteConfirmId;
    setDeleteConfirmId(null); // 先关闭对话框

    // 如果是新创建的临时项（还没保存到服务器），直接从本地删除
    if (id > 1000000000000) {
      setSceneContent((items) => items.filter((item) => item.id !== id));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${STORYAI_API_BASE}/scene/content/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Prompt-Manager-Token': token || '',
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          // 从本地状态中删除
          setSceneContent((items) => items.filter((item) => item.id !== id));
        } else {
          toast.error('删除失败：' + (result.message || '未知错误'));
        }
      } else {
        throw new Error(`请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error('删除场次内容失败:', error);
      toast.error('删除失败：' + (error as Error).message);
    }
  };

  // 取消删除
  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  // 更新场次名称
  const updateSceneName = async (sceneId: number, newSceneName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${STORYAI_API_BASE}/scene`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify({
          id: sceneId,
          sceneTitle: newSceneName
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          // 获取旧的场次名称
          const oldSceneName = scenesData.find((scene: any) => scene.sceneId === sceneId)?.sceneName;

          // 更新本地场次数据
          setScenesData((scenes) =>
            scenes.map((scene: any) =>
              scene.sceneId === sceneId
                ? { ...scene, sceneName: newSceneName }
                : scene
            )
          );

          // 更新场次选项
          setSceneOptions((options) =>
            options.map((option) =>
              option === oldSceneName ? newSceneName : option
            )
          );

          return true;
        } else {
          toast.error('场次名称更新失败：' + (result.message || '未知错误'));
          return false;
        }
      } else {
        throw new Error(`请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error('更新场次名称失败:', error);
      toast.error('场次名称更新失败：' + (error as Error).message);
      return false;
    }
  };

  // 时间格式验证和格式化函数
  const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^\d{1,2}:\d{1,2}$/;
    if (!timeRegex.test(time)) return false;

    const [minutes, seconds] = time.split(':').map(Number);
    return minutes <= 59 && seconds <= 59;
  };

  const formatTime = (time: string): string => {
    const timeRegex = /^(\d{1,2}):(\d{1,2})$/;
    const match = time.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      if (minutes <= 59 && seconds <= 59) {
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }
    return time;
  };

  // 时间输入组件
  const TimeRangeInput = ({
    startMinutes,
    startSeconds,
    endMinutes,
    endSeconds,
    onStartMinutesChange,
    onStartSecondsChange,
    onEndMinutesChange,
    onEndSecondsChange
  }: {
    startMinutes: string;
    startSeconds: string;
    endMinutes: string;
    endSeconds: string;
    onStartMinutesChange: (value: string) => void;
    onStartSecondsChange: (value: string) => void;
    onEndMinutesChange: (value: string) => void;
    onEndSecondsChange: (value: string) => void;
  }) => {
    const handleNumberInputChange = (value: string, setter: (value: string) => void) => {
      const numValue = Math.max(0, Math.min(59, parseInt(value) || 0));
      setter(numValue.toString());
    };

    return (
      <div className="flex items-center space-x-1 text-xs text-gray-400">
        {/* 开始时间编辑 - 分钟 */}
        <input
          type="number"
          min="0"
          max="59"
          value={startMinutes}
          onChange={(e) => handleNumberInputChange(e.target.value, onStartMinutesChange)}
          className="w-10 px-1 py-0.5 text-xs border border-gray-300 rounded text-center focus:outline-none focus:border-blue-500"
        />
        <span>:</span>
        {/* 开始时间编辑 - 秒 */}
        <input
          type="number"
          min="0"
          max="59"
          value={startSeconds}
          onChange={(e) => handleNumberInputChange(e.target.value, onStartSecondsChange)}
          className="w-10 px-1 py-0.5 text-xs border border-gray-300 rounded text-center focus:outline-none focus:border-blue-500"
        />
        <span>-</span>
        {/* 结束时间编辑 - 分钟 */}
        <input
          type="number"
          min="0"
          max="59"
          value={endMinutes}
          onChange={(e) => handleNumberInputChange(e.target.value, onEndMinutesChange)}
          className="w-10 px-1 py-0.5 text-xs border border-gray-300 rounded text-center focus:outline-none focus:border-blue-500"
        />
        <span>:</span>
        {/* 结束时间编辑 - 秒 */}
        <input
          type="number"
          min="0"
          max="59"
          value={endSeconds}
          onChange={(e) => handleNumberInputChange(e.target.value, onEndSecondsChange)}
          className="w-10 px-1 py-0.5 text-xs border border-gray-300 rounded text-center focus:outline-none focus:border-blue-500"
        />
      </div>
    );
  };

  const handleTimeInputChange = (value: string, setter: (time: string) => void) => {
    // 只允许数字和冒号
    const cleanValue = value.replace(/[^0-9:]/g, '');

    // 防止多个冒号
    const parts = cleanValue.split(':');
    if (parts.length > 2) {
      return; // 不允许超过一个冒号
    }

    // 限制格式为 MM:SS
    if (cleanValue.length <= 5) {
      // 自动添加冒号：当输入2位数字且没有冒号时
      if (cleanValue.length === 2 && !cleanValue.includes(':')) {
        setter(cleanValue + ':');
      } else {
        // 验证每部分不超过59
        const [minutes, seconds] = cleanValue.split(':');
        if (minutes && parseInt(minutes) > 59) return;
        if (seconds && parseInt(seconds) > 59) return;

        setter(cleanValue);
      }
    }
  };

  // 开始编辑场次内容项
  const handleEditSceneItem = (item: any) => {
    setEditingSceneItemId(item.id);
    setEditingSceneContent(item.content);
    setEditingSceneType(item.type || 1); // 默认为画面脚本
    setEditingSceneRoleName(item.roleName || ''); // 角色名称

    // 将毫秒格式转换为 mm:ss 格式
    const startTimeMs = item.startTime || 0;
    const endTimeMs = item.endTime || 0;

    const startTimeStr = formatMillisecondsToTime(startTimeMs);
    const endTimeStr = formatMillisecondsToTime(endTimeMs);

    // 解析开始时间
    const [startMin, startSec] = startTimeStr.split(':');
    setEditingSceneStartMinutes(startMin || '00');
    setEditingSceneStartSeconds(startSec || '00');

    // 解析结束时间
    const [endMin, endSec] = endTimeStr.split(':');
    setEditingSceneEndMinutes(endMin || '00');
    setEditingSceneEndSeconds(endSec || '00');
  };

  // 保存场次内容项编辑
  const handleSaveSceneItem = async () => {
    if (editingSceneItemId === null) return;

    // 验证时间逻辑
    const startSeconds = parseInt(editingSceneStartMinutes) * 60 + parseInt(editingSceneStartSeconds);
    const endSeconds = parseInt(editingSceneEndMinutes) * 60 + parseInt(editingSceneEndSeconds);

    if (startSeconds >= endSeconds) {
      toast.error('开始时间必须小于结束时间');
      return;
    }

    if (!editingSceneContent.trim()) {
      toast.error('请输入内容');
      return;
    }

    // 将时间转换为毫秒格式
    const startTimeMs = startSeconds * 1000;
    const endTimeMs = endSeconds * 1000;

    try {
      const token = localStorage.getItem('token');

      // 检查是否是新创建的项目（临时ID通常是时间戳，会很大）
      const isNewItem = editingSceneItemId > 1000000000000;

      // 获取当前选中场次的sceneId
      const currentSceneData = scenesData.find((scene: any) => scene.sceneName === selectedScene);
      const sceneId = currentSceneData?.sceneId;

      if (isNewItem && !sceneId) {
        toast.error('请先选择场次');
        return;
      }

      // 构建API请求参数
      let requestBody: any = {
        type: editingSceneType,
        content: editingSceneContent,
        startTime: startTimeMs,
        endTime: endTimeMs
      };

      // 新增时添加sceneId，编辑时添加id
      if (isNewItem) {
        requestBody.sceneId = sceneId;
      } else {
        requestBody.id = editingSceneItemId;
      }

      // 对话类型时添加角色名
      if (editingSceneType === 2 && editingSceneRoleName) {
        requestBody.roleName = editingSceneRoleName;
      }

      const response = await fetch(`${STORYAI_API_BASE}/scene/content`, {
        method: isNewItem ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          if (isNewItem) {
            // 新项目：更新本地状态，使用服务器返回的真实ID
            setSceneContent((items) =>
              items.map((item) =>
                item.id === editingSceneItemId
                  ? {
                      ...item,
                      id: result.data?.id || item.id, // 使用服务器返回的真实ID
                      type: editingSceneType,
                      content: editingSceneContent,
                      roleName: editingSceneType === 2 ? editingSceneRoleName : undefined,
                      startTime: startTimeMs,
                      endTime: endTimeMs,
                    }
                  : item
              )
            );
          } else {
            // 更新项目：正常更新
            setSceneContent((items) =>
              items.map((item) =>
                item.id === editingSceneItemId
                  ? {
                      ...item,
                      type: editingSceneType,
                      content: editingSceneContent,
                      roleName: editingSceneType === 2 ? editingSceneRoleName : undefined,
                      startTime: startTimeMs,
                      endTime: endTimeMs,
                    }
                  : item
              )
            );
          }

          // 重置编辑状态
          setEditingSceneItemId(null);
          setEditingSceneContent('');
          setEditingSceneType(0);
          setEditingSceneRoleName('');
          setEditingSceneStartMinutes('');
          setEditingSceneStartSeconds('');
          setEditingSceneEndMinutes('');
          setEditingSceneEndSeconds('');
        } else {
          toast.error('保存失败：' + (result.message || '未知错误'));
        }
      } else {
        throw new Error(`请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error('保存场次内容失败:', error);
      toast.error('保存失败：' + (error as Error).message);
    }
  };

  // 取消编辑场次内容项
  const handleCancelEditSceneItem = () => {
    // 如果是新创建的项目且取消编辑，则删除该项目
    if (editingSceneItemId !== null && editingSceneItemId > 1000000000000) {
      setSceneContent((items) => items.filter((item) => item.id !== editingSceneItemId));
    }

    setEditingSceneItemId(null);
    setEditingSceneContent('');
    setEditingSceneType(0);
    setEditingSceneRoleName('');
    setEditingSceneStartMinutes('');
    setEditingSceneStartSeconds('');
    setEditingSceneEndMinutes('');
    setEditingSceneEndSeconds('');
  };

  // 开始新增场次内容项 - 直接在内容区添加空白项
  const handleStartAddNewItem = () => {
    // 创建一个新的空白项目，直接进入编辑状态
    const newItem = {
      id: Date.now(), // 临时ID
      type: 1, // 默认为画面脚本
      content: '',
      roleName: '',
      startTime: '00:00',
      endTime: '00:05',
    };

    // 添加到内容列表
    setSceneContent((items) => [...items, newItem]);

    // 立即进入编辑状态
    setEditingSceneItemId(newItem.id);
    setEditingSceneContent('');
    setEditingSceneType(0); // 默认为画面
    setEditingSceneRoleName(''); // 角色名为空
    setEditingSceneStartMinutes('00');
    setEditingSceneStartSeconds('00');
    setEditingSceneEndMinutes('00');
    setEditingSceneEndSeconds('05');
  };

  // 时间解析和格式化函数
  const parseTimeRange = (timeRange: string) => {
    // 支持两种格式: "00:00'-00:05'" 和 "00:00-00:05"
    const match = timeRange.match(/(\d{2}):(\d{2})'?-'?(\d{2}):(\d{2})'?/);
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

  const formatTimeRange = (startMin: string, startSec: string, endMin: string, endSec: string) => {
    return `${startMin.padStart(2, '0')}:${startSec.padStart(2, '0')}'-${endMin.padStart(2, '0')}:${endSec.padStart(2, '0')}'`;
  };

  // 编辑时间相关函数
  const startEditTime = (itemId: string, currentTimeRange: string) => {
    console.log('Starting edit for item:', itemId, 'timeRange:', currentTimeRange);
    const timeData = parseTimeRange(currentTimeRange);
    console.log('Parsed time data:', timeData);

    setEditingTimeId(itemId);
    setEditingStartMinutes(timeData.startMinutes);
    setEditingStartSeconds(timeData.startSeconds);
    setEditingEndMinutes(timeData.endMinutes);
    setEditingEndSeconds(timeData.endSeconds);
  };

  // 更新分镜板时间
  const updateStoryboardTime = async (itemId: string, startTimeMs: number, endTimeMs: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${STORYAI_API_BASE}/storyboard/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify({
          id: parseInt(itemId),
          startTime: startTimeMs,
          endTime: endTimeMs
        })
      });

      if (!response.ok) {
        throw new Error(`更新时间失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.code === 0) {
        toast.success('时间更新成功！');
        // 刷新分镜板列表
        await loadStoryboardList();
      } else {
        throw new Error(result.message || '更新时间失败');
      }
    } catch (error) {
      console.error('更新分镜板时间失败:', error);
      toast.error('时间更新失败：' + (error as Error).message);
    }
  };

  // 分镜板时间编辑保存
  const saveStoryboardTimeEdit = async (itemId: string) => {
    // 验证输入是否有效
    if (!editingStartMinutes || !editingStartSeconds || !editingEndMinutes || !editingEndSeconds) return;

    // 将时间转换为毫秒时间戳
    const startMinutes = parseInt(editingStartMinutes);
    const startSeconds = parseInt(editingStartSeconds);
    const endMinutes = parseInt(editingEndMinutes);
    const endSeconds = parseInt(editingEndSeconds);

    const startTimeMs = (startMinutes * 60 + startSeconds) * 1000;
    const endTimeMs = (endMinutes * 60 + endSeconds) * 1000;

    // 调用API更新时间
    await updateStoryboardTime(itemId, startTimeMs, endTimeMs);

    // 清理编辑状态
    setEditingTimeId(null);
    setEditingStartMinutes('');
    setEditingStartSeconds('');
    setEditingEndMinutes('');
    setEditingEndSeconds('');
  };

  const saveTimeEdit = (itemId: string, isImage: boolean = true) => {
    // 验证输入是否有效
    if (!editingStartMinutes || !editingStartSeconds || !editingEndMinutes || !editingEndSeconds) return;

    // 在保存时补零
    const startMin = editingStartMinutes.padStart(2, '0');
    const startSec = editingStartSeconds.padStart(2, '0');
    const endMin = editingEndMinutes.padStart(2, '0');
    const endSec = editingEndSeconds.padStart(2, '0');

    const newTimeRange = formatTimeRange(startMin, startSec, endMin, endSec);

    const updateItems = (items: typeof imageItems) =>
      items.map(item => {
        if (item.id === itemId) {
          return { ...item, timeRange: newTimeRange };
        }
        return item;
      });

    if (isImage) {
      setImageItems(updateItems);
    } else {
      setVideoItems(updateItems);
    }

    setEditingTimeId(null);
    setEditingStartMinutes('');
    setEditingStartSeconds('');
    setEditingEndMinutes('');
    setEditingEndSeconds('');
  };

  const cancelTimeEdit = () => {
    setEditingTimeId(null);
    setEditingStartMinutes('');
    setEditingStartSeconds('');
    setEditingEndMinutes('');
    setEditingEndSeconds('');
  };

  // 处理时间输入的辅助函数
  const handleTimeInput = (value: string, max: number) => {
    // 只允许数字输入，最多2位
    const numValue = value.replace(/\D/g, '').slice(0, 2);

    if (numValue === '') return '';

    const intValue = parseInt(numValue);
    if (isNaN(intValue)) return '';

    // 如果超过最大值，返回最大值对应的字符串
    if (intValue > max) {
      return max.toString();
    }

    return numValue;
  };

  // 处理进度条拖拽
  const handleProgressMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = event.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const newProgress = (clickX / rect.width) * 100;
    setProgress(Math.max(0, Math.min(100, newProgress)));

    // 同步视频时间
    if (videoRef.current && videoRef.current.duration) {
      const newTime = (newProgress / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressMove(event);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleProgressMove(event);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // 视频控制函数
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 视频加载完成后重置进度
  const handleVideoLoaded = () => {
    setProgress(0);
    setIsPlaying(false);
  };

  // 计算当前时间
  const videoDuration = videoRef.current?.duration || 0;
  const currentTime = Math.floor((progress / 100) * videoDuration);
  const minutes = Math.floor(currentTime / 60);
  const seconds = currentTime % 60;
  const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // 计算总时长显示
  const totalMinutes = Math.floor(videoDuration / 60);
  const totalSeconds = Math.floor(videoDuration % 60);
  const totalTimeDisplay = `${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`;


  // 获取音色列表
  const loadVoiceList = async (status: number) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return [];

      const user = JSON.parse(userStr);
      const userId = user.userId;
      if (!userId) return [];

      const token = localStorage.getItem('token');
      const response = await fetch(`${STORYAI_API_BASE}/voice/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify({
          userId: userId,
          status: status
        })
      });

      if (response.ok) {
        const result = await response.json();
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

  // 加载所有音色数据
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

  // 应用音色到已设置列表
  const handleApplyVoice = async (voiceId: string) => {
    try {
      const token = localStorage.getItem('token');
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
        const result = await response.json();
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

  // 开始编辑音色名称
  const handleStartEditVoiceName = (voiceId: string, currentName: string) => {
    setEditingVoiceId(voiceId);
    setEditingVoiceName(currentName);
  };

  // 保存音色名称修改
  const handleSaveVoiceName = async () => {
    if (!editingVoiceId || !editingVoiceName.trim()) return;

    try {
      const token = localStorage.getItem('token');
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
        const result = await response.json();
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

  // 取消编辑音色名称
  const handleCancelEditVoiceName = () => {
    setEditingVoiceId(null);
    setEditingVoiceName('');
  };

  // 处理音色名称编辑的键盘事件
  const handleVoiceNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveVoiceName();
    } else if (e.key === 'Escape') {
      handleCancelEditVoiceName();
    }
  };

  // 处理音色选择
  const handleVoiceSelect = async (itemId: string, voiceId: string) => {
    if (!voiceId) return;

    try {
      const token = localStorage.getItem('token');
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

      const result = await response.json();
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

  // 播放音频
  const handlePlayAudio = async (itemId: string) => {
    try {
      const token = localStorage.getItem('token');
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

      const result = await response.json();
      if (result.code === 0) {
        if (result.data?.audioUrl) {
          // 直接播放音频，不添加事件监听器
          const audio = new Audio(result.data.audioUrl);
          audio.play().catch((error) => {
            console.error('音频播放失败:', error);
            toast.error('音频播放失败');
          });
        } else {
          toast.error('音频生成中');
        }
      } else {
        throw new Error(result.message || '获取音频失败');
      }
    } catch (error) {
      console.error('播放音频失败:', error);
      toast.error('播放音频失败：' + (error as Error).message);
    }
  };

  // 加载音效列表
  const loadBgmList = async () => {
    setIsLoadingBgm(true);
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const userId = user.userId;
      if (!userId) return;

      const token = localStorage.getItem('token');
      const response = await fetch(`${STORYAI_API_BASE}/bgm/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify({
          userId: userId.toString()
        })
      });

      if (response.ok) {
        const result = await response.json();
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

  // 应用音效到场次
  const handleApplyBgm = async (bgm: any) => {
    // 获取当前选中场次的sceneId
    const currentSceneData = scenesData.find((scene: any) => scene.sceneName === selectedScene);
    const sceneId = currentSceneData?.sceneId;

    if (!sceneId) {
      toast.error('请先选择场次');
      return;
    }

    if (!bgm.attachmentId) {
      toast.error('音效文件缺少attachmentId');
      return;
    }

    try {
      const token = localStorage.getItem('token');

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

      const result = await response.json();
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

  // 图片生成API调用
  const handleImageGenerate = async () => {
    if (!userInput.trim()) {
      toast.error(t('shortplayEntry.input.description'));
      return;
    }

    // 获取当前选中场次的sceneId
    const currentSceneData = scenesData.find((scene: any) => scene.sceneName === selectedScene);
    const sceneId = currentSceneData?.sceneId;

    if (!sceneId) {
      toast.error('请先选择场次');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('正在生成图片...');

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

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('图片生成结果:', result);

      if (result.code === 0) {
        setGenerationStatus('生成完成！');
        setUserInput(''); // 清空输入

        // 刷新图片聊天记录列表
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

  // 文件上传状态
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // 批量文件上传状态
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  // 上传成功的图片文件列表
  const [uploadedImages, setUploadedImages] = useState<Array<{fileId: string; fileUrl: string; fileName: string}>>([]);

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    console.log('handleFileUpload 被调用，文件:', file);
    if (!file || isUploading) return;

    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast.error('用户信息不存在，请重新登录');
        return;
      }

      const user = JSON.parse(userStr);
      const userId = user.userId;
      if (!userId) {
        toast.error('用户ID不存在，请重新登录');
        return;
      }

      console.log('准备上传文件:', { fileName: file.name, userId });

      // 构建URL参数
      const fileName = encodeURIComponent(file.name);
      const uploadUrl = `${STORYAI_API_BASE}/file/upload?userId=${userId}&fileName=${fileName}`;

      console.log('上传URL:', uploadUrl);

      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'X-Prompt-Manager-Token': token || '',
        },
        body: formData
      });

      console.log('上传响应状态:', response.status);

      if (!response.ok) {
        throw new Error(`上传失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('文件上传结果:', result);

      if (result.code === 0) {
        // 这里可以处理上传成功后的逻辑，比如保存文件信息
        return result.data;
      } else {
        throw new Error(result.message || '文件上传失败');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      throw error; // 重新抛出错误，让批量上传处理
    }
  };

  // 批量文件上传处理
  const handleMultipleFileUpload = async (files: File[]) => {
    console.log('handleMultipleFileUpload 被调用，参数:', files);
    console.log('当前上传状态:', isUploading);

    if (!files.length || isUploading) {
      console.log('提前返回，原因:', { filesLength: files.length, isUploading });
      return;
    }

    console.log('开始设置上传状态');
    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    const results: Array<{ file: File; success: boolean; data?: any; error?: string }> = [];
    const successfulUploads: Array<{fileId: string; fileUrl: string; fileName: string}> = [];

    try {
      console.log('显示开始上传toast');
      toast(`开始上传 ${files.length} 个文件`, { icon: '📤' });

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`开始上传第 ${i + 1} 个文件:`, file.name);
        setUploadProgress({ current: i + 1, total: files.length });

        try {
          const data = await handleFileUpload(file);
          results.push({ file, success: true, data });

          // 记录上传成功的文件信息
          if (data && data.fileId && data.fileUrl) {
            successfulUploads.push({
              fileId: data.fileId,
              fileUrl: data.fileUrl,
              fileName: data.fileName || file.name
            });
          }

          toast.success(`${file.name} 上传成功 (${i + 1}/${files.length})`);
          console.log(`文件 ${file.name} 上传成功`, data);
        } catch (error) {
          const errorMessage = (error as Error).message;
          results.push({ file, success: false, error: errorMessage });
          toast.error(`${file.name} 上传失败: ${errorMessage}`);
          console.log(`文件 ${file.name} 上传失败:`, errorMessage);
        }
      }

      // 更新上传成功的图片列表
      if (successfulUploads.length > 0) {
        setUploadedImages(prev => [...prev, ...successfulUploads]);
        console.log('更新上传图片列表:', successfulUploads);
      }

      // 统计结果
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      console.log('上传结果统计:', { successCount, failCount });

      if (successCount > 0 && failCount === 0) {
        toast.success(`所有文件上传成功！(${successCount}个)`);
      } else if (successCount > 0 && failCount > 0) {
        toast(`部分文件上传成功：${successCount}个成功，${failCount}个失败`, {
          icon: '⚠️',
          duration: 4000
        });
      } else {
        toast.error(`所有文件上传失败！(${failCount}个)`);
      }

      return results;
    } finally {
      console.log('重置上传状态');
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  // 视频聊天记录数据状态
  const [videoChatHistory, setVideoChatHistory] = useState<any[]>([]);
  const [isLoadingVideoHistory, setIsLoadingVideoHistory] = useState<boolean>(false);

  // 加载视频聊天记录
  const loadVideoChatHistory = async () => {
    // 获取当前选中场次的sceneId
    const currentSceneData = scenesData.find((scene: any) => scene.sceneName === selectedScene);
    const sceneId = currentSceneData?.sceneId;

    console.log('LoadVideoChatHistory - selectedScene:', selectedScene);
    console.log('LoadVideoChatHistory - scenesData:', scenesData);
    console.log('LoadVideoChatHistory - sceneId:', sceneId);

    if (!sceneId) {
      console.log('No scene selected, skipping video chat history load');
      setIsLoadingVideoHistory(false); // 确保loading状态被重置
      return;
    }

    setIsLoadingVideoHistory(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${STORYAI_API_BASE}/chat-history/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify({
          sceneId: sceneId.toString(),
          chatScene: "VIDEO",
          type: "AI_ANSWER",
          pageNum: 1,
          pageSize: 24
        })
      });

      console.log('LoadVideoChatHistory - response:', response);

      if (response.ok) {
        const result = await response.json();
        console.log('LoadVideoChatHistory - result:', result);
        if (result.code === 0 && result.data) {
          setVideoChatHistory(result.data.records || result.data || []);
        } else {
          console.log('LoadVideoChatHistory - API returned error:', result);
          setVideoChatHistory([]);
        }
      } else {
        console.error('LoadVideoChatHistory - HTTP error:', response.status);
        setVideoChatHistory([]);
      }
    } catch (error) {
      console.error('加载视频聊天记录失败:', error);
      setVideoChatHistory([]);
    } finally {
      setIsLoadingVideoHistory(false);
    }
  };

  // 视频生成状态
  const [isVideoGenerating, setIsVideoGenerating] = useState<boolean>(false);
  const [videoGenerationFileId, setVideoGenerationFileId] = useState<string | null>(null);

  // 视频生成API调用
  const handleVideoGenerate = async () => {
    if (!userInput.trim()) {
      toast.error('请输入生成内容');
      return;
    }

    // 获取当前选中场次的sceneId
    const currentSceneData = scenesData.find((scene: any) => scene.sceneName === selectedScene);
    const sceneId = currentSceneData?.sceneId;

    if (!sceneId) {
      toast.error('请先选择场次');
      return;
    }

    setIsGenerating(true); // 使用统一的生成状态
    setIsVideoGenerating(true);
    setGenerationStatus('正在生成视频...');

    try {
      const token = localStorage.getItem('token');

      // 构建请求参数
      const requestBody = {
        sceneId: sceneId.toString(),
        llmName: "", // 固定为空字符串
        userMessage: userInput.trim(),
        useImageGeneration: uploadedImages.length > 0,
        images: uploadedImages.map(img => img.fileId) // 使用fileId而不是fileUrl
      };

      console.log('视频生成请求参数:', requestBody);

      const response = await fetch(`${STORYAI_API_BASE}/ai/video/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`视频生成请求失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('视频生成响应:', result);

      if (result.code === 0 && result.data) {
        const fileId = result.data.toString();
        setVideoGenerationFileId(fileId);

        toast.success('视频生成任务已开始！');
        setGenerationStatus('视频生成中，请稍候...');

        // 开始轮询进度
        await pollVideoProgress(fileId);
      } else {
        throw new Error(result.message || '视频生成失败');
      }
    } catch (error) {
      console.error('视频生成失败:', error);
      toast.error('视频生成失败：' + (error as Error).message);
      setGenerationStatus('');
      setIsGenerating(false);
      setIsVideoGenerating(false);
    }
  };

  // 轮询视频生成进度
  const pollVideoProgress = async (fileId: string) => {
    const maxPolls = 60; // 最多轮询60次 (5分钟)
    let pollCount = 0;

    const poll = async () => {
      try {
        pollCount++;
        console.log(`轮询视频进度，第 ${pollCount} 次`, fileId);

        const token = localStorage.getItem('token');
        const response = await fetch(`${STORYAI_API_BASE}/ai/video/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Prompt-Manager-Token': token || '',
          },
          body: JSON.stringify({ fileId: parseInt(fileId) })
        });

        if (!response.ok) {
          throw new Error(`进度查询失败: ${response.status}`);
        }

        const result = await response.json();
        console.log('视频进度响应:', result);

        if (result.code === 0 && result.data) {
          const { status, playUrl, errorMessage } = result.data;

          if (status === 'COMPLETED') {
            setGenerationStatus('视频生成完成！');
            toast.success('视频生成成功！');

            if (playUrl) {
              console.log('视频播放地址:', playUrl);
              // 这里可以添加显示视频的逻辑
            }

            // 视频生成完成后刷新视频聊天记录列表
            await loadVideoChatHistory();

            setIsGenerating(false);
            setIsVideoGenerating(false);
            setVideoGenerationFileId(null);
            setUserInput(''); // 清空输入
            return;
          } else if (status === 'FAILED' || errorMessage) {
            throw new Error(errorMessage || '视频生成失败');
          } else {
            // 继续轮询
            setGenerationStatus(`视频生成中... (${pollCount}/${maxPolls})`);

            if (pollCount < maxPolls) {
              setTimeout(poll, 5000); // 5秒后继续轮询
            } else {
              throw new Error('视频生成超时');
            }
          }
        } else {
          throw new Error(result.message || '进度查询失败');
        }
      } catch (error) {
        console.error('轮询进度失败:', error);
        toast.error('视频生成失败：' + (error as Error).message);
        setIsGenerating(false);
        setIsVideoGenerating(false);
        setVideoGenerationFileId(null);
        setGenerationStatus('');
      }
    };

    // 开始第一次轮询
    setTimeout(poll, 2000); // 2秒后开始轮询
  };

  // 音效生成API调用
  const handleBgmGenerate = async () => {
    if (!userInput.trim()) {
      toast.error(t('shortplayEntry.input.description'));
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('正在生成音效...');

    try {
      const userStr = localStorage.getItem('user');
      let userId = "";
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user.userId || "";
        } catch (error) {
          console.warn(t('shortplayEntry.input.userInfoParseError'), error);
        }
      }

      if (!userId) {
        toast.error('用户信息不完整，请重新登录');
        return;
      }

      const token = localStorage.getItem('token');

      const response = await fetch(`${STORYAI_API_BASE}/ai/bgm/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          style: style, // 使用图片tab的style参数
          userInput: userInput.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('音效生成结果:', result);

      if (result.code === 0) {
        setGenerationStatus('生成完成！');
        setUserInput(''); // 清空输入

        // 刷新音效列表
        await loadBgmList();

        toast.success('音效生成完成！');
      } else {
        throw new Error(result.message || '音效生成失败');
      }
    } catch (error) {
      console.error('音效生成失败:', error);
      toast.error('音效生成失败：' + (error as Error).message);
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };
  const loadSceneContent = async (sceneId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${STORYAI_API_BASE}/scene/content?sceneId=${sceneId}`, {
        method: 'GET',
        headers: {
          'X-Prompt-Manager-Token': token || '',
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && result.data) {
          console.log('场次内容:', result.data);
          setSceneContent(result.data);
        }
      }
    } catch (error) {
      console.error('加载场次内容失败:', error);
    }
  };

  // 加载音频内容（音频Tab专用）
  const loadAudioContent = async (sceneId: number) => {
    setIsLoadingAudioContent(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${STORYAI_API_BASE}/scene/content?sceneId=${sceneId}`, {
        method: 'GET',
        headers: {
          'X-Prompt-Manager-Token': token || '',
        }
      });

      if (response.ok) {
        const result = await response.json();
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

  // 用户数据加载状态
  const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(false);

  // 获取用户历史数据
  const loadUserData = async () => {
    // 防止重复调用
    if (isLoadingUserData) return;
    setIsLoadingUserData(true);

    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const userId = user.userId;
      if (!userId) return;

      const token = localStorage.getItem('token');
      const response = await fetch(`${STORYAI_API_BASE}/series/detail?userId=${userId}`, {
        method: 'GET',
        headers: {
          'X-Prompt-Manager-Token': token || '',
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && result.data) {
          const { seriesContent, scenes } = result.data;

          // 如果有历史内容，则显示
          if (seriesContent) {
            setGeneratedContent(seriesContent);
          }

          // 如果有场次数据，则更新下拉列表
          if (scenes && scenes.length > 0) {
            setScenesData(scenes);
            const sceneOptions = scenes.map((scene: any) => scene.sceneName);
            setSceneOptions(sceneOptions);
            setSelectedScene(sceneOptions[0] || '');
            // 自动加载第一个场次的内容
            if (scenes[0]?.sceneId) {
              loadSceneContent(scenes[0].sceneId);
            }
          }
        }
      }
    } catch (error) {
      console.error('加载用户历史数据失败:', error);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  // 组件加载时获取用户历史数据
  React.useEffect(() => {
    loadUserData();
  }, []);

  // Tab切换时加载数据
  React.useEffect(() => {
    if (activeTab === 'script') {
      // 加载剧本内容列表
      const currentSceneData = scenesData.find((scene: any) => scene.sceneName === selectedScene);
      if (currentSceneData?.sceneId) {
        loadSceneContent(currentSceneData.sceneId);
      }
    } else if (activeTab === 'audio') {
      // 加载音频内容列表（仅在切换Tab或场次时）
      const currentSceneData = scenesData.find((scene: any) => scene.sceneName === selectedScene);
      if (currentSceneData?.sceneId) {
        loadAudioContent(currentSceneData.sceneId);
      }

      // 首次进入音频Tab时也加载资源
      if (audioType === 'voice') {
        loadAllVoices();
      } else {
        loadBgmList();
      }
    } else if (activeTab === 'image') {
      loadImageChatHistory();
      loadStoryboardList();
    } else if (activeTab === 'video') {
      loadVideoChatHistory();
      loadStoryboardList();
    }
  }, [activeTab, selectedScene]);

  // 音色/音效切换时只加载左侧资源（不重新加载中间列表）
  React.useEffect(() => {
    // 只有当audioType真正改变且在音频Tab中时才执行
    if (activeTab === 'audio' && prevAudioTypeRef.current !== audioType) {
      if (audioType === 'voice') {
        loadAllVoices();
      } else {
        loadBgmList();
      }
      // 更新ref
      prevAudioTypeRef.current = audioType;
    }
  }, [audioType, activeTab]);

  // 音频生成API调用
  const handleAudioGenerate = async () => {
    if (!userInput.trim()) {
      toast.error(t('shortplayEntry.input.description'));
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('正在生成音频...');

    try {
      // 从localStorage获取user信息
      const userStr = localStorage.getItem('user');
      let userId = "";
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user.userId || "";
        } catch (error) {
          console.warn(t('shortplayEntry.input.userInfoParseError'), error);
        }
      }

      if (!userId) {
        toast.error('用户信息不完整，请重新登录');
        return;
      }

      const token = localStorage.getItem('token');

      const response = await fetch(`${STORYAI_API_BASE}/ai/voice/design`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify({
          prompt: userInput.trim(),
          userId: userId
        })
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('音频生成结果:', result);

      if (result.code === 0) {
        // 生成成功，刷新音频列表
        setGenerationStatus('生成完成！');
        setUserInput(''); // 清空输入

        // 刷新音频列表（可用音色列表）
        await loadAllVoices();

        toast.success('音频生成完成！');
      } else {
        throw new Error(result.message || '音频生成失败');
      }
    } catch (error) {
      console.error('音频生成失败:', error);
      toast.error('音频生成失败：' + (error as Error).message);
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };
  const handleGenerate = async () => {
    if (activeTab === 'video') {
      // 视频生成
      await handleVideoGenerate();
      return;
    }

    // 原有的剧本生成逻辑
    if (!userInput.trim()) {
      toast.error(t('shortplayEntry.input.description'));
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('正在创建剧本任务...');

    try {
      // 从localStorage获取user信息
      const userStr = localStorage.getItem('user');

      // 解析user信息获取userId
      let userId = "";
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user.userId || "";
        } catch (error) {
          console.warn(t('shortplayEntry.input.userInfoParseError'), error);
        }
      }

      if (!userId) {
        toast.error('用户信息不完整，请重新登录');
        return;
      }

      // 从localStorage获取token
      const token = localStorage.getItem('token');

      // 第一步：创建剧本生成任务
      const response = await fetch(`${STORYAI_API_BASE}/series/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prompt-Manager-Token': token || '',
        },
        body: JSON.stringify({
          userId: userId,
          userInput: userInput.trim(),
          provider: ""
        })
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('剧本生成任务创建成功:', result);

      if (result.code !== 0 || !result.data?.seriesId) {
        throw new Error(result.message || '创建任务失败');
      }

      const seriesId = result.data.seriesId;
      setGenerationStatus('剧本生成中，请稍候...');

      // 第二步：轮询获取生成结果
      const pollForResult = async (): Promise<void> => {
        try {
          const detailResponse = await fetch(`${STORYAI_API_BASE}/series/detail?seriesId=${seriesId}`, {
            method: 'GET',
            headers: {
              'X-Prompt-Manager-Token': token || '',
            }
          });

          if (!detailResponse.ok) {
            throw new Error(`获取详情失败: ${detailResponse.status}`);
          }

          const detailResult = await detailResponse.json();
          console.log('轮询结果:', detailResult);

          if (detailResult.code === 0 && detailResult.data) {
            const { generationStatus: status, seriesContent, scenes } = detailResult.data;

            if (status === 'COMPLETED') {
              // 生成完成
              setGenerationStatus('生成完成！');
              setGeneratedContent(seriesContent || '');

              // 更新场次选项
              if (scenes && scenes.length > 0) {
                setScenesData(scenes);
                const sceneOptions = scenes.map((scene: any) => scene.sceneName);
                setSceneOptions(sceneOptions);
                setSelectedScene(sceneOptions[0] || '');
                // 自动加载第一个场次的内容
                if (scenes[0]?.sceneId) {
                  loadSceneContent(scenes[0].sceneId);
                }
              }

              setUserInput(''); // 清空输入
              setIsGenerating(false);
              toast.success('剧本生成完成！');
            } else if (status === 'PROCESSING') {
              // 继续轮询
              setGenerationStatus('正在生成剧本内容...');
              setTimeout(pollForResult, 3000); // 3秒后重试
            } else if (status === 'FAILED') {
              // 生成失败
              setIsGenerating(false);
              setGenerationStatus('');
              toast.error('剧本生成失败，请重试');
              console.error('剧本生成失败，状态为 FAILED');
            } else {
              // 其他状态，可能是失败
              setIsGenerating(false);
              setGenerationStatus('');
              toast.error(`生成状态异常: ${status}`);
              console.error(`生成状态异常: ${status}`);
            }
          } else {
            throw new Error(detailResult.message || '获取生成状态失败');
          }
        } catch (pollError) {
          console.error('轮询过程出错:', pollError);
          // 继续重试轮询，不立即失败
          setTimeout(pollForResult, 5000); // 5秒后重试
        }
      };

      // 开始轮询
      setTimeout(pollForResult, 2000); // 2秒后开始第一次轮询

    } catch (error) {
      console.error(t('shortplayEntry.input.generateFailed') + ':', error);
      toast.error(t('shortplayEntry.input.generateFailed') + ': ' + (error as Error).message);
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="flex flex-grow overflow-hidden">
        <>
          {/* 左侧面板 - 一键创作 (均分) */}
          <div className="flex-1 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
          {/* 顶部Logo和标题区 */}
          <div className="p-4 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg width="40" height="36" viewBox="0 0 56 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* 边框 */}
                  <rect width="56" height="51" rx="10" fill="#3E83F6"/>
                  {/* Logo内容 - 星星 */}
                  <g transform="translate(28, 25.5) scale(0.7, 0.7) translate(-19, -19)">
                    <path d="M34.8333 15.3109C34.7333 15.0213 34.5515 14.767 34.3098 14.5787C34.0681 14.3904 33.7769 14.2762 33.4717 14.2501L24.4625 12.9359L20.425 4.75011C20.2954 4.48241 20.0929 4.25665 19.8409 4.09868C19.5889 3.94072 19.2974 3.85693 19 3.85693C18.7026 3.85693 18.4111 3.94072 18.1591 4.09868C17.9071 4.25665 17.7047 4.48241 17.575 4.75011L13.5375 12.9201L4.52834 14.2501C4.2353 14.2918 3.9598 14.4147 3.73311 14.605C3.50642 14.7953 3.33761 15.0454 3.24584 15.3268C3.16183 15.6018 3.1543 15.8944 3.22403 16.1734C3.29377 16.4523 3.43815 16.707 3.64167 16.9101L10.1808 23.2434L8.59751 32.2368C8.54098 32.5336 8.57058 32.8404 8.6828 33.121C8.79503 33.4015 8.98519 33.6441 9.23084 33.8201C9.47027 33.9913 9.75266 34.0923 10.0463 34.1119C10.34 34.1315 10.6333 34.0688 10.8933 33.9309L19 29.7034L27.075 33.9468C27.2972 34.0721 27.5482 34.1376 27.8033 34.1368C28.1387 34.138 28.4658 34.0326 28.7375 33.8359C28.9832 33.66 29.1733 33.4174 29.2855 33.1368C29.3978 32.8563 29.4274 32.5494 29.3708 32.2526L27.7875 23.2593L34.3267 16.9259C34.5553 16.7323 34.7242 16.4777 34.8139 16.1918C34.9036 15.9059 34.9103 15.6005 34.8333 15.3109ZM25.0958 21.6443C24.9102 21.8239 24.7712 22.0462 24.6912 22.2918C24.6112 22.5374 24.5924 22.7989 24.6367 23.0534L25.7767 29.6876L19.8233 26.5209C19.5943 26.399 19.3387 26.3352 19.0792 26.3352C18.8196 26.3352 18.5641 26.399 18.335 26.5209L12.3817 29.6876L13.5217 23.0534C13.5659 22.7989 13.5472 22.5374 13.4671 22.2918C13.3871 22.0462 13.2482 21.8239 13.0625 21.6443L8.31251 16.8943L14.9783 15.9284C15.2348 15.8928 15.4787 15.7947 15.6885 15.6429C15.8983 15.4911 16.0676 15.2901 16.1817 15.0576L19 9.02511L21.9767 15.0734C22.0907 15.3059 22.2601 15.5069 22.4699 15.6587C22.6797 15.8105 22.9235 15.9086 23.18 15.9443L29.8458 16.9101L25.0958 21.6443Z" fill="white"/>
                  </g>
                </svg>
                <span className="text-base font-medium text-gray-900">一键创作</span>
              </div>

              {/* Ant Design Segmented组件 - 带边框和高度 */}
              <div style={{ border: '1px solid #3E83F6', borderRadius: 8, padding: 8, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Segmented
                  value={activeTab}
                  onChange={(value) => setActiveTab(value as 'script' | 'audio' | 'image' | 'video')}
                  options={[
                    { label: '剧本', value: 'script' },
                    { label: '音频', value: 'audio' },
                    { label: '图片', value: 'image' },
                    { label: '视频', value: 'video' }
                  ]}
                  style={{ width: '100%' }}
                  className="[&_.ant-segmented-item-selected]:!bg-[#3E83F6] [&_.ant-segmented-thumb]:!bg-[#3E83F6]"
                />
              </div>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex-grow p-4 min-h-0">
            <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
              {/* 卡片内容区域 */}
              <div className="flex-grow p-4 overflow-auto min-h-0 h-96">
                {activeTab === 'script' && (
                  <div className="space-y-4">
                    {/* 生成的内容显示 */}
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
                  <div className="space-y-4">
                    {/* 配音选择区域 */}
                    <div className="space-y-3">
                      <div className="relative w-24">
                        <select
                          value={audioType}
                          onChange={(e) => setAudioType(e.target.value as 'voice' | 'sound')}
                          className="w-full h-9 pl-3 pr-8 text-sm rounded-lg bg-white focus:outline-none appearance-none"
                        >
                          <option value="voice">音色</option>
                          <option value="sound">音效</option>
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>

                      {audioType === 'voice' ? (
                        <>
                          {/* 已设置的配音人员 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">已设置的音色</span>
                              <button
                                onClick={() => setIsConfiguredVoicesExpanded(!isConfiguredVoicesExpanded)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Icon
                                  icon={isConfiguredVoicesExpanded ? "ri:arrow-up-s-line" : "ri:arrow-down-s-line"}
                                  className="w-4 h-4 text-gray-400"
                                />
                              </button>
                            </div>

                            {/* 显示第一条或全部 */}
                            <div className="space-y-2">
                              {isLoadingVoices ? (
                                <div className="flex items-center justify-center p-4 text-gray-500">
                                  <Icon icon="ri:loader-4-line" className="w-4 h-4 animate-spin mr-2" />
                                  加载中...
                                </div>
                              ) : (
                                configuredVoices
                                  .slice(0, isConfiguredVoicesExpanded ? configuredVoices.length : 1)
                                  .map((voice, index) => (
                                    <div key={voice.voiceId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                                        <span className="text-xs text-white font-medium">
                                          {voice.voiceName?.charAt(0) || '音'}
                                        </span>
                                      </div>
                                      <div className="flex-1">
                                        {editingVoiceId === voice.voiceId ? (
                                          <div className="flex items-center space-x-2">
                                            <input
                                              type="text"
                                              value={editingVoiceName}
                                              onChange={(e) => setEditingVoiceName(e.target.value)}
                                              onKeyDown={handleVoiceNameKeyDown}
                                              className="text-sm border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              autoFocus
                                            />
                                            <button
                                              onClick={handleSaveVoiceName}
                                              className="text-green-600 hover:text-green-800"
                                            >
                                              <Icon icon="ri:check-line" className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={handleCancelEditVoiceName}
                                              className="text-red-600 hover:text-red-800"
                                            >
                                              <Icon icon="ri:close-line" className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div
                                            className="text-sm text-gray-800 cursor-pointer hover:text-blue-600"
                                            onClick={() => handleStartEditVoiceName(voice.voiceId, voice.voiceName)}
                                          >
                                            {voice.voiceName}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex space-x-2">
                                        <button
                                          className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                                          onClick={() => {
                                            if (voice.sampleAudioUrl) {
                                              const audio = new Audio(voice.sampleAudioUrl);
                                              audio.play();
                                            }
                                          }}
                                        >
                                          试听
                                        </button>
                                        <button className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-100">
                                          删除
                                        </button>
                                      </div>
                                    </div>
                                  ))
                              )}
                            </div>
                          </div>

                          {/* 音频文件列表 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">可用音色</span>
                            </div>

                            <div className="space-y-2">
                              {isLoadingVoices ? (
                                <div className="flex items-center justify-center p-4 text-gray-500">
                                  <Icon icon="ri:loader-4-line" className="w-4 h-4 animate-spin mr-2" />
                                  加载中...
                                </div>
                              ) : (
                                availableVoices
                                  .map((voice, index) => (
                                    <div key={voice.voiceId} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                        <Icon icon="ri:music-2-line" className="w-4 h-4 text-white" />
                                      </div>
                                      <div className="flex-1">
                                        {editingVoiceId === voice.voiceId ? (
                                          <div className="flex items-center space-x-2">
                                            <input
                                              type="text"
                                              value={editingVoiceName}
                                              onChange={(e) => setEditingVoiceName(e.target.value)}
                                              onKeyDown={handleVoiceNameKeyDown}
                                              className="text-sm border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              autoFocus
                                            />
                                            <button
                                              onClick={handleSaveVoiceName}
                                              className="text-green-600 hover:text-green-800"
                                            >
                                              <Icon icon="ri:check-line" className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={handleCancelEditVoiceName}
                                              className="text-red-600 hover:text-red-800"
                                            >
                                              <Icon icon="ri:close-line" className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div
                                            className="text-sm font-medium text-gray-800 cursor-pointer hover:text-blue-600"
                                            onClick={() => handleStartEditVoiceName(voice.voiceId, voice.voiceName)}
                                          >
                                            {voice.voiceName}
                                          </div>
                                        )}
                                      </div>
                                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                                        <span className="text-xs text-white font-medium">
                                          {voice.voiceSource === 'CUSTOM' ? '定' : '系'}
                                        </span>
                                      </div>
                                      <Icon icon="ri:arrow-down-s-line" className="w-4 h-4 text-gray-400" />
                                      <div className="flex space-x-2">
                                        <button
                                          className="px-3 py-1 text-xs border border-blue-500 text-blue-500 rounded hover:bg-blue-50"
                                          onClick={() => {
                                            if (voice.sampleAudioUrl) {
                                              const audio = new Audio(voice.sampleAudioUrl);
                                              audio.play();
                                            }
                                          }}
                                        >
                                          播放
                                        </button>
                                        <button
                                          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                          onClick={() => handleApplyVoice(voice.voiceId)}
                                        >
                                          应用
                                        </button>
                                      </div>
                                    </div>
                                  ))
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* 音效文件列表 */}
                          <div className="space-y-2">
                            <span className="text-sm font-medium text-gray-700">音效文件</span>
                            <div className="space-y-2">
                              {isLoadingBgm ? (
                                <div className="flex items-center justify-center p-4 text-gray-500">
                                  <Icon icon="ri:loader-4-line" className="w-4 h-4 animate-spin mr-2" />
                                  加载中...
                                </div>
                              ) : (
                                bgmList.map((bgm, index) => (
                                  <div key={bgm.id || index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                      <Icon icon="ri:music-2-line" className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-800">{bgm.prompt || bgm.name || bgm.title || '音效文件'}</div>
                                      {bgm.description && (
                                        <div className="text-xs text-gray-500">{bgm.description}</div>
                                      )}
                                    </div>
                                    <div className="flex space-x-2">
                                      <button
                                        className="px-3 py-1 text-xs border border-green-500 text-green-500 rounded hover:bg-green-50"
                                        onClick={() => {
                                          if (bgm.audioUrl) {
                                            const audio = new Audio(bgm.audioUrl);
                                            audio.play();
                                          } else {
                                            toast.error('音效文件缺少播放地址');
                                          }
                                        }}
                                      >
                                        播放
                                      </button>
                                      <button
                                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                        onClick={() => handleApplyBgm(bgm)}
                                      >
                                        应用
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                              {!isLoadingBgm && bgmList.length === 0 && (
                                <div className="text-center text-gray-500 py-4">
                                  暂无音效文件
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'image' && (
                  <div className="space-y-4">
                    {/* 图片聊天记录内容区域 */}
                    <div className="space-y-3">
                      {isLoadingImageHistory ? (
                        <div className="flex items-center justify-center p-4 text-gray-500">
                          <Icon icon="ri:loader-4-line" className="w-4 h-4 animate-spin mr-2" />
                          加载中...
                        </div>
                      ) : imageChatHistory.length > 0 ? (
                        (() => {
                          // 将所有records的files合并成一个数组
                          const allFiles: any[] = [];
                          imageChatHistory.forEach((item, itemIndex) => {
                            if (item.files && item.files.length > 0) {
                              item.files.forEach((file: any) => {
                                if (file.fileType === 'IMAGE' && file.downloadUrl) {
                                  allFiles.push({
                                    ...file,
                                    recordIndex: itemIndex,
                                    recordContent: item.content || item.message || '图片内容',
                                    createTime: item.createTime
                                  });
                                }
                              });
                            } else if (item.imageUrl) {
                              // 兼容旧格式
                              allFiles.push({
                                downloadUrl: item.imageUrl,
                                fileName: '生成的图片',
                                fileType: 'IMAGE',
                                recordIndex: itemIndex,
                                recordContent: item.content || item.message || '图片内容',
                                createTime: item.createTime
                              });
                            }
                          });

                          return (
                            <div className="space-y-3">
                              {allFiles.map((file, index) => (
                                <div key={`file-${file.fileId || index}`} className="bg-white rounded-lg border border-gray-200 p-3">
                                  <div className="flex items-start space-x-3">
                                    {/* 序号 */}
                                    <div className="text-sm font-medium text-blue-600 min-w-[20px]">
                                      {index + 1}
                                    </div>

                                    {/* 图片缩略图 */}
                                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                      <img
                                        src={file.downloadUrl}
                                        alt={file.fileName || '生成的图片'}
                                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                        onClick={() => {
                                          window.open(file.downloadUrl, '_blank');
                                        }}
                                      />
                                    </div>

                                    {/* 内容信息 */}
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm text-gray-800 mb-1">
                                        {file.recordContent}
                                      </div>
                                      <div className="text-xs text-gray-500 mb-1">
                                        文件名: {file.fileName}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        来源记录: #{file.recordIndex + 1}
                                        {file.createTime && (
                                          <span className="ml-2">
                                            {new Date(file.createTime).toLocaleString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* 操作按钮 */}
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => window.open(file.downloadUrl, '_blank')}
                                        className="p-1 hover:bg-gray-100 rounded"
                                        title="查看原图"
                                      >
                                        <Icon icon="ri:eye-line" className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          const link = document.createElement('a');
                                          link.href = file.downloadUrl;
                                          link.download = file.fileName || '图片';
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded"
                                        title="下载图片"
                                      >
                                        <Icon icon="ri:download-line" className="w-4 h-4 text-gray-400 hover:text-green-500" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleCreateStoryboard(file.fileId, file.fileName);
                                        }}
                                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                        title="应用此图片"
                                      >
                                        应用
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          暂无图片记录
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'video' && (
                  <div className="space-y-4">
                    {/* 视频聊天记录内容区域 */}
                    <div className="space-y-3">
                      {isLoadingVideoHistory ? (
                        <div className="flex items-center justify-center p-4 text-gray-500">
                          <Icon icon="ri:loader-4-line" className="w-4 h-4 animate-spin mr-2" />
                          加载中...
                        </div>
                      ) : videoChatHistory.length > 0 ? (
                        (() => {
                          // 将所有records的files合并成一个数组
                          const allFiles: any[] = [];
                          videoChatHistory.forEach((item, itemIndex) => {
                            if (item.files && item.files.length > 0) {
                              item.files.forEach((file: any) => {
                                if (file.fileType === 'VIDEO' && file.downloadUrl) {
                                  allFiles.push({
                                    ...file,
                                    recordIndex: itemIndex,
                                    recordContent: item.content || item.message || '视频内容',
                                    createTime: item.createTime
                                  });
                                }
                              });
                            }
                          });

                          return (
                            <div className="space-y-3">
                              {allFiles.map((file, index) => (
                                <div key={`file-${file.fileId || index}`} className="bg-white rounded-lg border border-gray-200 p-3">
                                  <div className="flex items-start space-x-3">
                                    {/* 序号 */}
                                    <div className="text-sm font-medium text-blue-600 min-w-[20px]">
                                      {index + 1}
                                    </div>

                                    {/* 视频缩略图/播放器 */}
                                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                      <video
                                        src={file.downloadUrl}
                                        className="w-full h-full object-cover cursor-pointer"
                                        controls
                                        onClick={(e) => e.stopPropagation()}
                                        onError={(e) => {
                                          // 如果视频加载失败，显示播放图标
                                          e.currentTarget.style.display = 'none';
                                          const parent = e.currentTarget.parentElement;
                                          if (parent) {
                                            parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                              <svg class="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                            </div>`;
                                            parent.onclick = () => window.open(file.downloadUrl, '_blank');
                                          }
                                        }}
                                      />
                                    </div>

                                    {/* 内容信息 */}
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm text-gray-800 mb-1">
                                        {file.recordContent}
                                      </div>
                                      <div className="text-xs text-gray-500 mb-1">
                                        文件名: {file.fileName}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        来源记录: #{file.recordIndex + 1}
                                        {file.createTime && (
                                          <span className="ml-2">
                                            {new Date(file.createTime).toLocaleString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* 操作按钮 */}
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => window.open(file.downloadUrl, '_blank')}
                                        className="p-1 hover:bg-gray-100 rounded"
                                        title="播放视频"
                                      >
                                        <Icon icon="ri:play-line" className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          const link = document.createElement('a');
                                          link.href = file.downloadUrl;
                                          link.download = file.fileName || '视频';
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded"
                                        title="下载视频"
                                      >
                                        <Icon icon="ri:download-line" className="w-4 h-4 text-gray-400 hover:text-green-500" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleCreateStoryboard(file.fileId, file.fileName);
                                        }}
                                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                        title="应用此视频"
                                      >
                                        应用
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          暂无视频记录
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 卡片底部输入区域 */}
              <BottomInputArea
                activeTab={activeTab}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                userInput={userInput}
                onInputChange={setUserInput}
                isGenerating={isGenerating}
                onGenerate={
                  activeTab === 'audio'
                    ? (audioType === 'voice' ? handleAudioGenerate : handleBgmGenerate)
                    : activeTab === 'image'
                    ? handleImageGenerate
                    : handleGenerate
                }
                placeholder={t('shortplayEntry.input.placeholder')}
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
                onFileUpload={handleFileUpload}
                onMultipleFileUpload={handleMultipleFileUpload}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
            </div>
          </div>
        </div>

        {/* 中间面板 - 剧本编辑区域 */}
        <div className="flex-1 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
          <SectionHeader
            title={
              activeTab === 'script' ? t('shortplayEntry.tabs.script') :
              activeTab === 'audio' ? t('shortplayEntry.tabs.audio') :
              activeTab === 'image' ? t('shortplayEntry.tabs.image') : t('shortplayEntry.tabs.video')
            }
            subtitle={
              activeTab === 'script' ? selectedScene :
              activeTab === 'audio' ? selectedScene :
              activeTab === 'image' ? selectedScene :
              activeTab === 'video' ? selectedScene :
              undefined
            }
            subtitleOptions={
              activeTab === 'script' || activeTab === 'audio' || activeTab === 'image' || activeTab === 'video' ? sceneOptions : undefined
            }
            onSubtitleChange={(value) => {
              // 处理从下拉列表选择场次的情况
              setSelectedScene(value);
              const selectedSceneData = scenesData.find((scene: any) => scene.sceneName === value);
              if (selectedSceneData?.sceneId) {
                loadSceneContent(selectedSceneData.sceneId);
                if (activeTab === 'image') {
                  loadImageChatHistory();
                  loadStoryboardList();
                } else if (activeTab === 'video') {
                  loadVideoChatHistory();
                  loadStoryboardList();
                }
              }
            }}
            onSubtitleEdit={async (value) => {
              // 处理直接编辑场次名称的情况
              const currentSceneData = scenesData.find((scene: any) => scene.sceneName === selectedScene);
              if (currentSceneData?.sceneId) {
                const success = await updateSceneName(currentSceneData.sceneId, value);
                if (success) {
                  setSelectedScene(value);
                }
                return success;
              }
              return false;
            }}
            onOptionsChange={(options) => setSceneOptions(options)}
            onAddClick={
              activeTab === 'script' || activeTab === 'audio' ? handleStartAddNewItem : undefined
            }
          />

          {/* 剧本内容区域 */}
          <div className="flex-grow p-4 overflow-auto min-h-0 h-96">
            {activeTab === 'script' && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sceneContent.map(item => item.id.toString())}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {sceneContent.map((item) => (
                      <SortableScriptItem
                        key={item.id}
                        item={item}
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
                        onSaveSceneItem={handleSaveSceneItem}
                        onCancelEditSceneItem={handleCancelEditSceneItem}
                        onShowDeleteConfirm={handleShowDeleteConfirm}
                        TimeRangeInput={TimeRangeInput}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {activeTab === 'audio' && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={audioContent.map(item => item.id.toString())}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {isLoadingAudioContent ? (
                      <div className="flex items-center justify-center p-4 text-gray-500">
                        <Icon icon="ri:loader-4-line" className="w-4 h-4 animate-spin mr-2" />
                        加载中...
                      </div>
                    ) : audioContent.length > 0 ? (
                      audioContent.map((item) => (
                        <SortableAudioItem
                          key={item.id}
                          item={{
                            id: item.id.toString(),
                            type: item.type === 2 ? 'voice' : 'sound',
                            itemType: item.type,
                            speaker: item.type === 1 ? '' : item.type === 2 ? (item.roleName || '') : '音效',
                            content: item.content,
                            timeRange: `${formatMillisecondsToTime(item.startTime || 0)}-${formatMillisecondsToTime(item.endTime || 0)}`,
                            icon: item.type === 1 ? 'ri:camera-line' : item.type === 2 ? 'ri:user-voice-line' : 'ri:music-2-line'
                          }}
                          audioType={audioType}
                          configuredVoices={configuredVoices}
                          onVoiceSelect={handleVoiceSelect}
                          onPlayAudio={handlePlayAudio}
                        />
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        暂无音频内容
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {activeTab === 'image' && (
              <StoryboardList
                storyboardItems={storyboardItems}
                isLoadingStoryboard={isLoadingStoryboard}
                editingTimeId={editingTimeId}
                editingStartMinutes={editingStartMinutes}
                editingStartSeconds={editingStartSeconds}
                editingEndMinutes={editingEndMinutes}
                editingEndSeconds={editingEndSeconds}
                sensors={sensors}
                onEditingStartMinutesChange={setEditingStartMinutes}
                onEditingStartSecondsChange={setEditingStartSeconds}
                onEditingEndMinutesChange={setEditingEndMinutes}
                onEditingEndSecondsChange={setEditingEndSeconds}
                onStartEditTime={startEditTime}
                onSaveTimeEdit={saveStoryboardTimeEdit}
                onCancelTimeEdit={cancelTimeEdit}
                onDragEnd={handleStoryboardDragEnd}
                onDeleteItem={handleShowDeleteStoryboardConfirm}
                TimeRangeInput={TimeRangeInput}
              />
            )}

            {activeTab === 'video' && (
              <StoryboardList
                storyboardItems={storyboardItems}
                isLoadingStoryboard={isLoadingStoryboard}
                editingTimeId={editingTimeId}
                editingStartMinutes={editingStartMinutes}
                editingStartSeconds={editingStartSeconds}
                editingEndMinutes={editingEndMinutes}
                editingEndSeconds={editingEndSeconds}
                sensors={sensors}
                onEditingStartMinutesChange={setEditingStartMinutes}
                onEditingStartSecondsChange={setEditingStartSeconds}
                onEditingEndMinutesChange={setEditingEndMinutes}
                onEditingEndSecondsChange={setEditingEndSeconds}
                onStartEditTime={startEditTime}
                onSaveTimeEdit={saveStoryboardTimeEdit}
                onCancelTimeEdit={cancelTimeEdit}
                onDragEnd={handleStoryboardDragEnd}
                onDeleteItem={handleShowDeleteStoryboardConfirm}
                TimeRangeInput={TimeRangeInput}
              />
            )}
          </div>
        </div>

        {/* 右侧面板 - 手机预览区域 (固定宽度340px) */}
        <div className="bg-gray-100 flex flex-col overflow-hidden" style={{ width: '340px' }}>
          {/* 预览头部 */}
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  size="small"
                  type="primary"
                  className="text-xs"
                  onClick={handleVideoPreview}
                  loading={isGeneratingPreview}
                >
                  <Icon icon="ri:play-circle-line" className="w-3 h-3 mr-1" />
                  预览
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="small" type="text" className="text-xs text-blue-500 border border-blue-200 rounded">
                  <Icon icon="ri:download-line" className="w-3 h-3 mr-1" />
                  下载
                </Button>
                <Button size="small" type="text" className="text-xs text-blue-500 border border-blue-200 rounded">
                  插入选项
                </Button>
              </div>
            </div>
          </div>

          {/* 手机预览容器 */}
          <div className="flex-grow overflow-auto min-h-0 p-2.5">
            <div className="h-full flex items-start justify-center pt-4">
              <div className="relative w-full max-w-xs" style={{ height: '700px' }}>
                {/* 手机外框 - 响应式高度 */}
                <div className="w-full h-full mx-auto bg-black rounded-[2.5rem] p-2 shadow-2xl" style={{ aspectRatio: '9/16' }}>
                  {/* 手机屏幕 */}
                  <div className="w-full h-full bg-gray-900 rounded-[2rem] overflow-hidden relative">
                    {/* 刘海屏设计 */}
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-10"></div>

                    {/* 视频播放内容 */}
                    <div className="absolute inset-0 overflow-hidden">
                      {hasVideo ? (
                        /* 真实视频播放 */
                        <video
                          ref={videoRef}
                          src={videoSrc}
                          className="w-full h-full object-cover"
                          onClick={togglePlay}
                          onTimeUpdate={(e) => {
                            const video = e.currentTarget;
                            if (video.duration && !isDragging) {
                              setProgress((video.currentTime / video.duration) * 100);
                            }
                          }}
                          onLoadedMetadata={handleVideoLoaded}
                        />
                      ) : (
                        <>
                          {/* 默认雪景背景 */}
                          <div className="relative w-full h-full">
                            {/* 雪景背景 - 模拟真实照片效果 */}
                            <div className="absolute inset-0 bg-gradient-to-b from-blue-100 via-gray-200 to-blue-200">
                              {/* 背景纹理 */}
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-gray-300/30"></div>

                              {/* 雪花效果 - 更真实的大小和分布 */}
                              <div className="absolute inset-0">
                                {Array.from({ length: 35 }, (_, i) => (
                                  <div
                                    key={i}
                                    className={`absolute bg-white rounded-full opacity-80 ${
                                      Math.random() > 0.7 ? 'w-1.5 h-1.5' : 'w-1 h-1'
                                    }`}
                                    style={{
                                      left: `${Math.random() * 100}%`,
                                      top: `${Math.random() * 100}%`,
                                      boxShadow: '0 0 2px rgba(255,255,255,0.5)'
                                    }}
                                  ></div>
                                ))}
                              </div>
                            </div>

                            {/* 人物照片模拟 */}
                            <div className="absolute inset-0">
                              {/* 男主角 - 前景中心位置 */}
                              <div className="absolute top-16 left-8 w-32 h-48 rounded-lg overflow-hidden">
                                <div className="w-full h-full bg-gradient-to-b from-amber-100 via-orange-200 to-amber-300 relative">
                                  {/* 脸部区域 */}
                                  <div className="absolute top-4 left-6 w-20 h-24 bg-gradient-to-b from-pink-200 to-orange-200 rounded-lg">
                                    {/* 眼睛 */}
                                    <div className="absolute top-6 left-3 w-2 h-1 bg-gray-700 rounded-full"></div>
                                    <div className="absolute top-6 right-3 w-2 h-1 bg-gray-700 rounded-full"></div>
                                    {/* 嘴巴 */}
                                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-3 h-1 bg-red-300 rounded-full"></div>
                                  </div>
                                  {/* 头发 */}
                                  <div className="absolute top-2 left-4 w-24 h-16 bg-gradient-to-b from-gray-800 to-gray-600 rounded-t-lg"></div>
                                  {/* 衣服 - 黑色外套 */}
                                  <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-b from-gray-900 to-black"></div>
                                </div>
                              </div>

                              {/* 女主角 - 右侧较远位置 */}
                              <div className="absolute top-28 right-6 w-24 h-36 rounded-lg overflow-hidden opacity-90">
                                <div className="w-full h-full bg-gradient-to-b from-pink-100 via-rose-200 to-pink-300 relative">
                                  {/* 脸部区域 */}
                                  <div className="absolute top-3 left-3 w-16 h-18 bg-gradient-to-b from-pink-200 to-rose-200 rounded-lg">
                                    {/* 眼睛 */}
                                    <div className="absolute top-4 left-2 w-1.5 h-0.5 bg-gray-700 rounded-full"></div>
                                    <div className="absolute top-4 right-2 w-1.5 h-0.5 bg-gray-700 rounded-full"></div>
                                  </div>
                                  {/* 头发 */}
                                  <div className="absolute top-1 left-2 w-18 h-12 bg-gradient-to-b from-amber-800 to-amber-600 rounded-t-lg"></div>
                                  {/* 衣服 */}
                                  <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-b from-gray-700 to-gray-800"></div>
                                </div>
                              </div>

                              {/* 景深模糊效果 */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
                            </div>

                            {/* 字幕区域 */}
                            <div className="absolute bottom-24 left-6 right-6">
                              <div className="text-white text-base font-medium text-center leading-relaxed drop-shadow-lg">
                                她前夫要是看到这个场景
                              </div>
                            </div>
                          </div>
                        </>
                      )}


                      {/* 播放控制按钮 */}
                      {hasVideo && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <button
                            onClick={togglePlay}
                            className="bg-black/50 text-white rounded-full p-4 hover:bg-black/70 transition-all transform hover:scale-110"
                          >
                            <Icon
                              icon={isPlaying ? "ri:pause-fill" : "ri:play-fill"}
                              className="w-8 h-8"
                            />
                          </button>
                        </div>
                      )}

                      <>
                        {/* 进度条 */}
                        <div className="absolute bottom-12 left-4 right-4 z-10">
                            <div className="flex items-center justify-between text-white text-xs mb-1">
                              <span>{timeDisplay}</span>
                              <span>{totalTimeDisplay}</span>
                            </div>
                            <div className="relative">
                              <div
                                className="w-full h-1 bg-white/30 rounded-full cursor-pointer select-none"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseLeave}
                              >
                                <div
                                  className="h-1 bg-white rounded-full relative"
                                  style={{ width: `${progress}%` }}
                                >
                                  <div
                                    className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg cursor-grab ${isDragging ? 'cursor-grabbing scale-110' : 'hover:scale-110'} transition-transform duration-150`}
                                    onMouseDown={handleMouseDown}
                                  ></div>
                                </div>
                              </div>
                              {/* 不可见的拖拽区域，增加交互面积 */}
                              <div
                                className="absolute -top-2 -bottom-2 left-0 right-0 cursor-pointer"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseLeave}
                              ></div>
                            </div>
                          </div>

                          {/* 底部操作栏 */}
                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/60 flex items-center justify-around backdrop-blur-sm">
                            <div className="text-center">
                              <div className="text-white text-sm">续梦</div>
                            </div>
                            <div className="text-center">
                              <div className="text-white text-sm">我的</div>
                            </div>
                          </div>
                        </>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      </div>

      {/* 删除确认对话框 - 场次内容 */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon icon="ri:delete-bin-line" className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">删除确认</h3>
                <p className="text-sm text-gray-500">确定要删除这条内容吗？删除后无法恢复。</p>
              </div>
            </div>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 - 分镜板 */}
      {deleteStoryboardId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon icon="ri:delete-bin-line" className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">删除确认</h3>
                <p className="text-sm text-gray-500">确定要删除这个分镜板吗？删除后无法恢复。</p>
              </div>
            </div>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setDeleteStoryboardId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDeleteStoryboard}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShortplayEntryPage;