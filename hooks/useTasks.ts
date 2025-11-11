import { useState, useEffect, useCallback, useRef } from "react";
import { taskService, ITask, TaskStatus } from "@/lib/api";
import { createSocket } from "@/lib/socket";
import { Socket } from "socket.io-client";
import { useUser } from "@/redux/hooks/hooks";

interface UseTasksOptions {
  status?: TaskStatus;
  page?: number;
  limit?: number;
  enableSocket?: boolean; // Enable real-time socket updates, default true
}

export const useTasks = (options: UseTasksOptions = {}) => {
  const {
    status = "pending",
    page = 1,
    limit = 10,
    enableSocket = true,
  } = options;

  const { user, access_token } = useUser();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const socketRef = useRef<Socket | null>(null);
  const [newTaskReceived, setNewTaskReceived] = useState<ITask | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await taskService.getTasks({ status, page, limit });

      setTasks(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      setError(err?.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, [status, page, limit]);

  const completeTask = useCallback(async (taskId: string) => {
    try {
      await taskService.completeTask(taskId);
      // Remove completed task from list
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      return true;
    } catch (err: any) {
      console.error("Error completing task:", err);
      throw new Error(
        err?.response?.data?.message || "Failed to complete task"
      );
    }
  }, []);

  const cancelTask = useCallback(async (taskId: string) => {
    try {
      await taskService.cancelTask(taskId);
      // Remove cancelled task from list
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      return true;
    } catch (err: any) {
      console.error("Error cancelling task:", err);
      throw new Error(err?.response?.data?.message || "Failed to cancel task");
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!enableSocket) return;

    let mounted = true;

    const initializeSocket = async () => {
      try {
        const userId = user?.id;
        if (!userId) return;

        // Create socket connection
        const socket = createSocket({ token: access_token });
        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("Socket connected for tasks");

          // Join the rider's task channel
          const channel = `user.${userId}.pending.task`;
          console.log(`Joining channel: ${channel}`);
          socket.emit("join", channel);
        });

        socket.on("disconnect", () => {
          console.log("Socket disconnected");
        });

        socket.on("connect_error", (err) => {
          console.error("Socket connection error:", err.message);
        });

        // Listen for new tasks
        const channel = `user.${userId}.pending.task`;
        socket.on(channel, (data: ITask) => {
          if (!mounted) return;

          console.log("New task received:", data);

          // Add to tasks list if it matches the current status filter
          if (data.status === status) {
            setTasks((prev) => {
              // Check if task already exists
              const exists = prev.some((task) => task.id === data.id);
              if (exists) return prev;
              return [data, ...prev];
            });

            // Set as new task for notification
            setNewTaskReceived(data);
          }
        });
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
    };

    initializeSocket();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [enableSocket, user?.id, access_token, status]);

  // Clear new task notification
  const clearNewTask = useCallback(() => {
    setNewTaskReceived(null);
  }, []);

  return {
    tasks,
    loading,
    error,
    pagination,
    refetch: fetchTasks,
    completeTask,
    cancelTask,
  };
};
