import React from 'react';
import { Icon } from '@iconify/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableAudioItemProps } from '../types';

export function SortableAudioItem({ item, audioType, configuredVoices, onVoiceSelect, onPlayAudio }: SortableAudioItemProps) {
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
