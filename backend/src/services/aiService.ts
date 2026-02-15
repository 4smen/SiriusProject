import axios from 'axios';
import { db } from '../db';

interface TaskForecast {
  task_name: string;
  estimated_hours: number;
  reasoning: string;
  confidence: string;
}

interface TaskAnomaly {
  taskId: number;
  username: string;
  taskText: string;
  activeHours: number;
  estimatedHours: number;
  deviation: number;
  detectedAt: Date;
}

class AIService {
  private pythonServiceUrl: string;

  constructor() {
    this.pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5002';
  }

  //прогнозируемое время выполнения задачи
  async getTaskForecast(taskId: number): Promise<TaskForecast | null> {
    try {
      const response = await axios.post(
        `${this.pythonServiceUrl}/api/tasks/forecast-time`,
        { task_id: taskId },
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      console.error(`ошибка получения прогноза для задачи ${taskId}:`, error);
      return null;
    }
  }

  //время активности задачи
  async getTaskActiveTime(taskId: number): Promise<number | null> {
    try {
      const response = await axios.post(
        `${this.pythonServiceUrl}/api/tasks/active-time`,
        { task_id: taskId },
        { timeout: 5000 }
      );
      return response.data.active_hours;
    } catch (error) {
      console.error(`ошибка получения активного времени для задачи ${taskId}:`, error);
      return null;
    }
  }

  async checkTaskAnomaly(taskId: number): Promise<TaskAnomaly | null> {
    try {
      const [forecast, activeHours] = await Promise.all([
        this.getTaskForecast(taskId),
        this.getTaskActiveTime(taskId)
      ]);

      if (!forecast || activeHours === null) {
        return null;
      }

      const deviation = activeHours / forecast.estimated_hours;

      if (deviation <= 2.0) {
        await this.autoResolveAnomaly(taskId);
        return null;
      }

      const task = await db.get(
        `SELECT id, username, text, isCompleted, createdAt
         FROM tasks WHERE id = ?`,
        [taskId]
      );

      if (!task) {
        return null;
      }

      const anomaly: TaskAnomaly = {
        taskId: task.id,
        username: task.username,
        taskText: task.text.substring(0, 100) + (task.text.length > 100 ? '...' : ''),
        activeHours: Math.round(activeHours * 100) / 100,
        estimatedHours: Math.round(forecast.estimated_hours * 100) / 100,
        deviation: Math.round(deviation * 100) / 100,
        detectedAt: new Date()
      };

      await this.saveAnomaly(anomaly);

      return anomaly;
    } catch (error) {
      console.error(`ошибка проверки аномалии для задачи ${taskId}:`, error);
      return null;
    }
  }

  //автоматически снять аномалию, если задача выполнена
  private async autoResolveAnomaly(taskId: number): Promise<void> {
    try {
      const existing = await db.get(
        `SELECT id FROM anomalies 
         WHERE task_id = ? AND is_resolved = 0`,
        [taskId]
      );

      if (existing) {
        await db.run(
          `UPDATE anomalies 
           SET is_resolved = 1, resolved_at = ? 
           WHERE task_id = ? AND is_resolved = 0`,
          [new Date().toISOString(), taskId]
        );
        console.log(`автоматически снята аномалия для задачи ${taskId}`);
      }
    } catch (error) {
      console.error('ошибка при авто-снятии аномалии:', error);
    }
  }

  private async saveAnomaly(anomaly: TaskAnomaly): Promise<void> {
    try {
      const existing = await db.get(
        `SELECT id FROM anomalies 
         WHERE task_id = ? AND is_resolved = 0`,
        [anomaly.taskId]
      );

      if (existing) {
        await db.run(
          `UPDATE anomalies 
           SET active_hours = ?, estimated_hours = ?, deviation = ?, 
               detected_at = ?, is_resolved = 0, resolved_at = NULL
           WHERE task_id = ?`,
          [
            anomaly.activeHours,
            anomaly.estimatedHours,
            anomaly.deviation,
            anomaly.detectedAt.toISOString(),
            anomaly.taskId
          ]
        );
      } else {
        await db.run(
          `INSERT INTO anomalies 
           (task_id, username, task_text, active_hours, estimated_hours, 
            deviation, detected_at, is_resolved)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            anomaly.taskId,
            anomaly.username,
            anomaly.taskText,
            anomaly.activeHours,
            anomaly.estimatedHours,
            anomaly.deviation,
            anomaly.detectedAt.toISOString()
          ]
        );
      }
    } catch (error) {
      console.error('ошибка сохранения аномалии:', error);
    }
  }

  async getActiveAnomalies(): Promise<any[]> {
    try {
      const anomalies = await db.all(
        `SELECT * FROM anomalies 
         WHERE is_resolved = 0 
         ORDER BY detected_at DESC`
      );
      return anomalies;
    } catch (error) {
      console.error('ошибка получения активных аномалий:', error);
      return [];
    }
  }

  async checkAllActiveTasks(): Promise<TaskAnomaly[]> {
    try {
      const activeTasks = await db.all(
        `SELECT id FROM tasks WHERE isCompleted = 0`
      );

      const anomalies: TaskAnomaly[] = [];

      for (const task of activeTasks) {
        const anomaly = await this.checkTaskAnomaly(task.id);
        if (anomaly) {
          anomalies.push(anomaly);
        }
        
        // небольшая задержка, чтобы не перегружать сервис
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return anomalies;
    } catch (error) {
      console.error('ошибка проверки всех активных задач:', error);
      return [];
    }
  }

  async resolveAnomaly(anomalyId: number): Promise<boolean> {
    try {
      await db.run(
        `UPDATE anomalies 
         SET is_resolved = 1, resolved_at = ? 
         WHERE id = ?`,
        [new Date().toISOString(), anomalyId]
      );
      return true;
    } catch (error) {
      console.error('ошибка отметки аномалии:', error);
      return false;
    }
  }

  async completeTaskFromAnomaly(anomalyId: number): Promise<boolean> {
    try {
      const anomaly = await db.get(
        `SELECT task_id FROM anomalies WHERE id = ?`,
        [anomalyId]
      );

      if (!anomaly) {
        return false;
      }

      await db.run(
        `UPDATE tasks 
         SET isCompleted = 1, completedAt = ? 
         WHERE id = ?`,
        [new Date().toISOString(), anomaly.task_id]
      );

      await db.run(
        `UPDATE anomalies 
         SET is_resolved = 1, resolved_at = ? 
         WHERE id = ?`,
        [new Date().toISOString(), anomalyId]
      );

      console.log(`задача ${anomaly.task_id} выполнена из окна аномалий`);
      return true;
    } catch (error) {
      console.error('ошибка при выполнении задачи из аномалии:', error);
      return false;
    }
  }

  async checkCompletedTask(taskId: number): Promise<TaskAnomaly | null> {
    try {
      const task = await db.get(
        `SELECT isCompleted FROM tasks WHERE id = ?`,
        [taskId]
      );

      if (!task || !task.isCompleted) {
        return null;
      }

      await this.autoResolveAnomaly(taskId);

      return await this.checkTaskAnomaly(taskId);
    } catch (error) {
      console.error(`ошибка проверки завершенной задачи ${taskId}:`, error);
      return null;
    }
  }
}

export const aiService = new AIService();