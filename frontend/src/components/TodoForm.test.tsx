import { render, screen, fireEvent } from "@testing-library/react";
import TodoForm from "../components/TodoForm";

describe("TodoForm Component", () => {
  test("renders form elements correctly", () => {
    const handleSubmit = jest.fn();
    render(<TodoForm onSubmit={handleSubmit} />);
    
    expect(screen.getByLabelText(/タイトル/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/説明/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/完了済み/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /追加/i })).toBeInTheDocument();
  });

  test("submits form with correct data", () => {
    const handleSubmit = jest.fn();
    render(<TodoForm onSubmit={handleSubmit} />);
    
    // フォームに入力
    fireEvent.change(screen.getByLabelText(/タイトル/i), {
      target: { value: "テストタスク" }
    });
    fireEvent.change(screen.getByLabelText(/説明/i), {
      target: { value: "これはテストです" }
    });
    fireEvent.click(screen.getByLabelText(/完了済み/i));
    
    // フォーム送信
    fireEvent.click(screen.getByRole("button", { name: /追加/i }));
    
    // 送信されたデータを確認
    expect(handleSubmit).toHaveBeenCalledWith({
      title: "テストタスク",
      description: "これはテストです",
      completed: true
    });
  });

  test("initializes form with provided data", () => {
    const handleSubmit = jest.fn();
    const initialData = {
      title: "既存タスク",
      description: "既存の説明",
      completed: true
    };
    
    render(
      <TodoForm
        onSubmit={handleSubmit}
        initialData={initialData}
        buttonText="更新"
      />
    );
    
    // 初期値が設定されていることを確認
    expect(screen.getByLabelText(/タイトル/i)).toHaveValue("既存タスク");
    expect(screen.getByLabelText(/説明/i)).toHaveValue("既存の説明");
    expect(screen.getByLabelText(/完了済み/i)).toBeChecked();
    expect(screen.getByRole("button", { name: /更新/i })).toBeInTheDocument();
  });
});
