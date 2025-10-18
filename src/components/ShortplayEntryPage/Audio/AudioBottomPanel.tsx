import React from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { useI18n } from '../../../contexts/I18nContext';

interface Voice {
  voiceId: string;
  voiceName: string;
  sampleAudioUrl?: string;
  voiceSource?: 'CUSTOM' | 'SYSTEM';
}

interface BgmItem {
  id?: string;
  prompt?: string;
  name?: string;
  title?: string;
  description?: string;
  audioUrl?: string;
}

interface AudioBottomPanelProps {
  // 音频类型
  audioType: 'voice' | 'sound';

  // 可用音色
  availableVoices: Voice[];
  isLoadingVoices: boolean;
  editingVoiceId: string | null;
  editingVoiceName: string;
  onEditingVoiceNameChange: (name: string) => void;
  onStartEditVoiceName: (voiceId: string, voiceName: string) => void;
  onSaveVoiceName: () => void;
  onCancelEditVoiceName: () => void;
  onVoiceNameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onApplyVoice: (voiceId: string) => void;

  // 音效
  bgmList: BgmItem[];
  isLoadingBgm: boolean;
  onApplyBgm: (bgm: BgmItem) => void;

  // 输入区域
  selectedModel: string;
  onModelChange: (model: string) => void;
  userInput: string;
  onInputChange: (input: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  generationStatus?: string;
}

export function AudioBottomPanel({
  audioType,
  availableVoices,
  isLoadingVoices,
  editingVoiceId,
  editingVoiceName,
  onEditingVoiceNameChange,
  onStartEditVoiceName,
  onSaveVoiceName,
  onCancelEditVoiceName,
  onVoiceNameKeyDown,
  onApplyVoice,
  bgmList,
  isLoadingBgm,
  onApplyBgm,
  selectedModel,
  onModelChange,
  userInput,
  onInputChange,
  isGenerating,
  onGenerate,
  generationStatus,
}: AudioBottomPanelProps) {
  const { t } = useI18n();
  const finalPlaceholder = '简单描述你想要的音乐风格';

  return (
    <div>
      {/* 输入区域 */}
      <div className="p-4">
        <div className="mb-3">
          <div className="flex space-x-3">
            <div className="relative w-24">
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
              >
                {audioType === 'voice' ? (
                  <option value="minimaxi">minimaxi</option>
                ) : (
                  <option value="video">video</option>
                )}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

          </div>
        </div>

        {/* 生成状态显示 */}
        {isGenerating && generationStatus && (
          <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon icon="ri:loader-4-line" className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-blue-700">{generationStatus}</span>
            </div>
          </div>
        )}

        <div className="relative">
          <textarea
            value={userInput}
            onChange={(e) => onInputChange(e.target.value)}
            className="w-full h-12 py-2 pl-4 pr-24 text-xs rounded-lg bg-white focus:outline-none resize-none overflow-y-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', border: '1px solid rgba(116, 116, 116, 0.41)' }}
            placeholder={finalPlaceholder}
            disabled={isGenerating}
          />
          <button
            onClick={onGenerate}
            disabled={isGenerating || !userInput.trim()}
            className={`absolute bottom-2 right-2 px-3 py-1 text-white text-xs font-medium rounded transition-colors ${
              isGenerating || !userInput.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isGenerating ? t('shortplayEntry.generation.generating') : '一键生成'}
          </button>
        </div>
      </div>
    </div>
  );
}
