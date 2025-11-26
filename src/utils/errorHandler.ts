/**
 * 统一错误处理工具
 * 基于后端错误码规范: error_codes_for_frontend.md
 */

import toast from 'react-hot-toast';
import { message } from 'antd';

/**
 * 后端统一响应格式
 */
export interface BackendResponse<T = any> {
  code: number;          // HTTP状态码 (200成功, 4xx客户端错误, 5xx服务器错误)
  message: string;       // 错误提示信息 (可直接展示给用户)
  data: T | null;        // 响应数据
  errorCode: string | null;  // 业务错误码 (如 AUTH_301, BILLING_401)
}

/**
 * 错误码枚举
 */
export const ErrorCode = {
  // 认证授权错误 (HTTP 401/403)
  AUTH_NOT_LOGGED_IN: 'AUTH_301',           // 用户未登录
  AUTH_TOKEN_EXPIRED: 'AUTH_302',           // 登录已过期
  AUTH_TOKEN_INVALID: 'AUTH_303',           // 登录凭证无效
  AUTH_PERMISSION_DENIED: 'AUTH_304',       // 权限不足
  AUTH_RESOURCE_FORBIDDEN: 'AUTH_305',      // 无权操作他人资源

  // 积分/余额不足 (HTTP 402)
  BILLING_INSUFFICIENT_POINTS: 'BILLING_401',  // 积分不足
  BILLING_CREDIT_ERROR: 'BILLING_402',         // 生成失败:CreditInsufficient

  // 参数校验错误 (HTTP 400)
  COMMON_PARAM_REQUIRED: 'COMMON_101',       // 参数不能为空
  COMMON_PARAM_FORMAT: 'COMMON_102',         // 参数格式错误
  COMMON_PARAM_RANGE: 'COMMON_103',          // 参数值超出范围

  // 资源不存在 (HTTP 404)
  SCRIPT_NOT_FOUND: 'SCRIPT_201',           // 脚本不存在
  SCENE_NOT_FOUND: 'SCENE_201',             // 场景不存在
  STORYBOARD_NOT_FOUND: 'STORYBOARD_201',   // 分镜不存在
  FILE_NOT_FOUND: 'FILE_201',               // 文件不存在
  EPISODE_NOT_FOUND: 'EPISODE_201',         // 剧集不存在
  SERIES_NOT_FOUND: 'SERIES_201',           // 系列不存在
  USER_NOT_FOUND: 'USER_201',               // 用户不存在

  // AI生成错误
  AI_IMAGE_FAILED: 'AI_401',                // 图片生成失败
  AI_VIDEO_FAILED: 'AI_402',                // 视频生成失败
  AI_AUDIO_FAILED: 'AI_403',                // 音频生成失败
  AI_RATE_LIMIT: 'AI_404',                  // 生成请求过于频繁

  // 外部服务错误 (HTTP 503)
  LLM_UNAVAILABLE: 'LLM_501',               // LLM服务不可用
  LLM_TIMEOUT: 'LLM_502',                   // LLM服务超时
  STORAGE_UNAVAILABLE: 'STORAGE_501',       // 存储服务不可用
  STORAGE_UPLOAD_FAILED: 'STORAGE_502',     // 文件上传失败
  STORAGE_DOWNLOAD_FAILED: 'STORAGE_503',   // 文件下载失败

  // 系统错误 (HTTP 500)
  SYSTEM_ERROR: 'SYSTEM_901',               // 系统内部错误
  DB_ERROR: 'DB_701',                       // 数据库错误
  CONFIG_ERROR: 'CONFIG_801',               // 配置错误
} as const;

/**
 * 错误处理配置
 */
interface ErrorHandlerConfig {
  showToast?: boolean;              // 是否显示toast提示
  showMessage?: boolean;            // 是否显示antd message
  onAuthError?: () => void;         // 认证错误回调
  onBillingError?: (msg: string) => void;  // 积分不足回调
  onRateLimit?: () => void;         // 限流回调
  onRetry?: () => void;             // 重试回调
}

