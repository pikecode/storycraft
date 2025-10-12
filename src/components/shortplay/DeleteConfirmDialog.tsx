/**
 * DeleteConfirmDialog Component
 * 通用删除确认对话框
 */

import React from 'react';
import { Icon } from '@iconify/react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  title = '确认删除',
  message = '确定要删除这项内容吗？此操作无法撤销。',
  confirmText = '确定删除',
  cancelText = '取消',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        onClick={onCancel}
      >
        {/* 对话框 */}
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Icon icon="ri:alert-line" className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon icon="ri:close-line" className="w-5 h-5" />
            </button>
          </div>

          {/* 内容 */}
          <div className="p-6">
            <p className="text-gray-600">{message}</p>
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      {/* 添加动画样式 */}
      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};
