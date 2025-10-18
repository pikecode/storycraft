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

  // 删除音色
  onDeleteVoice?: (voiceId: string) => void;
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
  onDeleteVoice,
}: AudioResourcePanelProps) {
  return (
    <div className="space-y-4">
      {/* 配音选择区域 */}
      <div className="space-y-3">
        <div className="relative w-16">
          <select
            value={audioType}
            onChange={(e) => onAudioTypeChange(e.target.value as 'voice' | 'sound')}
            className="w-full h-9 pr-8 text-sm rounded-lg bg-transparent focus:outline-none appearance-none"
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
            {(isLoadingVoices || configuredVoices.length > 0) && (
            <div className="flex items-start space-x-2">
              <span className="text-sm font-medium text-gray-700 min-w-fit pt-3">已设置</span>
              <div className="flex-1 space-y-2.5">
                {isLoadingVoices ? (
                  <div className="flex items-center justify-center text-gray-500">
                    <Icon icon="ri:loader-4-line" className="w-4 h-4 animate-spin mr-2" />
                    加载中...
                  </div>
                ) : (
                  configuredVoices
                    .slice(0, isConfiguredVoicesExpanded ? configuredVoices.length : 1)
                    .map((voice) => (
                      <div key={voice.voiceId} className="flex items-center space-x-3 px-2 py-1.5 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                          <img src="/img/avatar.png" alt="定制音色" className="w-full h-full object-cover" />
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
                                style={{ width: '120px' }}
                                autoFocus
                              />
                              <button
                                onClick={onSaveVoiceName}
                                className="text-green-600 hover:text-green-800 p-0 border-0 bg-transparent outline-none"
                              >
                                <Icon icon="ri:check-line" className="w-4 h-4" />
                              </button>
                              <button
                                onClick={onCancelEditVoiceName}
                                className="text-red-600 hover:text-red-800 p-0 border-0 bg-transparent outline-none"
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
                            className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-100 flex items-center space-x-1"
                            onClick={() => {
                              if (voice.sampleAudioUrl) {
                                const audio = new Audio(voice.sampleAudioUrl);
                                audio.play();
                              }
                            }}
                          >
                            <Icon icon="ri:play-circle-line" className="w-3 h-3" />
                            <span>试听</span>
                          </button>
                          <button
                            className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-100 flex items-center space-x-1"
                            onClick={() => onDeleteVoice?.(voice.voiceId)}
                          >
                            <Icon icon="ri:delete-bin-line" className="w-3 h-3" />
                            <span>删除</span>
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
              <button
                onClick={() => onConfiguredVoicesExpandedChange(!isConfiguredVoicesExpanded)}
                className="flex-shrink-0 pt-3 border-none bg-transparent w-2.5"
              >
                <Icon
                  icon={isConfiguredVoicesExpanded ? "ri:arrow-up-s-line" : "ri:arrow-down-s-line"}
                  className="w-4 h-4 text-gray-400"
                />
              </button>
            </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