/**
 * 统一错误处理器
 */
export class ErrorHandler {
  private config: ErrorHandlerConfig;

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      showToast: true,
      showMessage: false,
      ...config
    };
  }

  /**
   * 处理错误响应
   */
  handleError(response: BackendResponse<any>): void {
    const { code, message: msg, errorCode } = response;

    // 根据 errorCode 做特殊处理
    if (errorCode) {
      this.handleByErrorCode(errorCode, msg, code);
    } else {
      // 没有 errorCode，按 HTTP 状态码处理
      this.handleByHttpCode(code, msg);
    }
  }

  /**
   * 根据业务错误码处理
   */
  private handleByErrorCode(errorCode: string, message: string, httpCode: number): void {
    console.error(`🔴 [ErrorHandler] errorCode: ${errorCode}, message: ${message}, httpCode: ${httpCode}`);

    switch (errorCode) {
      // ========== 认证授权错误 ==========
      case ErrorCode.AUTH_NOT_LOGGED_IN:
      case ErrorCode.AUTH_TOKEN_EXPIRED:
      case ErrorCode.AUTH_TOKEN_INVALID:
        this.handleAuthError(message);
        break;

      case ErrorCode.AUTH_PERMISSION_DENIED:
      case ErrorCode.AUTH_RESOURCE_FORBIDDEN:
        this.handlePermissionError(message);
        break;

      // ========== 积分不足 ==========
      case ErrorCode.BILLING_INSUFFICIENT_POINTS:
      case ErrorCode.BILLING_CREDIT_ERROR:
        this.handleBillingError(message);
        break;

      // ========== AI限流 ==========
      case ErrorCode.AI_RATE_LIMIT:
        this.handleRateLimitError(message);
        break;

      // ========== 资源不存在 ==========
      case ErrorCode.SCRIPT_NOT_FOUND:
      case ErrorCode.SCENE_NOT_FOUND:
      case ErrorCode.STORYBOARD_NOT_FOUND:
      case ErrorCode.FILE_NOT_FOUND:
      case ErrorCode.EPISODE_NOT_FOUND:
      case ErrorCode.SERIES_NOT_FOUND:
      case ErrorCode.USER_NOT_FOUND:
        this.handleResourceNotFound(message);
        break;

      // ========== 外部服务错误 ==========
      case ErrorCode.LLM_UNAVAILABLE:
      case ErrorCode.LLM_TIMEOUT:
      case ErrorCode.STORAGE_UNAVAILABLE:
      case ErrorCode.STORAGE_UPLOAD_FAILED:
      case ErrorCode.STORAGE_DOWNLOAD_FAILED:
        this.handleServiceError(message, errorCode);
        break;

      // ========== 系统错误 ==========
      case ErrorCode.SYSTEM_ERROR:
      case ErrorCode.DB_ERROR:
      case ErrorCode.CONFIG_ERROR:
        this.handleSystemError(message);
        break;

      // ========== 其他错误 ==========
      default:
        this.handleDefaultError(message, errorCode);
    }
  }

  /**
   * 根据HTTP状态码处理（没有errorCode时）
   */
  private handleByHttpCode(code: number, message: string): void {
    console.warn(`⚠️ [ErrorHandler] HTTP ${code}: ${message} (无errorCode)`);

    switch (code) {
      case 401:
        this.handleAuthError(message);
        break;
      case 403:
        this.handlePermissionError(message);
        break;
      case 402:
        this.handleBillingError(message);
        break;
      case 404:
        this.handleResourceNotFound(message);
        break;
      case 429:
        this.handleRateLimitError(message);
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        this.handleServiceError(message, null);
        break;
      default:
        this.handleDefaultError(message, null);
    }
  }

  /**
   * 处理认证错误 (AUTH_301, AUTH_302, AUTH_303)
   */
  private handleAuthError(message: string): void {
    if (this.config.showMessage) {
      toast.error(message || '登录已过期，请重新登录');
    }

    // 调用认证错误回调
    if (this.config.onAuthError) {
      this.config.onAuthError();
    }
  }

  /**
   * 处理权限错误 (AUTH_304, AUTH_305)
   */
  private handlePermissionError(message: string): void {
    if (this.config.showToast) {
      toast.error(message || '权限不足，无法访问此资源');
    }
  }

  /**
   * 处理积分不足 (BILLING_401, BILLING_402)
   */
  private handleBillingError(message: string): void {
    if (this.config.showToast) {
      toast.error(message, {
        duration: 4000,
        icon: '💰',
      });
    }

    // 调用积分不足回调
    if (this.config.onBillingError) {
      this.config.onBillingError(message);
    }
  }

  /**
   * 处理限流错误 (AI_404)
   */
  private handleRateLimitError(message: string): void {
    if (this.config.showToast) {
      toast(message || '请求过于频繁，请稍后再试', {
        icon: '⏰',
        duration: 3000,
      });
    }

    // 调用限流回调
    if (this.config.onRateLimit) {
      this.config.onRateLimit();
    }
  }

  /**
   * 处理资源不存在
   */
  private handleResourceNotFound(message: string): void {
    if (this.config.showToast) {
      toast.error(message || '资源不存在');
    }
  }

  /**
   * 处理外部服务错误
   */
  private handleServiceError(message: string, errorCode: string | null): void {
    // 判断是否可重试
    const canRetry = errorCode?.endsWith('_501') || errorCode?.endsWith('_502');

    if (this.config.showToast) {
      toast.error(message + (canRetry ? ' (建议稍后重试)' : ''), {
        duration: 4000,
      });
    }

    // 如果可重试，调用重试回调
    if (canRetry && this.config.onRetry) {
      this.config.onRetry();
    }
  }

  /**
   * 处理系统错误
   */
  private handleSystemError(message: string): void {
    if (this.config.showToast) {
      toast.error(message || '系统错误，请联系管理员', {
        duration: 5000,
      });
    }
  }

  /**
   * 默认错误处理
   */
  private handleDefaultError(message: string, errorCode: string | null): void {
    console.error(`🔴 [ErrorHandler] 未处理的错误码: ${errorCode}, 消息: ${message}`);

    if (this.config.showToast) {
      toast.error(message || '操作失败，请稍后重试');
    }
  }
}

