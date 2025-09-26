import React, { useState } from "react";
import { Todo } from "../types/Todo";
import { Form, Button, InputGroup } from "react-bootstrap";

interface TodoFormProps {
  onSubmit: (todo: Todo) => void;
  initialData?: Todo;
  buttonText?: string;
}

const TodoForm: React.FC<TodoFormProps> = ({
  onSubmit,
  initialData = { title: "", description: "", completed: false },
  buttonText = "追加"
}) => {
  const [todo, setTodo] = useState<Todo>(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (todo.title.trim()) {
      onSubmit(todo);
      if (!initialData.id) {
        // 新規作成時はフォームをリセット
        setTodo({ title: "", description: "", completed: false });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTodo({ ...todo, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setTodo({ ...todo, [name]: checked });
  };

  return (
    <Form onSubmit={handleSubmit} className="mb-4">
      <Form.Group className="mb-3">
        <Form.Label>タイトル</Form.Label>
        <InputGroup>
          <Form.Control
            type="text"
            name="title"
            value={todo.title}
            onChange={handleChange}
            placeholder="タスクのタイトルを入力"
            required
          />
        </InputGroup>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>説明</Form.Label>
        <Form.Control
          as="textarea"
          name="description"
          value={todo.description || ""}
          onChange={handleChange}
          placeholder="タスクの詳細を入力（任意）"
          rows={3}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          name="completed"
          label="完了済み"
          checked={todo.completed}
          onChange={handleCheckboxChange}
        />
      </Form.Group>

      <Button variant="primary" type="submit">
        {buttonText}
      </Button>
    </Form>
  );
};

export default TodoForm;
