import React from "react";
import { Todo } from "../types/Todo";
import { Card, Button, Badge } from "react-bootstrap";
import { formatDate } from "../utils/formatDate";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: number) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onEdit, onDelete }) => {
  return (
    <Card className="mb-3">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <Card.Title className={todo.completed ? "text-muted text-decoration-line-through" : ""}>
            {todo.title}
          </Card.Title>
          <Badge bg={todo.completed ? "success" : "secondary"}>
            {todo.completed ? "完了" : "未完了"}
          </Badge>
        </div>
        
        {todo.description && (
          <Card.Text className={todo.completed ? "text-muted" : ""}>
            {todo.description}
          </Card.Text>
        )}
        
        {todo.updatedAt && (
          <div className="text-muted small mb-3">
            最終更新: {formatDate(todo.updatedAt)}
          </div>
        )}
        
        <div className="d-flex gap-2">
          <Button
            variant={todo.completed ? "outline-secondary" : "outline-success"}
            size="sm"
            onClick={() => todo.id && onToggle(todo.id)}
          >
            {todo.completed ? "未完了にする" : "完了にする"}
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => onEdit(todo)}
          >
            編集
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => todo.id && onDelete(todo.id)}
          >
            削除
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TodoItem;
