import { renderHook, act } from "@testing-library/react";
import { useTodos } from "./useTodos";
import { TodoService } from "../services/TodoService";

// TodoServiceをモック
jest.mock("../services/TodoService");

describe("useTodos Hook", () => {
  const mockTodos = [
    {
      id: 1,
      title: "テストタスク1",
      description: "説明1",
      completed: false
    },
    {
      id: 2,
      title: "テストタスク2",
      description: "説明2",
      completed: true
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // TodoServiceのメソッドをモック
    (TodoService.getAll as jest.Mock).mockResolvedValue(mockTodos);
    (TodoService.create as jest.Mock).mockImplementation((todo) => 
      Promise.resolve({ ...todo, id: 3 })
    );
    (TodoService.update as jest.Mock).mockImplementation((id, todo) => 
      Promise.resolve({ ...todo, id })
    );
    (TodoService.delete as jest.Mock).mockResolvedValue(undefined);
    (TodoService.toggleCompleted as jest.Mock).mockImplementation((id) => {
      const todo = mockTodos.find(t => t.id === id);
      if (todo) {
        return Promise.resolve({ ...todo, completed: !todo.completed });
      }
      return Promise.reject(new Error("Todo not found"));
    });
  });

  test("fetches todos on initial load", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useTodos());
    
    // 初期状態を確認
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.todos).toEqual([]);
    
    // データ取得が完了するまで待機
    await waitForNextUpdate();
    
    // データ取得後の状態を確認
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.todos).toEqual(mockTodos);
    expect(TodoService.getAll).toHaveBeenCalledTimes(1);
  });

  test("adds a new todo", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useTodos());
    
    // データ取得が完了するまで待機
    await waitForNextUpdate();
    
    const newTodo = {
      title: "新しいタスク",
      description: "新しい説明",
      completed: false
    };
    
    // 新しいTodoを追加
    await act(async () => {
      const success = await result.current.addTodo(newTodo);
      expect(success).toBe(true);
    });
    
    // TodoServiceのcreateが呼ばれたことを確認
    expect(TodoService.create).toHaveBeenCalledWith(newTodo);
    
    // 追加されたTodoがリストの先頭に追加されたことを確認
    expect(result.current.todos[0]).toEqual({ 
      ...newTodo, 
      id: 3 
    });
  });

  test("updates a todo", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useTodos());
    
    // データ取得が完了するまで待機
    await waitForNextUpdate();
    
    const updatedTodo = {
      id: 1,
      title: "更新されたタスク",
      description: "更新された説明",
      completed: true
    };
    
    // Todoを更新
    await act(async () => {
      const success = await result.current.updateTodo(1, updatedTodo);
      expect(success).toBe(true);
    });
    
    // TodoServiceのupdateが呼ばれたことを確認
    expect(TodoService.update).toHaveBeenCalledWith(1, updatedTodo);
    
    // 更新されたTodoがリストに反映されたことを確認
    const updated = result.current.todos.find(t => t.id === 1);
    expect(updated).toEqual(updatedTodo);
  });

  test("deletes a todo", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useTodos());
    
    // データ取得が完了するまで待機
    await waitForNextUpdate();
    
    // 削除前のtodosの長さを記録
    const lengthBeforeDelete = result.current.todos.length;
    
    // Todoを削除
    await act(async () => {
      const success = await result.current.deleteTodo(1);
      expect(success).toBe(true);
    });
    
    // TodoServiceのdeleteが呼ばれたことを確認
    expect(TodoService.delete).toHaveBeenCalledWith(1);
    
    // 削除されたTodoがリストから削除されたことを確認
    expect(result.current.todos.length).toBe(lengthBeforeDelete - 1);
    expect(result.current.todos.find(t => t.id === 1)).toBeUndefined();
  });

  test("toggles todo completed status", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useTodos());
    
    // データ取得が完了するまで待機
    await waitForNextUpdate();
    
    // 完了状態を切り替え
    await act(async () => {
      const success = await result.current.toggleTodoCompleted(1);
      expect(success).toBe(true);
    });
    
    // TodoServiceのtoggleCompletedが呼ばれたことを確認
    expect(TodoService.toggleCompleted).toHaveBeenCalledWith(1);
  });

  test("handles API errors", async () => {
    // getAll メソッドでエラーが発生するようにモック
    (TodoService.getAll as jest.Mock).mockRejectedValue(new Error("API error"));
    
    const { result, waitForNextUpdate } = renderHook(() => useTodos());
    
    // データ取得が完了するまで待機
    await waitForNextUpdate();
    
    // エラーが設定されていることを確認
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("タスクの取得中にエラーが発生しました。");
    expect(result.current.todos).toEqual([]);
  });
});