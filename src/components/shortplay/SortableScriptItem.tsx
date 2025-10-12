/**
 * SortableScriptItem Component
 * 可排序的剧本项组件
 */

import React from 'react';
import { Icon } from '@iconify/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TimeRangeInput } from './TimeRangeInput';
import type { SceneContentItem } from '../../types/shortplay';

interface SortableScriptItemProps {
  item: SceneContentItem;
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
  onEditSceneItem: (item: SceneContentItem) => void;
  onSaveSceneItem: () => void;
  onCancelEditSceneItem: () => void;
  onShowDeleteConfirm: (id: number) => void;
}

export const SortableScriptItem: React.FC<SortableScriptItemProps> = ({
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
  onShowDeleteConfirm
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
              <option value={0}>画面</option>
              <option value={1}>对话</option>
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
            {editingSceneType === 1 && (
              <input
                type="text"
                value={editingSceneRoleName}
                onChange={(e) => onEditingSceneRoleNameChange(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="角色名称"
              />
            )}
          </div>

          <textarea
            value={editingSceneContent}
            onChange={(e) => onEditingSceneContentChange(e.target.value)}
            className="w-full p-2 text-sm border border-gray-300 rounded resize-none"
            rows={3}
            placeholder="输入内容..."
          />

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
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing mt-1 p-1 hover:bg-gray-100 rounded"
            title="拖拽排序"
          >
            <Icon icon="ri:drag-move-2-line" className="w-4 h-4 text-gray-400" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded ${
                  item.type === 0
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {item.type === 0 ? '画面' : '对话'}
                </span>
                <span className="text-sm text-gray-500">
                  {item.startTime} - {item.endTime}
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
            <div className="text-sm text-gray-800">
              {item.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
