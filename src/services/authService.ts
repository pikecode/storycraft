/**
 * 认证服务 - 使用统一的 /episode-api/storyai host
 */

const STORYAI_API_BASE = '/episode-api/storyai';

export interface LoginResponse {
  code: number;
  message: string;
  data: {
    userId: number | string;
    username: string;
    loginTime?: string;
    message?: string;
    token?: string;
  };
}

export interface RegisterResponse {
  code: number;
  message: string;
  data: {
    userId: number | string;
    username: string;
    token?: string;
  };
}

export class AuthService {
  /**
   * 用户名密码登录
   */
  static async login(username: string, password: string): Promise<LoginResponse & { token?: string }> {
    const response = await fetch(`${STORYAI_API_BASE}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data: LoginResponse = await response.json();

    if (!response.ok || data.code !== 0) {
      throw new Error(data.message || '登录失败');
    }

    // 尝试从response headers中获取token
    const authHeader = response.headers.get('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : undefined;

    // 返回包含token的响应
    return {
      ...data,
      token
    };
  }

  /**
   * 用户注册
   */
  static async register(
    username: string,
    password: string,
    confirmPassword: string
  ): Promise<RegisterResponse & { token?: string }> {
    if (password !== confirmPassword) {
      throw new Error('两次输入的密码不一致');
    }

    const response = await fetch(`${STORYAI_API_BASE}/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data: RegisterResponse = await response.json();

    if (!response.ok || data.code !== 0) {
      throw new Error(data.message || '注册失败');
    }

    // 尝试从response headers中获取token
    const authHeader = response.headers.get('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : undefined;

    // 返回包含token的响应
    return {
      ...data,
      token
    };
  }

  /**
   * 获取用户信息
   */
  static async getUserInfo(token: string) {
    const response = await fetch(`${STORYAI_API_BASE}/user/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '获取用户信息失败');
    }

    return data;
  }
}

export default AuthService;
