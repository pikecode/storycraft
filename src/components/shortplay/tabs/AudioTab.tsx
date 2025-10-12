/**
 * AudioTab Component
 * 音频Tab - 负责音色管理和BGM管理
 */

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { SectionHeader } from '../SectionHeader';
import { BottomInputArea } from '../BottomInputArea';
import type { VoiceData, BgmItem, AudioType } from '../../../types/shortplay';

interface AudioTabProps {
  // 数据
  audioType: AudioType;
  configuredVoices: VoiceData[];
  availableVoices: VoiceData[];
  bgmList: BgmItem[];
  selectedScene: string;
  sceneOptions: string[];

  // 状态
  isLoadingVoices: boolean;
  isConfiguredVoicesExpanded: boolean;
  isAvailableVoicesExpanded: boolean;
  editingVoiceId: string | null;
  editingVoiceName: string;
  userInput: string;
  isGenerating: boolean;
  generationStatus: string;

  // 事件处理
  onAudioTypeChange: (type: AudioType) => void;
  onSceneSelect: (sceneName: string) => void;
  onSceneNameEdit: (newName: string) => Promise<boolean>;
  onConfiguredVoicesToggle: () => void;
  onAvailableVoicesToggle: () => void;
  onStartEditVoiceName: (voiceId: string, currentName: string) => void;
  onSaveVoiceName: () => void;
  onCancelEditVoiceName: () => void;
  onApplyVoice: (voiceId: string) => void;
  onUserInputChange: (value: string) => void;
  onGenerate: () => void;

  // Setters
  setEditingVoiceName: (name: string) => void;
}

