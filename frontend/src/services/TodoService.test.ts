import axios from "axios";
import { TodoService } from "./TodoService";
import { Todo } from "../types/Todo";

// axiosをモック
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("TodoService", () => {
  const mockTodos: Todo[] = [
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

  const mockTodo: Todo = {
    id: 1,
    title: "テストタスク",
    description: "説明",
    completed: false
  };

  const newTodo: Todo = {
    title: "新しいタスク",
    description: "新しい説明",
    completed: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getAll fetches todos from the API", async () => {
    // axiosのgetメソッドをモック
    mockedAxios.get.mockResolvedValue({ data: mockTodos });
    
    const result = await TodoService.getAll();
    
    expect(mockedAxios.get).toHaveBeenCalledWith("http://localhost:8080/api/todos");
    expect(result).toEqual(mockTodos);
  });

  test("getById fetches a specific todo from the API", async () => {
    mockedAxios.get.mockResolvedValue({ data: mockTodo });
    
    const result = await TodoService.getById(1);
    
    expect(mockedAxios.get).toHaveBeenCalledWith("http://localhost:8080/api/todos/1");
    expect(result).toEqual(mockTodo);
  });

  test("create sends a new todo to the API", async () => {
    const createdTodo = { ...newTodo, id: 3 };
    mockedAxios.post.mockResolvedValue({ data: createdTodo });
    
    const result = await TodoService.create(newTodo);
    
    expect(mockedAxios.post).toHaveBeenCalledWith("http://localhost:8080/api/todos", newTodo);
    expect(result).toEqual(createdTodo);
  });

  test("update sends updated todo to the API", async () => {
    const updatedTodo = { ...mockTodo, title: "更新されたタスク" };
    mockedAxios.put.mockResolvedValue({ data: updatedTodo });
    
    const result = await TodoService.update(1, updatedTodo);
    
    expect(mockedAxios.put).toHaveBeenCalledWith("http://localhost:8080/api/todos/1", updatedTodo);
    expect(result).toEqual(updatedTodo);
  });

  test("delete sends delete request to the API", async () => {
    mockedAxios.delete.mockResolvedValue({});
    
    await TodoService.delete(1);
    
    expect(mockedAxios.delete).toHaveBeenCalledWith("http://localhost:8080/api/todos/1");
  });

  test("toggleCompleted sends patch request to the API", async () => {
    const toggledTodo = { ...mockTodo, completed: true };
    mockedAxios.patch.mockResolvedValue({ data: toggledTodo });
    
    const result = await TodoService.toggleCompleted(1);
    
    expect(mockedAxios.patch).toHaveBeenCalledWith("http://localhost:8080/api/todos/1/toggle");
    expect(result).toEqual(toggledTodo);
  });

  test("handles API errors", async () => {
    const errorMessage = "Network Error";
    mockedAxios.get.mockRejectedValue(new Error(errorMessage));
    
    await expect(TodoService.getAll()).rejects.toThrow(errorMessage);
  });
});