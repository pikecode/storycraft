import React from 'react'
import './styles/PhoneFrame.css'

/**
 * PhoneFrame Component
 *
 * A realistic mobile phone frame mockup that displays content as if on a phone.
 * Features include:
 * - Realistic phone bezels and frame
 * - Notch (status bar area)
 * - Bottom home indicator
 * - Responsive scaling
 *
 * @param {Object} props
 * @param {ReactNode} props.children - Content to display inside phone
 * @param {string} props.variant - Phone model: 'iphone14' (default)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showNotch - 是否显示刘海/动态岛（默认 true）
 *
 * @example
 * <PhoneFrame>
 *   <VideoPlayer src="/video.mp4" />
 * </PhoneFrame>
 */
export function PhoneFrame({ children, variant = 'iphone14', className = '', showNotch = true }) {
  return (
    <div className={`phone-frame ${variant} ${className}`}>
      {/* Phone body */}
      <div className="phone-frame-outer">
        {/* Screen with bezels */}
        <div className="phone-frame-screen">
          {/* Notch */}
          {showNotch && <div className="phone-frame-notch" />}

          {/* Content area */}
          <div className="phone-frame-content">{children}</div>

          {/* Home indicator */}
          <div className="phone-frame-home-indicator" />
        </div>

        {/* Side buttons */}
        <div className="phone-frame-button phone-frame-button-top" />
        <div className="phone-frame-button phone-frame-button-middle" />
        <div className="phone-frame-button phone-frame-button-bottom" />
      </div>
    </div>
  )
}

export default PhoneFrame

