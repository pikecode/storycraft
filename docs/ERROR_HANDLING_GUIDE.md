# 错误处理使用指南

> 基于后端错误码规范优化的前端错误处理机制

## 📋 目录

1. [概述](#概述)
2. [后端响应格式](#后端响应格式)
3. [错误处理工具](#错误处理工具)
4. [使用示例](#使用示例)
5. [特殊场景处理](#特殊场景处理)
6. [迁移指南](#迁移指南)

---

## 概述

项目已升级错误处理机制，支持后端新的错误码规范：

- **新格式**: `{ code, message, data, errorCode }`
- **旧格式**: `{ code, message, data }` (仍然兼容)

### 核心优势

✅ **智能识别**: 自动检测新/旧格式，无需修改现有代码
✅ **详细错误码**: 支持 `errorCode` (如 `AUTH_301`, `BILLING_401`)
✅ **特殊场景**: 自动处理认证、积分不足、限流等场景
✅ **向后兼容**: 完全兼容旧的错误处理逻辑

---

## 后端响应格式

### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": { "userId": 123, "name": "张三" },
  "errorCode": null
}
```

### 错误响应

```json
{
  "code": 401,
  "message": "用户未登录,请先登录",
  "data": null,
  "errorCode": "AUTH_301"
}
```

### 常见错误码

| errorCode | 说明 | 前端处理 |
|-----------|------|---------|
| `AUTH_301` | 用户未登录 | 跳转登录页 |
| `AUTH_302` | 登录已过期 | 清除token+跳转登录 |
| `AUTH_303` | 登录凭证无效 | 清除token+跳转登录 |
| `AUTH_304` | 权限不足 | Toast提示 |
| `BILLING_401` | 积分不足 | 引导充值 |
| `AI_404` | 请求过于频繁 | 延迟重试 |
| `LLM_501` | LLM服务不可用 | Toast提示+建议重试 |

完整错误码列表请参考: `/Users/peak/Desktop/error_codes_for_frontend.md`

---

## 错误处理工具

### 1. ErrorHandler (新)

统一的错误处理器，位于 `src/utils/errorHandler.ts`

```typescript
import { ErrorHandler, handleError } from '@/utils/errorHandler';

// 方式1: 使用默认处理器
const response: BackendResponse = await api.call();
if (response.code !== 200) {
  handleError(response);
}

// 方式2: 自定义配置
const handler = new ErrorHandler({
  showToast: true,
  onAuthError: () => {
    // 自定义认证错误处理
    router.push('/login');
  },
  onBillingError: (message) => {
    // 自定义积分不足处理
    showRechargeDialog(message);
  }
});

handler.handleError(response);
```

### 2. ApiInterceptor (升级)

已升级支持新格式，自动检测并处理

```typescript
import { apiInterceptor } from '@/services/apiInterceptor';

const response = await fetch(url, options);
const result = await apiInterceptor.handleResponse(response);

// 自动识别新/旧格式
// 自动处理认证错误
// 自动显示错误提示
```

### 3. 便捷方法

```typescript
import { isAuthError, isBillingError, shouldRetry } from '@/utils/errorHandler';

// 检查是否为认证错误
if (isAuthError(errorCode)) {
  // 跳转登录
}

// 检查是否为积分不足
if (isBillingError(errorCode)) {
  // 引导充值
}

// 检查是否应该重试
if (shouldRetry(errorCode)) {
  // 延迟重试
  setTimeout(() => retry(), 5000);
}
```

---

## 使用示例

### 示例 1: Service 层 API调用

```typescript
// src/services/scriptService.ts
import { BackendResponse } from '@/utils/errorHandler';

export async function generateScript(input: string): Promise<any> {
  const response = await fetch('/storyai/series/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInput: input })
  });

  const result: BackendResponse = await response.json();

  // 检查成功
  if (result.code === 200 || result.code === 0) {
    return result.data;
  }

  // 自动错误处理 (会显示toast)
  handleError(result);
  throw new Error(result.message);
}
```

### 示例 2: Hook 中使用

```typescript
// src/hooks/useScript.ts
import { useState } from 'react';
import { handleError, ErrorCode } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

export function useScript() {
  const [loading, setLoading] = useState(false);

  const generate = async (input: string) => {
    try {
      setLoading(true);

      const response = await fetch('/api/script/generate', {
        method: 'POST',
        body: JSON.stringify({ input })
      });

      const result: BackendResponse = await response.json();

      // 成功
      if (result.code === 200 || result.code === 0) {
        toast.success('生成成功！');
        return result.data;
      }

      // 积分不足 - 特殊处理
      if (result.errorCode === ErrorCode.BILLING_INSUFFICIENT_POINTS) {
        showRechargeDialog(result.message);
        return null;
      }

      // 其他错误 - 统一处理
      handleError(result);

    } catch (error) {
      toast.error('网络错误，请检查连接');
    } finally {
      setLoading(false);
    }
  };

  return { generate, loading };
}
```

### 示例 3: 组件中使用

```typescript
// src/components/ScriptGenerator.tsx
import { ErrorHandler, ErrorCode } from '@/utils/errorHandler';

function ScriptGenerator() {
  const handleGenerate = async () => {
    const response = await fetch('/api/generate');
    const result: BackendResponse = await response.json();

    // 自定义错误处理
    const errorHandler = new ErrorHandler({
      showToast: true,
      onBillingError: (message) => {
        // 积分不足时，显示充值弹窗
        Modal.confirm({
          title: '积分不足',
          content: message,
          okText: '立即充值',
          onOk: () => router.push('/recharge')
        });
      },
      onRateLimit: () => {
        // 限流时，自动延迟重试
        setTimeout(() => handleGenerate(), 10000);
      }
    });

    if (result.code !== 200) {
      errorHandler.handleError(result);
      return;
    }

    // 处理成功...
  };

  return <button onClick={handleGenerate}>生成</button>;
}
```

---

## 特殊场景处理

### 1. 认证错误 (AUTH_301/302/303)

**自动处理**:
- ✅ 显示toast提示
- ✅ 清除认证状态
- ✅ 重定向到登录页
- ✅ 保存当前路径 (登录后返回)

**无需额外代码**，ApiInterceptor 自动处理

### 2. 积分不足 (BILLING_401)

```typescript
const errorHandler = new ErrorHandler({
  onBillingError: (message) => {
    // 提取积分信息: "积分不足,当前积分: 10, 需要: 50"
    const match = message.match(/当前积分:\s*(\d+).*需要:\s*(\d+)/);
    if (match) {
      const [, current, required] = match;
      showRechargeDialog({
        current: parseInt(current),
        required: parseInt(required),
        message
      });
    }
  }
});
```

### 3. AI限流 (AI_404)

```typescript
const errorHandler = new ErrorHandler({
  onRateLimit: () => {
    // 限流时延迟5秒重试
    toast('请求过于频繁，5秒后自动重试...', { icon: '⏰' });
    setTimeout(() => retryGeneration(), 5000);
  }
});
```

### 4. 外部服务不可用 (xxx_501/502)

```typescript
import { shouldRetry } from '@/utils/errorHandler';

const result: BackendResponse = await api.call();

if (result.errorCode && shouldRetry(result.errorCode)) {
  // 服务暂时不可用，显示重试按钮
  showRetryButton({
    message: result.message,
    onRetry: () => api.call()
  });
}
```

### 5. 资源不存在 (xxx_201)

```typescript
if (result.errorCode?.endsWith('_201')) {
  // 资源不存在，返回列表页
  toast.error(result.message);
  router.push('/list');
}
```

---

## 迁移指南

### 从旧格式迁移

**旧代码** (仍然有效):
```typescript
const data = await response.json();

if (data.code === 401) {
  toast.error('用户未登录');
  apiInterceptor.triggerUnauthorized();
  throw new Error('用户未登录');
}

if (data.code !== 0) {
  toast.error(data.message);
  throw new Error(data.message);
}
```

**新代码** (推荐):
```typescript
const result: BackendResponse = await response.json();

if (result.code !== 200 && result.code !== 0) {
  handleError(result);  // 自动处理所有错误
  throw new Error(result.message);
}
```

### 逐步迁移策略

1. **阶段1**: 保持现有代码不变 (ApiInterceptor 自动兼容)
2. **阶段2**: 新增API使用 `handleError()`
3. **阶段3**: 需要特殊处理的场景，使用 `ErrorHandler`
4. **阶段4**: 逐步替换旧代码

### 注意事项

⚠️ **不要同时处理**:
```typescript
// ❌ 错误示例 - 会导致双重提示
if (result.code !== 200) {
  toast.error(result.message);  // 第一次提示
  handleError(result);           // 第二次提示
}

// ✅ 正确示例 - 只用一个
if (result.code !== 200) {
  handleError(result);  // 只调用一次
}
```

⚠️ **认证错误无需手动处理**:
```typescript
// ❌ 不需要
if (result.errorCode === 'AUTH_301') {
  router.push('/login');  // ApiInterceptor已自动处理
}

// ✅ 正确 - 让 ApiInterceptor 自动处理
handleError(result);
```

---

## 错误码速查表

### 认证相关
- `AUTH_301` - 用户未登录 → 自动跳转登录
- `AUTH_302` - 登录已过期 → 自动跳转登录
- `AUTH_303` - 登录凭证无效 → 自动跳转登录
- `AUTH_304` - 权限不足 → Toast提示
- `AUTH_305` - 无权操作他人资源 → Toast提示

### 业务相关
- `BILLING_401` - 积分不足 → 引导充值
- `BILLING_402` - 生成失败 → 联系客服
- `AI_404` - 请求过于频繁 → 延迟重试

### 资源相关
- `SCRIPT_201` - 脚本不存在 → Toast提示
- `SCENE_201` - 场景不存在 → Toast提示
- `FILE_201` - 文件不存在 → Toast提示

### 服务相关
- `LLM_501` - LLM服务不可用 → 建议重试
- `STORAGE_502` - 文件上传失败 → 允许重新上传
- `AI_501` - AI服务不可用 → 建议重试

---

## 最佳实践

### 1. 统一使用 handleError

```typescript
// ✅ 推荐
handleError(result);

// ❌ 不推荐 - 重复造轮子
if (result.code !== 200) {
  switch (result.errorCode) {
    case 'AUTH_301': ...
    case 'BILLING_401': ...
  }
}
```

### 2. 只在必要时自定义

```typescript
// 大部分场景：使用默认处理
handleError(result);

// 特殊场景：自定义配置
const handler = new ErrorHandler({
  onBillingError: customBillingHandler,
  onRateLimit: customRateLimitHandler
});
handler.handleError(result);
```

### 3. 利用 errorCode 做业务逻辑

```typescript
// 根据errorCode做不同处理
if (result.errorCode === ErrorCode.BILLING_INSUFFICIENT_POINTS) {
  // 业务逻辑: 积分不足时禁用某些功能
  disablePremiumFeatures();
} else if (result.errorCode === ErrorCode.AI_RATE_LIMIT) {
  // 业务逻辑: 限流时显示倒计时
  showCountdown(5);
}
```

---

**文档版本**: v1.0
**最后更新**: 2024-11-26
**维护者**: StoryCraft 开发团队

如有疑问，请参考后端错误码文档: `/Users/peak/Desktop/error_codes_for_frontend.md`
