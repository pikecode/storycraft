/**
 * PhonePreview Component
 * 手机预览组件 - 显示场次内容和分镜板预览
 */

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import type { SceneContentItem, StoryboardItem } from '../../types/shortplay';

interface PhonePreviewProps {
  sceneContent: SceneContentItem[];
  storyboardItems: StoryboardItem[];
  selectedScene?: string;
}

export const PhonePreview: React.FC<PhonePreviewProps> = ({
  sceneContent,
  storyboardItems,
  selectedScene
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // 自动轮播
  useEffect(() => {
    if (!isAutoPlay || storyboardItems.length === 0) return;

    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % storyboardItems.length);
    }, 3000); // 每3秒切换一次

    return () => clearInterval(timer);
  }, [isAutoPlay, storyboardItems.length]);

  // 切换到指定图片
  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
    setIsAutoPlay(false);
  };

  // 上一张
  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + storyboardItems.length) % storyboardItems.length);
    setIsAutoPlay(false);
  };

  // 下一张
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % storyboardItems.length);
    setIsAutoPlay(false);
  };

  return (
    <div className="h-full bg-gray-100 flex items-center justify-center p-4">
      {/* 手机外框 */}
      <div className="relative w-full max-w-[340px] bg-black rounded-[40px] shadow-2xl overflow-hidden">
        {/* 刘海/摄像头 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20" />

        {/* 手机屏幕 */}
        <div className="relative bg-white rounded-[36px] m-2 h-[700px] overflow-hidden">
          {/* 状态栏 */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/10 to-transparent z-10 px-6 pt-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-900">9:41</span>
            <div className="flex items-center space-x-1">
              <Icon icon="ri:signal-wifi-fill" className="w-4 h-4 text-gray-900" />
              <Icon icon="ri:battery-fill" className="w-4 h-4 text-gray-900" />
            </div>
          </div>

          {/* 内容区域 */}
          <div className="h-full overflow-y-auto">
            {/* 分镜板轮播 */}
            {storyboardItems.length > 0 && (
              <div className="relative w-full aspect-[9/16] bg-gray-900">
                {/* 当前图片 */}
                <img
                  src={storyboardItems[currentImageIndex]?.fileUrl}
                  alt="分镜板预览"
                  className="w-full h-full object-cover"
                />

                {/* 控制按钮 */}
                <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex items-center justify-between px-4 z-10">
                  {storyboardItems.length > 1 && (
                    <>
                      <button
                        onClick={previousImage}
                        className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                      >
                        <Icon icon="ri:arrow-left-s-line" className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                      >
                        <Icon icon="ri:arrow-right-s-line" className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* 指示器 */}
                {storyboardItems.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center space-x-2 z-10">
                    {storyboardItems.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? 'bg-white w-6'
                            : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* 自动播放控制 */}
                {storyboardItems.length > 1 && (
                  <button
                    onClick={() => setIsAutoPlay(!isAutoPlay)}
                    className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
                    title={isAutoPlay ? '暂停自动播放' : '开始自动播放'}
                  >
                    <Icon
                      icon={isAutoPlay ? 'ri:pause-line' : 'ri:play-line'}
                      className="w-4 h-4"
                    />
                  </button>
                )}
              </div>
            )}

            {/* 场次内容列表 */}
            <div className="p-4 space-y-3">
              {selectedScene && (
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedScene}
                </h3>
              )}

              {sceneContent.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Icon icon="ri:file-list-3-line" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">暂无场次内容</p>
                </div>
              ) : (
                sceneContent.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-lg p-3 space-y-2"
                  >
                    {/* 内容头部 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          item.type === 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.type === 0 ? '画面' : '对话'}
                        </span>
                        {item.roleName && (
                          <span className="text-xs font-medium text-purple-600">
                            {item.roleName}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {item.startTime} - {item.endTime}
                      </span>
                    </div>

                    {/* 内容文本 */}
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 底部指示器 */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-300 rounded-full" />
        </div>
      </div>
    </div>
  );
};
