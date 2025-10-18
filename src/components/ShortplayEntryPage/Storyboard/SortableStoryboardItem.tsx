import React from 'react';
import { Icon } from '@iconify/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableStoryboardItemProps } from '../types';
import { formatMillisecondsToTime } from '../utils/formatTime';
import { TimeRangeInput } from '../Common/TimeRangeInput';

export function SortableStoryboardItem({
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
  TimeRangeInput: TimeRangeInputComponent,
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
