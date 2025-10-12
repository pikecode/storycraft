/**
 * BottomInputArea Component
 * 底部输入区域组件
 */

import React from 'react';
import { Icon } from '@iconify/react';

interface BottomInputAreaProps {
  userInput: string;
  onUserInputChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generationStatus?: string;
  placeholder?: string;
  buttonText?: string;
  disabled?: boolean;
  showAttachment?: boolean;
  onAttachmentClick?: () => void;
}

export const BottomInputArea: React.FC<BottomInputAreaProps> = ({
  userInput,
  onUserInputChange,
  onGenerate,
  isGenerating,
  generationStatus,
  placeholder = '输入内容...',
  buttonText = '生成',
  disabled = false,
  showAttachment = false,
  onAttachmentClick
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isGenerating && !disabled) {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <div className="p-4 bg-gray-50 border-t border-gray-200">
      {/* 生成状态提示 */}
      {generationStatus && (
        <div className="mb-2 text-sm text-blue-600 flex items-center space-x-2">
          <Icon icon="ri:loader-4-line" className="w-4 h-4 animate-spin" />
          <span>{generationStatus}</span>
        </div>
      )}

      {/* 输入区域 */}
      <div className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <textarea
            value={userInput}
            onChange={(e) => onUserInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isGenerating || disabled}
            className="w-full p-3 pr-10 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={3}
          />

          {/* 附件按钮 */}
          {showAttachment && onAttachmentClick && (
            <button
              onClick={onAttachmentClick}
              disabled={isGenerating || disabled}
              className="absolute bottom-3 right-3 p-1 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
              title="上传附件"
            >
              <Icon icon="ri:attachment-2" className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 生成按钮 */}
        <button
          onClick={onGenerate}
          disabled={isGenerating || !userInput.trim() || disabled}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {isGenerating ? (
            <>
              <Icon icon="ri:loader-4-line" className="w-4 h-4 animate-spin" />
              <span>生成中...</span>
            </>
          ) : (
            <>
              <Icon icon="ri:sparkling-2-line" className="w-4 h-4" />
              <span>{buttonText}</span>
            </>
          )}
        </button>
      </div>

      {/* 快捷键提示 */}
      <div className="mt-2 text-xs text-gray-400">
        按 {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'} + Enter 快速生成
      </div>
    </div>
  );
};
