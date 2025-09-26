import { render, screen, fireEvent } from "@testing-library/react";
import TodoItem from "./TodoItem";
import { Todo } from "../types/Todo";

describe("TodoItem Component", () => {
  const mockTodo: Todo = {
    id: 1,
    title: "テストタスク",
    description: "これはテスト用のタスクです",
    completed: false,
    createdAt: "2023-10-10T10:00:00",
    updatedAt: "2023-10-10T11:00:00"
  };

  const mockHandlers = {
    onToggle: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders todo item correctly", () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);
    
    // タイトルと説明が表示されていることを確認
    expect(screen.getByText("テストタスク")).toBeInTheDocument();
    expect(screen.getByText("これはテスト用のタスクです")).toBeInTheDocument();
    
    // 完了状態に応じたバッジが表示されていることを確認
    expect(screen.getByText("未完了")).toBeInTheDocument();
    
    // 各ボタンが表示されていることを確認
    expect(screen.getByRole("button", { name: /完了にする/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /編集/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /削除/i })).toBeInTheDocument();
  });

  test("renders completed todo with strikethrough", () => {
    const completedTodo = { ...mockTodo, completed: true };
    render(<TodoItem todo={completedTodo} {...mockHandlers} />);
    
    // 完了状態のバッジが表示されていることを確認
    expect(screen.getByText("完了")).toBeInTheDocument();
    
    // 完了状態のタスクでは「未完了にする」ボタンが表示されることを確認
    expect(screen.getByRole("button", { name: /未完了にする/i })).toBeInTheDocument();
  });

  test("calls onToggle when toggle button is clicked", () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);
    
    fireEvent.click(screen.getByRole("button", { name: /完了にする/i }));
    expect(mockHandlers.onToggle).toHaveBeenCalledWith(1);
  });

  test("calls onEdit when edit button is clicked", () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);
    
    fireEvent.click(screen.getByRole("button", { name: /編集/i }));
    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockTodo);
  });

  test("calls onDelete when delete button is clicked", () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);
    
    fireEvent.click(screen.getByRole("button", { name: /削除/i }));
    expect(mockHandlers.onDelete).toHaveBeenCalledWith(1);
  });
});