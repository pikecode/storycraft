/**
 * ScriptTab Component
 * 剧本Tab - 负责场次编辑、内容管理
 */

import React from 'react';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { SectionHeader } from './SectionHeader';
import { SortableScriptItem } from './SortableScriptItem';
import { BottomInputArea } from './BottomInputArea';
import type { SceneData, SceneContentItem } from '../../types/shortplay';

interface ScriptTabProps {
  // 场次数据
  scenesData: SceneData[];
  sceneOptions: string[];
  selectedScene: string;
  sceneContent: SceneContentItem[];

  // 编辑状态
  editingSceneItemId: number | null;
  editingSceneType: number;
  editingSceneContent: string;
  editingSceneRoleName: string;
  editingSceneStartMinutes: string;
  editingSceneStartSeconds: string;
  editingSceneEndMinutes: string;
  editingSceneEndSeconds: string;

  // 输入状态
  userInput: string;
  isGenerating: boolean;
  generationStatus: string;

  // 事件处理
  onSceneSelect: (sceneName: string) => void;
  onSceneNameEdit: (newName: string) => Promise<boolean>;
  onAddNewItem: () => void;
  onEditSceneItem: (item: SceneContentItem) => void;
  onSaveSceneItem: () => void;
  onCancelEditSceneItem: () => void;
  onShowDeleteConfirm: (id: number) => void;
  onSceneContentDragEnd: (event: DragEndEvent) => void;
  onUserInputChange: (value: string) => void;
  onGenerate: () => void;

  // Setters for editing
  setEditingSceneType: (type: number) => void;
  setEditingSceneContent: (content: string) => void;
  setEditingSceneRoleName: (name: string) => void;
  setEditingSceneStartMinutes: (minutes: string) => void;
  setEditingSceneStartSeconds: (seconds: string) => void;
  setEditingSceneEndMinutes: (minutes: string) => void;
  setEditingSceneEndSeconds: (seconds: string) => void;
}

export const ScriptTab: React.FC<ScriptTabProps> = ({
  scenesData,
  sceneOptions,
  selectedScene,
  sceneContent,
  editingSceneItemId,
  editingSceneType,
  editingSceneContent,
  editingSceneRoleName,
  editingSceneStartMinutes,
  editingSceneStartSeconds,
  editingSceneEndMinutes,
  editingSceneEndSeconds,
  userInput,
  isGenerating,
  generationStatus,
  onSceneSelect,
  onSceneNameEdit,
  onAddNewItem,
  onEditSceneItem,
  onSaveSceneItem,
  onCancelEditSceneItem,
  onShowDeleteConfirm,
  onSceneContentDragEnd,
  onUserInputChange,
  onGenerate,
  setEditingSceneType,
  setEditingSceneContent,
  setEditingSceneRoleName,
  setEditingSceneStartMinutes,
  setEditingSceneStartSeconds,
  setEditingSceneEndMinutes,
  setEditingSceneEndSeconds
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="flex flex-col h-full">
      {/* 标题栏 */}
      <SectionHeader
        title="剧本"
        subtitle={selectedScene}
        subtitleOptions={sceneOptions}
        onSubtitleChange={onSceneSelect}
        onSubtitleEdit={onSceneNameEdit}
        onAddClick={onAddNewItem}
      />

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {sceneContent.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="mb-2">暂无剧本内容</p>
              <p className="text-sm">在下方输入需求生成剧本，或点击右上角 + 号手动添加</p>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onSceneContentDragEnd}
          >
            <SortableContext
              items={sceneContent.map((item) => item.id.toString())}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
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
                    onEditSceneItem={onEditSceneItem}
                    onSaveSceneItem={onSaveSceneItem}
                    onCancelEditSceneItem={onCancelEditSceneItem}
                    onShowDeleteConfirm={onShowDeleteConfirm}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* 底部输入区域 */}
      <BottomInputArea
        userInput={userInput}
        onUserInputChange={onUserInputChange}
        onGenerate={onGenerate}
        isGenerating={isGenerating}
        generationStatus={generationStatus}
        placeholder="输入剧本创作需求，例如：写一个关于..."
        buttonText="生成剧本"
      />
    </div>
  );
};
