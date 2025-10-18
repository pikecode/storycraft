import React from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';

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

interface AudioResourcePanelProps {
  // 音频类型
  audioType: 'voice' | 'sound';
  onAudioTypeChange: (type: 'voice' | 'sound') => void;

  // 音色相关
  configuredVoices: Voice[];
  isLoadingVoices: boolean;
  isConfiguredVoicesExpanded: boolean;
  onConfiguredVoicesExpandedChange: (expanded: boolean) => void;

  // 音色编辑
  editingVoiceId: string | null;
  editingVoiceName: string;
  onEditingVoiceNameChange: (name: string) => void;
  onStartEditVoiceName: (voiceId: string, voiceName: string) => void;
  onSaveVoiceName: () => void;
  onCancelEditVoiceName: () => void;
  onVoiceNameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function AudioResourcePanel({
  audioType,
  onAudioTypeChange,
  configuredVoices,
  isLoadingVoices,
  isConfiguredVoicesExpanded,
  onConfiguredVoicesExpandedChange,
  editingVoiceId,
  editingVoiceName,
  onEditingVoiceNameChange,
  onStartEditVoiceName,
  onSaveVoiceName,
  onCancelEditVoiceName,
  onVoiceNameKeyDown,
}: AudioResourcePanelProps) {
  return (
    <div className="space-y-4">
      {/* 配音选择区域 */}
      <div className="space-y-3">
        <div className="relative w-24">
          <select
            value={audioType}
            onChange={(e) => onAudioTypeChange(e.target.value as 'voice' | 'sound')}
            className="w-full h-9 pl-3 pr-8 text-sm rounded-lg bg-white focus:outline-none appearance-none"
          >
            <option value="voice">音色</option>
            <option value="sound">音效</option>
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {audioType === 'voice' ? (
          <>
            {/* 已设置的配音人员 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">已设置的音色</span>
              {(isLoadingVoices || configuredVoices.length > 0) && (
              <button
                onClick={() => onConfiguredVoicesExpandedChange(!isConfiguredVoicesExpanded)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Icon
                  icon={isConfiguredVoicesExpanded ? "ri:arrow-up-s-line" : "ri:arrow-down-s-line"}
                  className="w-4 h-4 text-gray-400"
                />
              </button>
              )}
            </div>

            {(isLoadingVoices || configuredVoices.length > 0) && (
            <div className="space-y-2">
              {/* 显示第一条或全部 */}
              <div className="space-y-2">
                {isLoadingVoices ? (
                  <div className="flex items-center justify-center p-4 text-gray-500">
                    <Icon icon="ri:loader-4-line" className="w-4 h-4 animate-spin mr-2" />
                    加载中...
                  </div>
                ) : (
                  configuredVoices
                    .slice(0, isConfiguredVoicesExpanded ? configuredVoices.length : 1)
                    .map((voice) => (
                      <div key={voice.voiceId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            {voice.voiceName?.charAt(0) || '音'}
                          </span>
                        </div>
                        <div className="flex-1">
                          {editingVoiceId === voice.voiceId ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editingVoiceName}
                                onChange={(e) => onEditingVoiceNameChange(e.target.value)}
                                onKeyDown={onVoiceNameKeyDown}
                                className="text-sm border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                              <button
                                onClick={onSaveVoiceName}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Icon icon="ri:check-line" className="w-4 h-4" />
                              </button>
                              <button
                                onClick={onCancelEditVoiceName}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Icon icon="ri:close-line" className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div
                              className="text-sm text-gray-800 cursor-pointer hover:text-blue-600"
                              onClick={() => onStartEditVoiceName(voice.voiceId, voice.voiceName)}
                            >
                              {voice.voiceName}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                            onClick={() => {
                              if (voice.sampleAudioUrl) {
                                const audio = new Audio(voice.sampleAudioUrl);
                                audio.play();
                              }
                            }}
                          >
                            试听
                          </button>
                          <button className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-100">
                            删除
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
