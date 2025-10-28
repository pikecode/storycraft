# PhoneVideoPlayer (One-Folder Pack)

可直接整体拷贝到其他项目使用的“手机内视频播放器”组件包。

## 目录结构
- index.js（入口导出）
- PhoneVideoPlayer.jsx（最终封装组件）
- PhoneFrame.jsx（手机框体）
- VideoPlayer.jsx（播放内核）
- styles/
  - PhoneVideoPlayer.css
  - PhoneFrame.css
  - VideoPlayer.css

## 快速使用
```
import PhoneVideoPlayer from '@/components/PhoneVideoPlayer'

export default function Demo() {
  return (
    <PhoneVideoPlayer
      src="/your-video.mp4"
      edgeToEdge
      bottomBarPosition="below"  // or 'overlay'
      showNotch={false}
      showBottomBar
      playButtonVariant="glass"   // or 'icon'
      // 进度条颜色（可选）
      progressPlayedColor="#fff"
      progressBufferedColor="rgba(255,255,255,0.38)"
      progressTrackColor="rgba(255,255,255,0.14)"
      // 拇指（拖动条）形状（竖形窄条）
      progressThumbWidth="6px"
      progressThumbHeight="20px"
      progressThumbRadius="3px"
    />
  )
}
```

## 关键 Props
- 通用播放：`src` `poster` `autoplay` `loop` `muted` `playsInline` `showControls` `onPlay/onPause/onEnded`
- 外观与布局：`edgeToEdge` `showNotch` `bottomBarPosition='below'|'overlay'` `showBottomBar`
- 底部栏自定义：`bottomBarLabels` `bottomBarActiveIndex` `renderBottomBar={({ DefaultBottomBar, labels, activeIndex }) => ...}`
- 播放按钮样式：`playButtonVariant='glass'|'icon'`
- 进度条样式：
  - 颜色：`progressPlayedColor` `progressBufferedColor` `progressTrackColor`
  - 拇指（拖动条）：`progressThumbWidth` `progressThumbHeight` `progressThumbRadius`

## 兼容性与说明
- iOS/Safari 建议：`playsInline` 避免强制全屏；`autoplay` 多数场景需要静音（已自动静音）。
- Next.js：若限制组件内导入 CSS，请在全局入口引入 `styles/*.css`（或改造成 CSS Modules）。
- 无第三方依赖，仅依赖 React。

## 更新与维护
此文件夹可作为 npm 包源码的基础目录；如需多项目复用，建议升级为工作区包或独立包。
