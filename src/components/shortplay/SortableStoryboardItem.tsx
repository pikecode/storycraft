/**
 * SortableStoryboardItem Component
 * 可排序的分镜板项组件
 */

import React from 'react';
import { Icon } from '@iconify/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TimeRangeInput } from './TimeRangeInput';
import type { StoryboardItem } from '../../types/shortplay';
import { millisecondsToTime } from '../../utils/shortplayUtils';

interface SortableStoryboardItemProps {
  item: StoryboardItem;
  editingTimeId: string | null;
  editingStartMinutes: string;
  editingStartSeconds: string;
  editingEndMinutes: string;
  editingEndSeconds: string;
  onEditingStartMinutesChange: (minutes: string) => void;
  onEditingStartSecondsChange: (seconds: string) => void;
  onEditingEndMinutesChange: (minutes: string) => void;
  onEditingEndSecondsChange: (seconds: string) => void;
  onStartEditTime: (itemId: string, timeRange: string) => void;
  onSaveTimeEdit: (itemId: string) => void;
  onCancelTimeEdit: () => void;
  onDelete: (itemId: string) => void;
}

export const SortableStoryboardItem: React.FC<SortableStoryboardItemProps> = ({
  item,
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
  onDelete
}) => {
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
    WebkitFontSmoothing: 'antialiased' as const,
    MozOsxFontSmoothing: 'grayscale' as const,
    willChange: isDragging ? 'transform' as const : 'auto' as const,
    backfaceVisibility: 'hidden' as const,
    transformStyle: 'preserve-3d' as const,
    width: isDragging ? '100%' : 'auto',
    zIndex: isDragging ? 1000 : 'auto',
  };

  // 格式化时间范围
  const formatTimeRange = () => {
    if (item.startTime !== undefined && item.endTime !== undefined) {
      const start = millisecondsToTime(item.startTime);
      const end = millisecondsToTime(item.endTime);
      return `${start.minutes.toString().padStart(2, '0')}:${start.seconds.toString().padStart(2, '0')}'-${end.minutes.toString().padStart(2, '0')}:${end.seconds.toString().padStart(2, '0')}'`;
    }
    return '00:00\'-00:05\'';
  };

  const timeRange = formatTimeRange();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`p-3 bg-white border border-gray-200 rounded-lg transition-all ${
        isDragging ? 'shadow-lg z-10' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing mt-1 p-1 hover:bg-gray-100 rounded"
          title="拖拽排序"
        >
          <Icon icon="ri:drag-move-2-line" className="w-4 h-4 text-gray-400" />
        </div>

        <div className="flex-1">
          {/* 图片预览 */}
          <div className="mb-2 relative w-full h-32 bg-gray-100 rounded overflow-hidden">
            <img
              src={item.fileUrl}
              alt={item.fileName || '分镜板图片'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* 时间范围 */}
          <div className="flex items-center justify-between">
            {editingTimeId === item.id.toString() ? (
              <div className="flex items-center space-x-2">
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
                  onClick={() => onSaveTimeEdit(item.id.toString())}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  保存
                </button>
                <button
                  onClick={onCancelTimeEdit}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  取消
                </button>
              </div>
            ) : (
              <span
                className="text-xs text-gray-500 cursor-pointer hover:text-blue-500"
                onClick={() => onStartEditTime(item.id.toString(), timeRange)}
                title="点击编辑时间"
              >
                {timeRange}
              </span>
            )}

            <Icon
              icon="ri:delete-bin-line"
              className="w-4 h-4 text-gray-400 cursor-pointer hover:text-red-500"
              onClick={() => onDelete(item.id.toString())}
            />
          </div>

          {/* 描述 */}
          {item.description && (
            <div className="mt-2 text-xs text-gray-600 line-clamp-2">
              {item.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