/**
 * 创建默认错误处理器实例
 */
export const defaultErrorHandler = new ErrorHandler({
  showToast: true,
  showMessage: false,
});

/**
 * 便捷方法：处理错误
 */
export function handleError(
  response: BackendResponse<any>,
  config?: ErrorHandlerConfig
): void {
  const handler = config ? new ErrorHandler(config) : defaultErrorHandler;
  handler.handleError(response);
}

/**
 * 便捷方法：检查是否为认证错误
 */
export function isAuthError(errorCode: string | null): boolean {
  if (!errorCode) return false;
  return [
    ErrorCode.AUTH_NOT_LOGGED_IN,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
  ].includes(errorCode as any);
}

/**
 * 便捷方法：检查是否为积分不足错误
 */
export function isBillingError(errorCode: string | null): boolean {
  if (!errorCode) return false;
  return [
    ErrorCode.BILLING_INSUFFICIENT_POINTS,
    ErrorCode.BILLING_CREDIT_ERROR,
  ].includes(errorCode as any);
}

/**
 * 便捷方法：检查是否需要重试
 */
export function shouldRetry(errorCode: string | null): boolean {
  if (!errorCode) return false;
  // _501 和 _502 结尾的错误码表示服务暂时不可用，可重试
  return errorCode.endsWith('_501') || errorCode.endsWith('_502');
}
