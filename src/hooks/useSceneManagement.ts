/**
 * useSceneManagement Hook
 * 场次管理相关的状态和逻辑
 */

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { SceneData, SceneContentItem } from '../../types/shortplay';
import * as shortplayService from '../../services/shortplayService';
import { generateTempId, isTempId, validateTimeLogic } from '../../utils/shortplayUtils';

export const useSceneManagement = () => {
  // 场次数据
  const [scenesData, setScenesData] = useState<SceneData[]>([]);
  const [sceneOptions, setSceneOptions] = useState<string[]>([]);
  const [selectedScene, setSelectedScene] = useState<string>('');
  const [sceneContent, setSceneContent] = useState<SceneContentItem[]>([]);

  // 编辑状态
  const [editingSceneItemId, setEditingSceneItemId] = useState<number | null>(null);
  const [editingSceneContent, setEditingSceneContent] = useState<string>('');
  const [editingSceneType, setEditingSceneType] = useState<number>(0);
  const [editingSceneRoleName, setEditingSceneRoleName] = useState<string>('');
  const [editingSceneStartMinutes, setEditingSceneStartMinutes] = useState<string>('');
  const [editingSceneStartSeconds, setEditingSceneStartSeconds] = useState<string>('');
  const [editingSceneEndMinutes, setEditingSceneEndMinutes] = useState<string>('');
  const [editingSceneEndSeconds, setEditingSceneEndSeconds] = useState<string>('');

  // 删除确认
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  /**
   * 加载场次内容
   */
  const loadSceneContent = useCallback(async (sceneId: number) => {
    try {
      const result = await shortplayService.getSceneContent(sceneId);
      if (result.code === 0 && result.data) {
        setSceneContent(result.data);
      }
    } catch (error) {
      console.error('加载场次内容失败:', error);
      toast.error('加载场次内容失败');
    }
  }, []);

  /**
   * 更新场次名称
   */
  const updateSceneName = useCallback(async (sceneId: number, newSceneName: string) => {
    try {
      const result = await shortplayService.updateScene(sceneId, newSceneName);
      if (result.code === 0) {
        const oldSceneName = scenesData.find((scene) => scene.sceneId === sceneId)?.sceneName;

        setScenesData((scenes) =>
          scenes.map((scene) =>
            scene.sceneId === sceneId ? { ...scene, sceneName: newSceneName } : scene
          )
        );

        setSceneOptions((options) =>
          options.map((option) => (option === oldSceneName ? newSceneName : option))
        );

        return true;
      } else {
        toast.error('场次名称更新失败：' + (result.message || '未知错误'));
        return false;
      }
    } catch (error) {
      console.error('更新场次名称失败:', error);
      toast.error('场次名称更新失败');
      return false;
    }
  }, [scenesData]);

  /**
   * 开始编辑场次内容项
   */
  const handleEditSceneItem = useCallback((item: SceneContentItem) => {
    setEditingSceneItemId(item.id);
    setEditingSceneContent(item.content);
    setEditingSceneType(item.type || 0);
    setEditingSceneRoleName(item.roleName || '');

    const startTime = item.startTime || '00:00';
    const [startMin, startSec] = startTime.split(':');
    setEditingSceneStartMinutes(startMin || '00');
    setEditingSceneStartSeconds(startSec || '00');

    const endTime = item.endTime || '00:00';
    const [endMin, endSec] = endTime.split(':');
    setEditingSceneEndMinutes(endMin || '00');
    setEditingSceneEndSeconds(endSec || '00');
  }, []);

  /**
   * 保存场次内容项编辑
   */
  const handleSaveSceneItem = useCallback(async () => {
    if (editingSceneItemId === null) return;

    const startTime = `${editingSceneStartMinutes.padStart(2, '0')}:${editingSceneStartSeconds.padStart(2, '0')}`;
    const endTime = `${editingSceneEndMinutes.padStart(2, '0')}:${editingSceneEndSeconds.padStart(2, '0')}`;

    // 验证时间逻辑
    const validation = validateTimeLogic(
      editingSceneStartMinutes,
      editingSceneStartSeconds,
      editingSceneEndMinutes,
      editingSceneEndSeconds
    );

    if (!validation.valid) {
      toast.error(validation.error || '时间范围无效');
      return;
    }

    if (!editingSceneContent.trim()) {
      toast.error('请输入内容');
      return;
    }

    try {
      const isNewItem = isTempId(editingSceneItemId);
      const currentSceneData = scenesData.find((scene) => scene.sceneName === selectedScene);
      const sceneId = currentSceneData?.sceneId;

      if (isNewItem && !sceneId) {
        toast.error('请先选择场次');
        return;
      }

      let result;
      if (isNewItem) {
        result = await shortplayService.createSceneContent({
          sceneId: sceneId!,
          type: editingSceneType,
          content: editingSceneContent,
          roleName: editingSceneType === 1 ? editingSceneRoleName : undefined,
          startTime,
          endTime
        });
      } else {
        result = await shortplayService.updateSceneContent({
          id: editingSceneItemId,
          type: editingSceneType,
          content: editingSceneContent,
          roleName: editingSceneType === 1 ? editingSceneRoleName : undefined,
          startTime,
          endTime
        });
      }

      if (result.code === 0) {
        setSceneContent((items) =>
          items.map((item) =>
            item.id === editingSceneItemId
              ? {
                  ...item,
                  id: isNewItem ? result.data?.id || item.id : item.id,
                  type: editingSceneType,
                  content: editingSceneContent,
                  roleName: editingSceneType === 1 ? editingSceneRoleName : undefined,
                  startTime,
                  endTime
                }
              : item
          )
        );

        setEditingSceneItemId(null);
        setEditingSceneContent('');
        setEditingSceneType(0);
        setEditingSceneRoleName('');
        setEditingSceneStartMinutes('');
        setEditingSceneStartSeconds('');
        setEditingSceneEndMinutes('');
        setEditingSceneEndSeconds('');
      } else {
        toast.error('保存失败：' + (result.message || '未知错误'));
      }
    } catch (error) {
      console.error('保存场次内容失败:', error);
      toast.error('保存失败');
    }
  }, [
    editingSceneItemId,
    editingSceneContent,
    editingSceneType,
    editingSceneRoleName,
    editingSceneStartMinutes,
    editingSceneStartSeconds,
    editingSceneEndMinutes,
    editingSceneEndSeconds,
    scenesData,
    selectedScene
  ]);

  /**
   * 取消编辑场次内容项
   */
  const handleCancelEditSceneItem = useCallback(() => {
    if (editingSceneItemId !== null && isTempId(editingSceneItemId)) {
      setSceneContent((items) => items.filter((item) => item.id !== editingSceneItemId));
    }

    setEditingSceneItemId(null);
    setEditingSceneContent('');
    setEditingSceneType(0);
    setEditingSceneRoleName('');
    setEditingSceneStartMinutes('');
    setEditingSceneStartSeconds('');
    setEditingSceneEndMinutes('');
    setEditingSceneEndSeconds('');
  }, [editingSceneItemId]);

  /**
   * 开始新增场次内容项
   */
  const handleStartAddNewItem = useCallback(() => {
    const newItem: SceneContentItem = {
      id: generateTempId(),
      type: 0,
      content: '',
      roleName: '',
      startTime: '00:00',
      endTime: '00:05'
    };

    setSceneContent((items) => [...items, newItem]);
    handleEditSceneItem(newItem);
  }, [handleEditSceneItem]);

  /**
   * 删除场次内容项
   */
  const handleDeleteSceneItem = useCallback(async (id: number) => {
    if (isTempId(id)) {
      setSceneContent((items) => items.filter((item) => item.id !== id));
      return;
    }

    try {
      const result = await shortplayService.deleteSceneContent(id);
      if (result.code === 0) {
        setSceneContent((items) => items.filter((item) => item.id !== id));
      } else {
        toast.error('删除失败：' + (result.message || '未知错误'));
      }
    } catch (error) {
      console.error('删除场次内容失败:', error);
      toast.error('删除失败');
    }
  }, []);

  /**
   * 更新场次内容排序
   */
  const updateSceneContentOrder = useCallback(async (itemId: number, newOrderNum: number) => {
    try {
      const result = await shortplayService.updateSceneContent({
        id: itemId,
        orderNum: newOrderNum
      });

      if (result.code !== 0) {
        throw new Error(result.message || '更新排序失败');
      }
    } catch (error) {
      console.error('更新排序失败:', error);
      throw error;
    }
  }, []);

  return {
    // 状态
    scenesData,
    sceneOptions,
    selectedScene,
    sceneContent,
    editingSceneItemId,
    editingSceneContent,
    editingSceneType,
    editingSceneRoleName,
    editingSceneStartMinutes,
    editingSceneStartSeconds,
    editingSceneEndMinutes,
    editingSceneEndSeconds,
    deleteConfirmId,

    // Setters
    setScenesData,
    setSceneOptions,
    setSelectedScene,
    setSceneContent,
    setEditingSceneType,
    setEditingSceneContent,
    setEditingSceneRoleName,
    setEditingSceneStartMinutes,
    setEditingSceneStartSeconds,
    setEditingSceneEndMinutes,
    setEditingSceneEndSeconds,
    setDeleteConfirmId,

    // 方法
    loadSceneContent,
    updateSceneName,
    handleEditSceneItem,
    handleSaveSceneItem,
    handleCancelEditSceneItem,
    handleStartAddNewItem,
    handleDeleteSceneItem,
    updateSceneContentOrder
  };
};
