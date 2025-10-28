import React from 'react';
import { Button } from 'antd';
import { Icon } from '@iconify/react';
import { useI18n } from '../../../contexts/I18nContext';

interface RightPanelHeaderProps {
  onPreview: () => void;
  onDownload: () => void;
  onInsertOption: () => void;
  disabled?: boolean; // 预览按钮 loading/禁用
}

// 右侧预览头部（独立组件）
// 仅负责展示与触发回调，业务逻辑由父组件处理
export const RightPanelHeader: React.FC<RightPanelHeaderProps> = ({
  onPreview,
  onDownload,
  onInsertOption,
  disabled,
}) => {
  const { t } = useI18n();

  return (
    <div className="p-3 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            size="small"
            type="primary"
            className="text-xs"
            onClick={onPreview}
            disabled={disabled}
          >
            <Icon icon="ri:play-circle-line" className="w-3 h-3 mr-1" />
            {t('aiactoroEntry.buttons.preview')}
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="small"
            type="text"
            className="text-xs text-blue-500 border border-blue-200 rounded"
            onClick={onDownload}
          >
            <Icon icon="ri:download-line" className="w-3 h-3 mr-1" />
            {t('aiactoroEntry.buttons.download')}
          </Button>
          <Button
            size="small"
            type="text"
            className="text-xs text-blue-500 border border-blue-200 rounded"
            onClick={onInsertOption}
          >
            {t('aiactoroEntry.buttons.insertOption')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RightPanelHeader;

