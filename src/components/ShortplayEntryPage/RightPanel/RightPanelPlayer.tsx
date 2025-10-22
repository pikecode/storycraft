import React from 'react';
import { Icon } from '@iconify/react';

export interface RightPanelPlayerProps {
  videoSrc: string;
  hasVideo: boolean;
  isPlaying: boolean;
  isLoading?: boolean;
  showProgress?: boolean;
  progress: number;
  timeDisplay: string;
  totalTimeDisplay: string;
  lastFrameImage?: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
  onTogglePlay: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onLoadedMetadata?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
  onProgressMouseDown: () => void;
  onProgressMouseUp: () => void;
  onProgressTouchStart: () => void;
  onProgressTouchEnd: () => void;
  onProgressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// 右侧预览中的视频播放组件（可替换）
// 职责：渲染视频/最后一帧图片、播放按钮、进度条与加载态。
// 注意：不包含“插入选项”的编辑蒙层，便于作为可拔插播放器。
export const RightPanelPlayer: React.FC<RightPanelPlayerProps> = ({
  videoSrc,
  hasVideo,
  isPlaying,
  isLoading,
  showProgress,
  progress,
  timeDisplay,
  totalTimeDisplay,
  lastFrameImage,
  videoRef,
  onTogglePlay,
  onTimeUpdate,
  onLoadedMetadata,
  onProgressMouseDown,
  onProgressMouseUp,
  onProgressTouchStart,
  onProgressTouchEnd,
  onProgressChange,
}) => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {hasVideo ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover"
          onClick={onTogglePlay}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (onTimeUpdate && v) {
              onTimeUpdate(v.currentTime || 0, v.duration || 0);
            }
          }}
          onLoadedMetadata={onLoadedMetadata}
        />
      ) : lastFrameImage ? (
        <img src={lastFrameImage} alt="最后一帧" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-black" />
      )}

      {/* 加载中覆盖层 */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
          <div className="flex flex-col items-center">
            <Icon icon="ri:loader-4-line" className="w-8 h-8 text-white animate-spin mb-2" />
            <div className="text-white text-sm">生成中…</div>
          </div>
        </div>
      )}

      {/* 播放控制按钮 */}
      {hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <button
            onClick={onTogglePlay}
            className="bg-black/50 text-white rounded-full p-4 hover:bg-black/70 transition-all transform hover:scale-110"
          >
            <Icon icon={isPlaying ? 'ri:pause-fill' : 'ri:play-fill'} className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* 进度条 - 编辑模式下父组件可通过 showProgress 控制隐藏 */}
      {hasVideo && showProgress && (
        <div className="absolute bottom-12 left-4 right-4 z-10">
          <div className="time-display mb-2">
            <span className="current-time">{timeDisplay}</span>
            <span className="separator">/</span>
            <span className="duration">{totalTimeDisplay}</span>
          </div>
          <div
            data-progress-bar
            onMouseDown={onProgressMouseDown}
            onMouseUp={onProgressMouseUp}
            onTouchStart={onProgressTouchStart}
            onTouchEnd={onProgressTouchEnd}
          >
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            <input
              type="range"
              className="progress-slider"
              min="0"
              max="100"
              value={progress}
              onChange={onProgressChange}
              onMouseDown={onProgressMouseDown}
              onTouchStart={onProgressTouchStart}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RightPanelPlayer;

