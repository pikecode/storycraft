import React from 'react';
import { Icon } from '@iconify/react';
import { useI18n } from '../../../contexts/I18nContext';

interface InteractiveQuestionOverlayProps {
  open: boolean;
  questionTitle: string;
  options: string[];

  // 标题编辑状态
  isEditingTitle: boolean;
  editingTitle: string;
  onTitleClick: () => void;
  onTitleChange: (v: string) => void;
  onTitleCommit: () => void; // Enter/Blur

  // 选项编辑状态
  editingOptionIndex: number | null;
  editingOptionText: string;
  onOptionClick: (index: number, current: string) => void;
  onOptionChange: (v: string) => void;
  onOptionCommit: (index: number) => void; // Enter/Blur 提交
  onOptionDelete: (index: number) => void;
  onAddOption: () => void;

  // 行为
  onSave: () => void;
  onCancel: () => void;
}

// 插入选项编辑蒙层（独立组件）
export const InteractiveQuestionOverlay: React.FC<InteractiveQuestionOverlayProps> = ({
  open,
  questionTitle,
  options,
  isEditingTitle,
  editingTitle,
  onTitleClick,
  onTitleChange,
  onTitleCommit,
  editingOptionIndex,
  editingOptionText,
  onOptionClick,
  onOptionChange,
  onOptionCommit,
  onOptionDelete,
  onAddOption,
  onSave,
  onCancel,
}) => {
  const { t } = useI18n();

  if (!open) return null;

  return (
    <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-3 z-20">
      {/* 题目区域 */}
      <div className="mb-3">
        {isEditingTitle ? (
          <input
            type="text"
            autoFocus
            value={editingTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onTitleCommit();
            }}
            onBlur={onTitleCommit}
            className="w-full px-3 py-2 bg-white/90 text-black rounded text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('shortplayEntry.ui.inputTitlePlaceholder')}
          />
        ) : (
          <div
            onClick={onTitleClick}
            className="text-white text-sm font-medium px-3 py-2 bg-black/40 rounded cursor-pointer hover:bg-black/60 transition-colors"
          >
            {questionTitle || t('shortplayEntry.ui.editTitleHint')}
          </div>
        )}
      </div>

      {/* 选项列表 */}
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            {editingOptionIndex === index ? (
              <input
                type="text"
                autoFocus
                value={editingOptionText}
                onChange={(e) => onOptionChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onOptionCommit(index);
                }}
                onBlur={() => onOptionCommit(index)}
                className="flex-1 px-3 py-2 bg-white/90 text-black rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div
                onClick={() => onOptionClick(index, option)}
                className="flex-1 text-white/90 text-sm cursor-pointer hover:text-white transition-colors"
              >
                {String.fromCharCode(65 + index)}. {option}
              </div>
            )}
            <button
              onClick={() => onOptionDelete(index)}
              className="text-red-500 hover:text-red-400 transition-colors p-0"
              title={t('shortplayEntry.tooltips.deleteOption')}
            >
              <Icon icon="ri:delete-bin-line" className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* 新增选项、保存和取消按钮 - 同一行 */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onAddOption}
          className="text-blue-400 hover:text-blue-300 transition-colors"
          title={t('shortplayEntry.buttons.addOption')}
        >
          <Icon icon="ri:add-line" className="w-4 h-4" />
        </button>

        <button
          onClick={onSave}
          className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
        >
          {t('shortplayEntry.buttons.save')}
        </button>

        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors"
        >
          {t('shortplayEntry.buttons.cancel')}
        </button>
      </div>
    </div>
  );
};

export default InteractiveQuestionOverlay;