export const AudioTab: React.FC<AudioTabProps> = ({
  audioType,
  configuredVoices,
  availableVoices,
  bgmList,
  selectedScene,
  sceneOptions,
  isLoadingVoices,
  isConfiguredVoicesExpanded,
  isAvailableVoicesExpanded,
  editingVoiceId,
  editingVoiceName,
  userInput,
  isGenerating,
  generationStatus,
  onAudioTypeChange,
  onSceneSelect,
  onSceneNameEdit,
  onConfiguredVoicesToggle,
  onAvailableVoicesToggle,
  onStartEditVoiceName,
  onSaveVoiceName,
  onCancelEditVoiceName,
  onApplyVoice,
  onUserInputChange,
  onGenerate,
  setEditingVoiceName
}) => {
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // 播放音频
  const handlePlayAudio = (url: string) => {
    if (playingAudioUrl === url) {
      // 停止播放
      audioElement?.pause();
      setPlayingAudioUrl(null);
    } else {
      // 停止之前的音频
      audioElement?.pause();

      // 播放新音频
      const audio = new Audio(url);
      audio.play();
      setAudioElement(audio);
      setPlayingAudioUrl(url);

      audio.onended = () => {
        setPlayingAudioUrl(null);
      };
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 标题栏 */}
      <SectionHeader
        title="音频"
        subtitle={selectedScene}
        subtitleOptions={sceneOptions}
        onSubtitleChange={onSceneSelect}
        onSubtitleEdit={onSceneNameEdit}
      />

      {/* 音色/音效切换 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => onAudioTypeChange('voice')}
            className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors ${
              audioType === 'voice'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Icon icon="ri:user-voice-line" className="inline-block w-4 h-4 mr-2" />
            音色
          </button>
          <button
            onClick={() => onAudioTypeChange('sound')}
            className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors ${
              audioType === 'sound'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Icon icon="ri:music-line" className="inline-block w-4 h-4 mr-2" />
            音效
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {audioType === 'voice' ? (
          // 音色管理
          <div className="p-4 space-y-4">
            {isLoadingVoices && (
              <div className="flex items-center justify-center py-8">
                <Icon icon="ri:loader-4-line" className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-sm text-gray-600">加载音色数据...</span>
              </div>
            )}

            {/* 已设置音色列表 */}
            <div className="border border-gray-200 rounded-lg">
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                onClick={onConfiguredVoicesToggle}
              >
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <Icon icon="ri:settings-3-line" className="w-4 h-4 mr-2" />
                  已设置音色 ({configuredVoices.length})
                </h3>
                <Icon
                  icon={isConfiguredVoicesExpanded ? "ri:arrow-up-s-line" : "ri:arrow-down-s-line"}
                  className="w-5 h-5 text-gray-400"
                />
              </div>

              {isConfiguredVoicesExpanded && (
                <div className="border-t border-gray-200 p-3 space-y-2">
                  {configuredVoices.length === 0 ? (
                    <div className="text-center py-4 text-sm text-gray-400">
                      暂无已设置的音色
                    </div>
                  ) : (
                    configuredVoices.map((voice) => (
                      <div
                        key={voice.voiceId}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
                      >
                        <div className="flex-1">
                          {editingVoiceId === voice.voiceId ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editingVoiceName}
                                onChange={(e) => setEditingVoiceName(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="音色名称"
                              />
                              <button
                                onClick={onSaveVoiceName}
                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                保存
                              </button>
                              <button
                                onClick={onCancelEditVoiceName}
                                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-800">{voice.voiceName}</span>
                          )}
                        </div>

                        {editingVoiceId !== voice.voiceId && (
                          <div className="flex items-center space-x-2">
                            {voice.sampleAudioUrl && (
                              <button
                                onClick={() => handlePlayAudio(voice.sampleAudioUrl!)}
                                className="p-1 text-gray-400 hover:text-blue-500"
                                title="试听"
                              >
                                <Icon
                                  icon={
                                    playingAudioUrl === voice.sampleAudioUrl
                                      ? "ri:pause-circle-line"
                                      : "ri:play-circle-line"
                                  }
                                  className="w-5 h-5"
                                />
                              </button>
                            )}
                            <button
                              onClick={() => onStartEditVoiceName(voice.voiceId, voice.voiceName)}
                              className="p-1 text-gray-400 hover:text-blue-500"
                              title="编辑"
                            >
                              <Icon icon="ri:edit-line" className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 可用音色列表 */}
            <div className="border border-gray-200 rounded-lg">
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                onClick={onAvailableVoicesToggle}
              >
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <Icon icon="ri:list-check" className="w-4 h-4 mr-2" />
                  可用音色 ({availableVoices.length})
                </h3>
                <Icon
                  icon={isAvailableVoicesExpanded ? "ri:arrow-up-s-line" : "ri:arrow-down-s-line"}
                  className="w-5 h-5 text-gray-400"
                />
              </div>

              {isAvailableVoicesExpanded && (
                <div className="border-t border-gray-200 p-3 space-y-2">
                  {availableVoices.length === 0 ? (
                    <div className="text-center py-4 text-sm text-gray-400">
                      暂无可用音色
                    </div>
                  ) : (
                    availableVoices.map((voice) => (
                      <div
                        key={voice.voiceId}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
                      >
                        <div className="flex-1">
                          <span className="text-sm text-gray-800">{voice.voiceName}</span>
                          {voice.voiceSource === 'SYSTEM' && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                              系统音色
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {voice.sampleAudioUrl && (
                            <button
                              onClick={() => handlePlayAudio(voice.sampleAudioUrl!)}
                              className="p-1 text-gray-400 hover:text-blue-500"
                              title="试听"
                            >
                              <Icon
                                icon={
                                  playingAudioUrl === voice.sampleAudioUrl
                                    ? "ri:pause-circle-line"
                                    : "ri:play-circle-line"
                                }
                                className="w-5 h-5"
                              />
                            </button>
                          )}
                          <button
                            onClick={() => onApplyVoice(voice.voiceId)}
                            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            应用
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          // BGM列表
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Icon icon="ri:music-2-line" className="w-4 h-4 mr-2" />
              BGM列表
            </h3>

            {bgmList.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                暂无BGM
                <p className="mt-2">在下方输入需求生成BGM</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bgmList.map((bgm, index) => (
                  <div
                    key={bgm.id || index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">
                        {bgm.name || bgm.title || `BGM ${index + 1}`}
                      </div>
                      {bgm.description && (
                        <div className="text-xs text-gray-500 mt-1">{bgm.description}</div>
                      )}
                    </div>

                    {(bgm.audioUrl || bgm.url) && (
                      <button
                        onClick={() => handlePlayAudio(bgm.audioUrl || bgm.url!)}
                        className="ml-3 p-2 text-gray-400 hover:text-blue-500"
                        title="播放"
                      >
                        <Icon
                          icon={
                            playingAudioUrl === (bgm.audioUrl || bgm.url)
                              ? "ri:pause-circle-fill"
                              : "ri:play-circle-fill"
                          }
                          className="w-6 h-6"
                        />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部输入区域 */}
      <BottomInputArea
        userInput={userInput}
        onUserInputChange={onUserInputChange}
        onGenerate={onGenerate}
        isGenerating={isGenerating}
        generationStatus={generationStatus}
        placeholder={
          audioType === 'voice'
            ? '描述你想要的音色特征，例如：温柔的女声、磁性的男声...'
            : '描述你想要的BGM风格，例如：轻快的钢琴曲、紧张的背景音乐...'
        }
        buttonText={audioType === 'voice' ? '生成音色' : '生成BGM'}
      />
    </div>
  );
};
