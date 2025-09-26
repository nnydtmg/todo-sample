import { useState, useEffect } from "react";
import { Todo } from "../types/Todo";
import { TodoService } from "../services/TodoService";

export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const data = await TodoService.getAll();
      setTodos(data);
      setError(null);
    } catch (err) {
      setError("タスクの取得中にエラーが発生しました。");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (todo: Todo) => {
    try {
      const newTodo = await TodoService.create(todo);
      setTodos([newTodo, ...todos]);
      return true;
    } catch (err) {
      setError("タスクの追加中にエラーが発生しました。");
      console.error(err);
      return false;
    }
  };

  const updateTodo = async (id: number, todo: Todo) => {
    try {
      const updatedTodo = await TodoService.update(id, todo);
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
      return true;
    } catch (err) {
      setError("タスクの更新中にエラーが発生しました。");
      console.error(err);
      return false;
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await TodoService.delete(id);
      setTodos(todos.filter(t => t.id !== id));
      return true;
    } catch (err) {
      setError("タスクの削除中にエラーが発生しました。");
      console.error(err);
      return false;
    }
  };

  const toggleTodoCompleted = async (id: number) => {
    try {
      const updatedTodo = await TodoService.toggleCompleted(id);
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
      return true;
    } catch (err) {
      setError("タスクの状態更新中にエラーが発生しました。");
      console.error(err);
      return false;
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return {
    todos,
    loading,
    error,
    fetchTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodoCompleted
  };
};
