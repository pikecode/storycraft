/**
 * 认证服务 - 使用统一的 /episode-api/storyai host
 */

const STORYAI_API_BASE = '/episode-api/storyai';

export interface LoginResponse {
  code: number;
  message: string;
  data: {
    token: string;
    user_id: string;
    user_name: string;
    user_email?: string;
  };
}

export interface RegisterResponse {
  code: number;
  message: string;
  data: {
    token: string;
    user_id: string;
    user_name: string;
  };
}

export class AuthService {
  /**
   * 用户名密码登录
   */
  static async login(username: string, password: string): Promise<LoginResponse> {
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '登录失败');
    }

    return data;
  }

  /**
   * 用户注册
   */
  static async register(
    username: string,
    password: string,
    confirmPassword: string
  ): Promise<RegisterResponse> {
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '注册失败');
    }

    return data;
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
