import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableAudioItemProps } from '../types';
import { TimeRangeInput } from '../Common/TimeRangeInput';

export function SortableAudioItem({
  item,
  audioType,
  configuredVoices,
  onVoiceSelect,
  onPlayAudio,
  editingItemId,
  editingContent,
  editingRoleName,
  onEditingContentChange,
  onEditingRoleNameChange,
  onStartEditContent,
  onSaveContentEdit,
  onCancelContentEdit,
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
  onCancelTimeEdit
}: SortableAudioItemProps) {
  const [isOpen, setIsOpen] = useState(false);
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
      className={`bg-white rounded-lg border border-gray-200 px-3 py-2 transition-all ${
        isDragging ? 'shadow-lg z-10' : ''
      }`}
      {...attributes}
    >
      {editingItemId?.toString() === item.id ? (
        // 编辑模式
        <div className="space-y-2">
          {/* 音色选择和时间在一行 */}
          <div className="flex items-center space-x-2">
            {audioType === 'voice' ? (
              <select
                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-500"
                value={editingRoleName || ''}
                onChange={(e) => onEditingRoleNameChange?.(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">选择音色</option>
                {configuredVoices.map((voice) => (
                  <option key={voice.voiceId} value={voice.voiceId}>
                    {voice.voiceName}
                  </option>
                ))}
              </select>
            ) : (
              <div></div>
            )}
            <TimeRangeInput
              startMinutes={editingStartMinutes || '00'}
              startSeconds={editingStartSeconds || '00'}
              endMinutes={editingEndMinutes || '00'}
              endSeconds={editingEndSeconds || '05'}
              onStartMinutesChange={onEditingStartMinutesChange}
              onStartSecondsChange={onEditingStartSecondsChange}
              onEndMinutesChange={onEditingEndMinutesChange}
              onEndSecondsChange={onEditingEndSecondsChange}
            />
          </div>

          {/* 台词编辑 */}
          <textarea
            value={editingContent || ''}
            onChange={(e) => onEditingContentChange?.(e.target.value)}
            className="w-full p-1.5 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="输入台词..."
          />

          {/* 统一的保存/取消按钮 */}
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => onSaveContentEdit?.(item.id)}
              className="text-green-600 hover:text-green-800 p-1 border-0 bg-transparent outline-none cursor-pointer"
            >
              <Icon icon="ri:check-line" className="w-4 h-4" />
            </button>
            <button
              onClick={onCancelContentEdit}
              className="text-red-600 hover:text-red-800 p-1 border-0 bg-transparent outline-none cursor-pointer"
            >
              <Icon icon="ri:close-line" className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        // 显示模式
        <div className="flex items-center space-x-3 cursor-move"
          onDoubleClick={() => onStartEditContent?.(item.id, item.content, item.speaker)}
        >
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
                onClick={() => onSaveTimeEdit?.(item.id)}
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
              <span>{item.timeRange}</span>
              <button
                onClick={() => {
                  onStartEditTime?.(item.id, item.timeRange);
                }}
                className="text-gray-400 hover:text-blue-600 ml-1 p-0 border-0 bg-transparent outline-none cursor-pointer"
              >
                <Icon icon="ri:edit-line" className="w-3 h-3" />
              </button>
            </div>
          )}
          <Icon
            icon="ri:play-circle-line"
            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-500"
            onClick={() => onPlayAudio?.(item.id)}
            title="播放音频"
          />
          <Icon icon="ri:delete-bin-line" className="w-4 h-4 text-gray-400 cursor-pointer hover:text-red-500" />
        </div>
      </div>
      )}
    </div>
  );
}
