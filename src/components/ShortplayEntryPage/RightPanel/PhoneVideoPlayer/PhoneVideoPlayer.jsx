import React from 'react'
import { PhoneFrame } from './PhoneFrame'
import { VideoPlayer } from './VideoPlayer'
import './styles/PhoneVideoPlayer.css'

/**
 * PhoneVideoPlayer Component
 *
 * A complete mobile video player solution that combines PhoneFrame and VideoPlayer.
 * Displays video content within a realistic iPhone frame mockup.
 *
 * @param {Object} props - All VideoPlayer props plus additional options
 * @param {string} props.src - Video source URL (required)
 * @param {string} props.poster - Poster image URL
 * @param {string} props.subtitle - Subtitle or overlay text
 * @param {string} props.title - Video title
 * @param {function} props.onPlay - Callback when video plays
 * @param {function} props.onPause - Callback when video pauses
 * @param {function} props.onEnded - Callback when video ends
 * @param {boolean} props.autoplay - Auto play on mount (default: false)
 * @param {boolean} props.showControls - Show play/pause button (default: true)
 * @param {boolean} props.loop - Loop video playback (default: false)
 * @param {boolean} props.muted - Mute the video (autoplay 常需要静音)
 * @param {boolean} props.playsInline - iOS/Safari 内联播放，避免强制全屏（默认 true）
 * @param {string} props.variant - Phone model: 'iphone14' (default)
 * @param {string} props.className - Additional CSS classes for wrapper
 * @param {boolean} props.showBottomBar - 是否显示底部装饰条（默认 true）
 * @param {Array<string>} props.bottomBarLabels - 默认底部栏的文案（用于快速本地化，默认 ['叙梦','我的']）
 * @param {number} props.bottomBarActiveIndex - 默认底部栏激活项索引（默认 0）
 * @param {function} props.renderBottomBar - render prop，自定义渲染底部栏（主题化/国际化）。
 *   形如：({ DefaultBottomBar, labels, activeIndex }) => ReactNode
 * @param {boolean} props.edgeToEdge - 是否启用全屏贴边（充满屏幕、刘海与 Home 指示器覆盖在上方，默认 true）
 * @param {boolean} props.showNotch - 是否显示刘海/动态岛（默认 false）
 * @param {('below'|'overlay')} props.bottomBarPosition - 底部栏位置：
 *   'below'（在视频下面，默认），'overlay'（悬浮覆盖在视频上方）
 * @param {('glass'|'icon')} props.playButtonVariant - 播放按钮样式切换（默认 'glass'）
 * @param {string} props.progressPlayedColor - 进度条“已播放”颜色（CSS 颜色字符串）
 * @param {string} props.progressBufferedColor - 进度条“已缓冲未播放”颜色（CSS 颜色字符串）
 * @param {string} props.progressTrackColor - 进度条“未播放轨道”颜色（CSS 颜色字符串）
 * @param {string} props.progressThumbWidth - 进度条拇指宽度（CSS 长度，如 '6px'）
 * @param {string} props.progressThumbHeight - 进度条拇指高度（CSS 长度，如 '20px'）
 * @param {string} props.progressThumbRadius - 进度条拇指圆角（CSS 长度或百分比，如 '3px' 或 '50%'）
 *
 * @example
 * <PhoneVideoPlayer
 *   src="/music.mp4"
 *   subtitle="她前夫要是看到这个场景"
 *   title="Scene Description"
 * />
 */
export function PhoneVideoPlayer({
  src,
  poster,
  subtitle,
  title,
  onPlay,
  onPause,
  onEnded,
  autoplay = false,
  showControls = true,
  loop = false,
  muted = false,
  playsInline = true,
  variant = 'iphone14',
  className = '',
  showBottomBar = true,
  bottomBarLabels = ['叙梦', '我的'],
  bottomBarActiveIndex = 0,
  renderBottomBar,
  edgeToEdge = true,
  showNotch = false,
  bottomBarPosition = 'below',
  playButtonVariant = 'glass',
  progressPlayedColor,
  progressBufferedColor,
  progressTrackColor,
  progressThumbWidth,
  progressThumbHeight,
  progressThumbRadius,

}) {
  // 默认底部栏（保留现有样式，支持自定义文案与激活态）
  const DefaultBottomBar = ({ labels = bottomBarLabels, activeIndex = bottomBarActiveIndex }) => (
    <div className="phone-video-bottom-bar" aria-hidden="true">
      {labels.map((label, idx) => (
        <span
          key={idx}
          className={`phone-video-bottom-label ${idx === activeIndex ? 'active' : ''}`}
        >
          {label}
        </span>
      ))}
    </div>
  )

  return (
    <div
      className={`phone-video-player ${edgeToEdge ? 'edge-to-edge' : ''} ${
        bottomBarPosition === 'overlay' ? 'bar-overlay' : 'bar-below'
      } ${className}`}
    >
      <PhoneFrame variant={variant} showNotch={showNotch}>
        <div className="phone-video-inner">
          {src ? (
            <VideoPlayer
              src={src}
              poster={poster}
              subtitle={subtitle}
              title={title}
              onPlay={onPlay}
              onPause={onPause}
              onEnded={onEnded}
              autoplay={autoplay}
              showControls={showControls}
              loop={loop}
              muted={muted}
              playsInline={playsInline}
              playButtonVariant={playButtonVariant}
              progressPlayedColor={progressPlayedColor}
              progressBufferedColor={progressBufferedColor}
              progressTrackColor={progressTrackColor}
              progressThumbWidth={progressThumbWidth}
              progressThumbHeight={progressThumbHeight}
              progressThumbRadius={progressThumbRadius}
              className="phone-video-player-core"
            />
          ) : (
            // 简单占位，防止未传 src 时出现空白
            <div className="phone-video-player-core" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)'
            }}>
              未提供视频地址
            </div>
          )}
          {showBottomBar && (
            renderBottomBar ? (
              renderBottomBar({
                DefaultBottomBar,
                labels: bottomBarLabels,
                activeIndex: bottomBarActiveIndex,
              })
            ) : (
              <DefaultBottomBar />
            )
          )}
        </div>
      </PhoneFrame>
    </div>
  )
}

export default PhoneVideoPlayer

