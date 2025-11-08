# Storycraft 部署方案文档

## 部署概述

本文档描述了 Storycraft 项目到 AWS EC2 服务器的完整部署流程。

## 部署环境信息

| 项目 | 值 |
|------|-----|
| **远程服务器IP** | 18.181.192.140 |
| **远程服务器用户** | ec2-user |
| **SSH密钥文件** | /Users/peak/lch.pem |
| **远程构建路径** | /home/ec2-user/build |
| **Web服务器** | Nginx |
| **项目类型** | React + Vite |

## 部署前置条件

- 本地已安装 Node.js 和 npm
- SSH 密钥文件已正确配置：`/Users/peak/lch.pem`
- 远程服务器 SSH 访问正常
- 远程服务器已安装 Nginx 且处于运行状态

## 部署步骤

### 1. 构建项目

```bash
npm run build
```

**说明：**
- 执行 TypeScript 编译：`tsc -b`
- 执行 Vite 构建：`vite build`
- 输出目录：`./build`
- 生成的文件包括：
  - `index.html` - 主页面
  - `assets/` - 打包后的 JS 和 CSS
  - 静态资源文件

### 2. 上传构建文件到服务器

```bash
scp -i /Users/peak/lch.pem -r ./build/* ec2-user@18.181.192.140:/home/ec2-user/build/
```

**说明：**
- 使用 SCP 协议上传
- 递归上传整个 build 目录下的所有文件
- 目标路径：`/home/ec2-user/build/`

### 3. 重新加载 Nginx 配置

```bash
ssh -i /Users/peak/lch.pem ec2-user@18.181.192.140 "sudo systemctl reload nginx"
```

**说明：**
- 重新加载 Nginx 配置，使新文件生效
- 不需要重启 Nginx，用户连接不会中断

## 完整部署流程（一键部署）

如果需要一次性执行所有步骤，可以运行：

```bash
npm run build && \
scp -i /Users/peak/lch.pem -r ./build/* ec2-user@18.181.192.140:/home/ec2-user/build/ && \
ssh -i /Users/peak/lch.pem ec2-user@18.181.192.140 "sudo systemctl reload nginx"
```

## 部署验证

部署完成后，可以验证：

1. **检查服务器上的文件：**
```bash
ssh -i /Users/peak/lch.pem ec2-user@18.181.192.140 "ls -lah /home/ec2-user/build/"
```

2. **检查 Nginx 状态：**
```bash
ssh -i /Users/peak/lch.pem ec2-user@18.181.192.140 "sudo systemctl status nginx"
```

3. **访问应用：**
在浏览器中访问 `http://18.181.192.140` 查看应用是否正常运行

## 部署问题排查

| 问题 | 排查方法 |
|------|--------|
| **SSH 连接失败** | 检查 SSH 密钥权限：`chmod 600 /Users/peak/lch.pem` |
| **Host key 验证失败** | 运行：`ssh-keyscan -H 18.181.192.140 >> ~/.ssh/known_hosts` |
| **Nginx 无法找到新文件** | 确认文件已上传到 `/home/ec2-user/build/` |
| **页面加载失败** | 检查 Nginx 日志：`ssh -i /Users/peak/lch.pem ec2-user@18.181.192.140 "sudo tail -f /var/log/nginx/error.log"` |

## Nginx 配置参考

确保 Nginx 配置正确指向构建目录。典型的配置示例：

```nginx
server {
    listen 80;
    server_name _;

    root /home/ec2-user/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 部署后检查项

- [ ] 构建完成，无错误信息
- [ ] 文件成功上传到服务器
- [ ] Nginx 成功重新加载
- [ ] 应用可以通过浏览器正常访问
- [ ] 页面功能正常，无 404 错误

## 自动化部署建议

未来可以考虑的自动化方案：
- 使用 GitHub Actions 自动部署
- 使用 Docker 容器化部署
- 使用 PM2 进程管理（如果后端也需要部署）
- 使用 CI/CD 流水线（如 GitLab CI、Jenkins 等）

## 相关命令速查

```bash
# 部署
npm run build
scp -i /Users/peak/lch.pem -r ./build/* ec2-user@18.181.192.140:/home/ec2-user/build/

# 验证
ssh -i /Users/peak/lch.pem ec2-user@18.181.192.140 "ls -lah /home/ec2-user/build/"

# 重新加载 Nginx
ssh -i /Users/peak/lch.pem ec2-user@18.181.192.140 "sudo systemctl reload nginx"

# 查看日志
ssh -i /Users/peak/lch.pem ec2-user@18.181.192.140 "sudo tail -f /var/log/nginx/access.log"
```

## 更新历史

| 日期 | 操作 | 说明 |
|------|------|------|
| 2025-11-05 | 首次部署 | 创建部署方案和文档 |

---

**文档版本：** 1.0
**最后更新：** 2025-11-05
**维护人员：** Claude Code
