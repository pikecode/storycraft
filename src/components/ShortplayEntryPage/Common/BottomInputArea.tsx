import React from 'react';
import { Icon } from '@iconify/react';
import { useI18n } from '../../../contexts/I18nContext';
import { BottomInputAreaProps } from '../types';

export function BottomInputArea({
  activeTab,
  selectedModel,
  onModelChange,
  userInput,
  onInputChange,
  isGenerating,
  onGenerate,
  placeholder,
  generationStatus,
  // 音频tab属性
  audioType = 'voice',
  voiceType = "male",
  onVoiceTypeChange,
  // 图片tab属性
  backgroundType = "背景",
  onBackgroundTypeChange,
  style = "古风",
  onStyleChange,
  // 视频tab属性
  videoLength = "2s",
  onVideoLengthChange,
  resolution = "1080p",
  onResolutionChange,
  singleGenerate = false,
  onSingleGenerateChange,
  onFileUpload,
  onMultipleFileUpload,
  isUploading = false,
  uploadProgress = { current: 0, total: 0 }
}: BottomInputAreaProps) {
  const { t } = useI18n();

  // Use translated placeholder if not provided
  const finalPlaceholder = placeholder || t('shortplayEntry.input.placeholder');

  return (
    <div className="p-4">
      {activeTab === 'script' && (
        <>
          <div className="mb-3">
            <div className="relative w-40">
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
              >
                <option value="gemini">Gemini2.5pro</option>
                <option value="deepseek">DeepSeek-R1</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* 生成状态显示 */}
          {isGenerating && generationStatus && (
            <div className="mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
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
              className={`absolute bottom-2 right-2 px-3 py-1 text-white text-xs font-medium rounded transition-colors flex items-center space-x-1 ${
                isGenerating || !userInput.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isGenerating && (
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{isGenerating ? t('shortplayEntry.generation.generating') : t('shortplayEntry.generation.oneClickGenerate')}</span>
            </button>
          </div>
        </>
      )}

      {activeTab === 'audio' && (
        <>
          <div className="mb-3">
            <div className="flex space-x-3">
              <div className="relative w-32">
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

              <div className="relative w-20">
                <select
                  value={voiceType}
                  onChange={(e) => onVoiceTypeChange?.(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
                >
                  <option value="male">{t('shortplayEntry.audio.male')}</option>
                  <option value="female">{t('shortplayEntry.audio.female')}</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

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
        </>
      )}

      {activeTab === 'image' && (
        <>
          <div className="mb-3">
            <div className="flex space-x-3">
              <div className="relative w-32">
                <select
                  value={selectedModel}
                  onChange={(e) => onModelChange(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
                >
                  <option value="doubao-seedream-4.0">doubao-seedream-4.0</option>
                  <option value="doubao-seedream-3.0-t2i">doubao-seedream-3.0-t2i</option>
                  <option value="doubao-seededit-3.0-i2i">doubao-seededit-3.0-i2i</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="relative w-20">
                <select
                  value={videoLength}
                  onChange={(e) => onVideoLengthChange?.(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
                >
                  <option value="1s">1s</option>
                  <option value="2s">2s</option>
                  <option value="3s">3s</option>
                  <option value="4s">4s</option>
                  <option value="5s">5s</option>
                  <option value="6s">6s</option>
                  <option value="7s">7s</option>
                  <option value="8s">8s</option>
                  <option value="9s">9s</option>
                  <option value="10s">10s</option>
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
            <div className="mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
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
              {isGenerating ? t('shortplayEntry.generation.generating') : t('shortplayEntry.generation.oneClickGenerate')}
            </button>
          </div>
        </>
      )}

      {activeTab === 'video' && (
        <>
          <div className="mb-3">
            <div className="flex space-x-2">
              <div className="relative w-32">
                <select
                  value={selectedModel}
                  onChange={(e) => onModelChange(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
                >
                  <option value="gemini-2.5pro">Gemini2.5pro</option>
                  <option value="deepseek-r1">DeepSeek-R1</option>
                  <option value="gpt-4">GPT-4</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="relative w-24">
                <select
                  value={videoLength}
                  onChange={(e) => onVideoLengthChange?.(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
                >
                  <option value="2s">{t('shortplayEntry.video.duration2s')}</option>
                  <option value="5s">{t('shortplayEntry.video.duration5s')}</option>
                  <option value="10s">{t('shortplayEntry.video.duration10s')}</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="relative w-24">
                <select
                  value={resolution}
                  onChange={(e) => onResolutionChange?.(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
                >
                  <option value="1080p">{t('shortplayEntry.video.resolution1080p')}</option>
                  <option value="720p">{t('shortplayEntry.video.resolution720p')}</option>
                  <option value="4K">{t('shortplayEntry.video.resolution4k')}</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="relative w-24">
                <select
                  value={singleGenerate ? "single" : "batch"}
                  onChange={(e) => onSingleGenerateChange?.(e.target.value === "single")}
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-lg bg-white focus:outline-none appearance-none text-black/50"
                >
                  <option value="batch">{t('shortplayEntry.video.batchMode')}</option>
                  <option value="single">{t('shortplayEntry.video.singleMode')}</option>
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
            <div className="mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-blue-700">{generationStatus}</span>
              </div>
            </div>
          )}

          <div className="relative">
            <textarea
              value={userInput}
              onChange={(e) => onInputChange(e.target.value)}
              className="w-full h-12 py-2 pl-12 pr-24 text-xs rounded-lg bg-white focus:outline-none resize-none overflow-y-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', border: '1px solid rgba(116, 116, 116, 0.41)' }}
              placeholder={finalPlaceholder}
              disabled={isGenerating}
            />
            <label className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 ${
              activeTab === 'video' ? '' : 'hidden'
            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`} title={isUploading && uploadProgress.total > 0 ? `上传进度: ${uploadProgress.current}/${uploadProgress.total}` : '上传图片'}>
              {isUploading ? (
                <div className="relative w-4 h-4">
                  <Icon icon="ri:loader-4-line" className="w-4 h-4 text-gray-400 animate-spin" />
                  {uploadProgress.total > 1 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center" style={{ fontSize: '6px' }}>
                      {uploadProgress.current}
                    </div>
                  )}
                </div>
              ) : (
                <Icon icon="ri:image-line" className="w-4 h-4 text-gray-400" />
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={isUploading}
                onChange={async (e) => {
                  console.log('文件选择事件触发');
                  const files = Array.from(e.target.files || []);
                  console.log('选择的文件:', files);
                  console.log('当前上传状态:', isUploading);
                  console.log('onMultipleFileUpload 函数:', onMultipleFileUpload);

                  if (files.length > 0 && !isUploading) {
                    console.log('开始上传文件:', files.map(f => f.name));

                    // 使用批量上传处理
                    if (onMultipleFileUpload) {
                      console.log('调用批量上传函数');
                      await onMultipleFileUpload(files);
                    } else {
                      console.log('批量上传函数不存在');
                    }

                    // 重置input的value，允许重复选择相同文件
                    e.target.value = '';
                  } else {
                    console.log('跳过上传，原因:', {
                      filesLength: files.length,
                      isUploading
                    });
                  }
                }}
              />
            </label>
            <button
              onClick={onGenerate}
              disabled={isGenerating || !userInput.trim()}
              className={`absolute bottom-2 right-2 px-3 py-1 text-white text-xs font-medium rounded transition-colors ${
                isGenerating || !userInput.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isGenerating ? t('shortplayEntry.generation.generating') : t('shortplayEntry.generation.oneClickGenerate')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
