/**
 * useVideoManagement Hook
 * 视频生成和管理相关的状态和逻辑
 */

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { ChatHistoryItem, UploadedImage } from '../types/shortplay';
import * as shortplayService from '../services/shortplayService';
import { extractFilesFromChatHistory } from '../utils/shortplayUtils';

export const useVideoManagement = () => {
  // 视频聊天记录数据
  const [videoChatHistory, setVideoChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoadingVideoHistory, setIsLoadingVideoHistory] = useState(false);

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [videoGenerationFileId, setVideoGenerationFileId] = useState<string | null>(null);

  // 文件上传
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  /**
   * 加载视频聊天记录
   */
  const loadVideoChatHistory = useCallback(async (sceneId: number) => {
    if (!sceneId) {
      console.log('No scene selected, skipping video chat history load');
      setIsLoadingVideoHistory(false);
      return;
    }

    setIsLoadingVideoHistory(true);
    try {
      const result = await shortplayService.queryChatHistory({
        sceneId: sceneId.toString(),
        chatScene: 'VIDEO',
        type: 'AI_ANSWER',
        pageNum: 1,
        pageSize: 24
      });

      if (result.code === 0 && result.data) {
        setVideoChatHistory(result.data.records || result.data || []);
      } else {
        console.log('LoadVideoChatHistory - API returned error:', result);
        setVideoChatHistory([]);
      }
    } catch (error) {
      console.error('加载视频聊天记录失败:', error);
      setVideoChatHistory([]);
      toast.error('加载视频记录失败');
    } finally {
      setIsLoadingVideoHistory(false);
    }
  }, []);

  /**
   * 上传单个文件
   */
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const result = await shortplayService.uploadFile(file);

      if (result.code === 0 && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || '文件上传失败');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      throw error;
    }
  }, []);

  /**
   * 批量上传文件
   */
  const handleMultipleFileUpload = useCallback(async (files: File[]) => {
    if (!files.length || isUploading) {
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    const results: Array<{ file: File; success: boolean; data?: any; error?: string }> = [];
    const successfulUploads: UploadedImage[] = [];

    try {
      toast(`开始上传 ${files.length} 个文件`, { icon: '📤' });

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress({ current: i + 1, total: files.length });

        try {
          const data = await handleFileUpload(file);
          results.push({ file, success: true, data });

          if (data && data.fileId && data.fileUrl) {
            successfulUploads.push({
              fileId: data.fileId,
              fileUrl: data.fileUrl,
              fileName: data.fileName || file.name
            });
          }

          toast.success(`${file.name} 上传成功 (${i + 1}/${files.length})`);
        } catch (error) {
          const errorMessage = (error as Error).message;
          results.push({ file, success: false, error: errorMessage });
          toast.error(`${file.name} 上传失败: ${errorMessage}`);
        }
      }

      // 更新上传成功的图片列表
      if (successfulUploads.length > 0) {
        setUploadedImages(prev => [...prev, ...successfulUploads]);
      }

      // 统计结果
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0 && failCount === 0) {
        toast.success(`所有文件上传成功！(${successCount}个)`);
      } else if (successCount > 0 && failCount > 0) {
        toast(`部分文件上传成功：${successCount}个成功，${failCount}个失败`, {
          icon: '⚠️',
          duration: 4000
        });
      } else {
        toast.error(`所有文件上传失败！(${failCount}个)`);
      }

      return results;
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  }, [isUploading, handleFileUpload]);

  /**
   * 轮询视频生成进度
   */
  const pollVideoProgress = useCallback(async (fileId: string, sceneId: number) => {
    const maxPolls = 60; // 最多轮询60次 (5分钟)
    let pollCount = 0;

    const poll = async (): Promise<void> => {
      try {
        pollCount++;
        console.log(`轮询视频进度，第 ${pollCount} 次`, fileId);

        const result = await shortplayService.getVideoProgress(parseInt(fileId));

        if (result.code === 0 && result.data) {
          const { status, playUrl, errorMessage } = result.data;

          if (status === 'COMPLETED') {
            setGenerationStatus('视频生成完成！');
            toast.success('视频生成成功！');

            if (playUrl) {
              console.log('视频播放地址:', playUrl);
            }

            // 视频生成完成后刷新视频聊天记录列表
            await loadVideoChatHistory(sceneId);

            setIsGenerating(false);
            setVideoGenerationFileId(null);
            return;
          } else if (status === 'FAILED' || errorMessage) {
            throw new Error(errorMessage || '视频生成失败');
          } else {
            // 继续轮询
            setGenerationStatus(`视频生成中... (${pollCount}/${maxPolls})`);

            if (pollCount < maxPolls) {
              setTimeout(() => poll(), 5000); // 5秒后继续轮询
            } else {
              throw new Error('视频生成超时');
            }
          }
        } else {
          throw new Error(result.message || '进度查询失败');
        }
      } catch (error) {
        console.error('轮询进度失败:', error);
        toast.error('视频生成失败：' + (error as Error).message);
        setIsGenerating(false);
        setVideoGenerationFileId(null);
        setGenerationStatus('');
      }
    };

    // 开始第一次轮询
    setTimeout(() => poll(), 2000); // 2秒后开始轮询
  }, [loadVideoChatHistory]);

  /**
   * 生成视频
   */
  const handleVideoGenerate = useCallback(async (sceneId: number, userInput: string) => {
    if (!userInput.trim()) {
      toast.error('请输入生成内容');
      return false;
    }

    if (!sceneId) {
      toast.error('请先选择场次');
      return false;
    }

    setIsGenerating(true);
    setGenerationStatus('正在生成视频...');

    try {
      const requestBody = {
        sceneId: sceneId.toString(),
        llmName: '',
        userMessage: userInput.trim(),
        useImageGeneration: uploadedImages.length > 0,
        images: uploadedImages.map(img => img.fileId)
      };

      const result = await shortplayService.generateVideo(requestBody);

      if (result.code === 0 && result.data) {
        const fileId = result.data.toString();
        setVideoGenerationFileId(fileId);

        toast.success('视频生成任务已开始！');
        setGenerationStatus('视频生成中，请稍候...');

        // 开始轮询进度
        await pollVideoProgress(fileId, sceneId);
        return true;
      } else {
        throw new Error(result.message || '视频生成失败');
      }
    } catch (error) {
      console.error('视频生成失败:', error);
      toast.error('视频生成失败：' + (error as Error).message);
      setGenerationStatus('');
      setIsGenerating(false);
      return false;
    }
  }, [uploadedImages, pollVideoProgress]);

  /**
   * 从聊天记录中提取视频文件列表
   */
  const getVideoFiles = useCallback(() => {
    return extractFilesFromChatHistory(videoChatHistory, 'VIDEO');
  }, [videoChatHistory]);

  /**
   * 清空已上传的图片
   */
  const clearUploadedImages = useCallback(() => {
    setUploadedImages([]);
  }, []);

  return {
    // 状态
    videoChatHistory,
    isLoadingVideoHistory,
    isGenerating,
    generationStatus,
    videoGenerationFileId,
    uploadedImages,
    isUploading,
    uploadProgress,

    // Setters
    setVideoChatHistory,
    setIsGenerating,
    setGenerationStatus,
    setUploadedImages,

    // 方法
    loadVideoChatHistory,
    handleFileUpload,
    handleMultipleFileUpload,
    handleVideoGenerate,
    getVideoFiles,
    clearUploadedImages
  };
};
