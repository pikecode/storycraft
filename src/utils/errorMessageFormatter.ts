/**
 * API 错误消息格式化工具
 * 将后端返回的复杂错误信息转换为用户友好的提示
 */

/**
 * 生成场景类型
 */
export type GenerationScene = 'image' | 'video' | 'audio' | 'script' | 'scene' | 'storyboard' | 'other';

/**
 * 场景对应的友好名称
 */
const SCENE_NAMES: Record<GenerationScene, string> = {
  image: '图片',
  video: '视频',
  audio: '音频',
  script: '剧本',
  scene: '场景',
  storyboard: '分镜',
  other: '内容'
};

/**
 * 从错误信息中提取错误码
 */
function extractErrorCode(errorMessage: string): string | null {
  // 尝试从多种格式中提取错误码

  // 格式1: code='InvalidParameter'
  const match1 = errorMessage.match(/code=['"]([^'"]+)['"]/);
  if (match1) return match1[1];

  // 格式2: statusCode=400
  const match2 = errorMessage.match(/statusCode=(\d+)/);
  if (match2) return `HTTP ${match2[1]}`;

  // 格式3: 其他可能的错误码格式
  const match3 = errorMessage.match(/error[_\s]*code[:\s=]+([a-zA-Z0-9_]+)/i);
  if (match3) return match3[1];

  return null;
}

/**
 * 格式化 API 错误消息为用户友好的提示
 * @param error 错误对象或错误消息
 * @param scene 生成场景类型（可选）
 * @returns 格式化后的友好错误提示
 */
export function formatApiError(error: Error | string, scene: GenerationScene = 'other'): string {
  const errorMessage = typeof error === 'string' ? error : error.message || '未知错误';
  const sceneName = SCENE_NAMES[scene];
  const errorCode = extractErrorCode(errorMessage);

  // 1. 401 未授权错误
  if (errorMessage.includes('用户未登录') ||
      errorMessage.includes('401') ||
      errorMessage.includes('未授权')) {
    return '登录已过期，请重新登录';
  }

  // 2. 500 服务器错误或生成失败（包含嵌套的"失败"关键词）
  if (errorMessage.includes('HTTP Error: 500') ||
      errorMessage.includes('生成失败') ||
      errorMessage.includes('文生图失败') ||
      errorMessage.includes('批量生成') ||
      errorMessage.includes('单张图片生成失败') ||
      errorMessage.includes('视频生成失败') ||
      errorMessage.includes('音频生成失败') ||
      errorMessage.includes('剧本生成失败') ||
      (errorMessage.length > 50 && errorMessage.includes('失败'))) {
    return `${sceneName}生成服务暂时不可用，请稍后重试或联系运营人员处理，提示码：resource invalid`;
  }

  // 3. 网络错误
  if (errorMessage.includes('Network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('网络')) {
    return '网络连接失败，请检查网络后重试';
  }

  // 4. 超时错误
  if (errorMessage.includes('timeout') ||
      errorMessage.includes('超时')) {
    return `${sceneName}生成超时，请稍后重试`;
  }

  // 5. 参数错误（包含长的技术错误信息）
  if (errorMessage.includes('参数') ||
      errorMessage.includes('parameter') ||
      errorMessage.includes('InvalidParameter') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('BadRequest') ||
      errorMessage.includes('ArkHttpException')) {
    return '请求参数错误，请检查输入内容后重试';
  }

  // 6. 配额/限流错误
  if (errorMessage.includes('配额') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('限流') ||
      errorMessage.includes('rate limit')) {
    return '请求过于频繁，请稍后再试';
  }

  // 7. 文件相关错误
  if (errorMessage.includes('文件') ||
      errorMessage.includes('file')) {
    return '文件处理失败，请检查文件格式后重试';
  }

  // 8. 短错误信息直接显示
  if (errorMessage.length <= 50) {
    return errorMessage;
  }

  // 9. 其他长错误信息（超过50字符的都视为技术性错误，转换为友好提示）
  return `${sceneName}生成失败，请检查输入内容或稍后重试`;
}

/**
 * 判断错误是否需要重定向到登录页
 * @param error 错误对象或错误消息
 * @returns 是否需要跳转登录
 */
export function isAuthError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message || '';
  return errorMessage.includes('401') ||
         errorMessage.includes('用户未登录') ||
         errorMessage.includes('未授权');
}

/**
 * 判断错误是否可以重试
 * @param error 错误对象或错误消息
 * @returns 是否可以重试
 */
export function isRetryableError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message || '';

  // 不可重试的错误
  if (errorMessage.includes('401') ||
      errorMessage.includes('403') ||
      errorMessage.includes('参数')) {
    return false;
  }

  // 可重试的错误（网络、超时、500等）
  return errorMessage.includes('500') ||
         errorMessage.includes('Network') ||
         errorMessage.includes('timeout') ||
         errorMessage.includes('限流');
}
