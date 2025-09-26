import React, { useState } from "react";
import { Container, Row, Col, ListGroup, Button, Modal, Alert, Spinner, Tab, Tabs } from "react-bootstrap";
import TodoItem from "./TodoItem";
import TodoForm from "./TodoForm";
import { useTodos } from "../hooks/useTodos";
import { Todo } from "../types/Todo";

const TodoList: React.FC = () => {
  const { todos, loading, error, addTodo, updateTodo, deleteTodo, toggleTodoCompleted } = useTodos();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentTodo, setCurrentTodo] = useState<Todo | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  // フィルタリングされたTodoリスト
  const filteredTodos = todos.filter(todo => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return !todo.completed;
    if (activeTab === "completed") return todo.completed;
    return true;
  });

  const handleAddTodo = async (todo: Todo) => {
    const success = await addTodo(todo);
    if (success) {
      setShowAddModal(false);
    }
  };

  const handleEditClick = (todo: Todo) => {
    setCurrentTodo(todo);
    setShowEditModal(true);
  };

  const handleEditTodo = async (todo: Todo) => {
    if (currentTodo?.id) {
      const success = await updateTodo(currentTodo.id, todo);
      if (success) {
        setShowEditModal(false);
        setCurrentTodo(null);
      }
    }
  };

  const handleDeleteClick = (id: number) => {
    const todoToDelete = todos.find(todo => todo.id === id);
    setCurrentTodo(todoToDelete || null);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (currentTodo?.id) {
      const success = await deleteTodo(currentTodo.id);
      if (success) {
        setShowDeleteModal(false);
        setCurrentTodo(null);
      }
    }
  };

  const handleToggle = (id: number) => {
    toggleTodoCompleted(id);
  };

  return (
    <Container className="my-4">
      <Row className="mb-4">
        <Col>
          <h1 className="text-center">Todoアプリ</h1>
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              新しいタスクを追加
            </Button>
          </div>
          
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || "all")}
            className="mb-3"
          >
            <Tab eventKey="all" title={`全て (${todos.length})`} />
            <Tab 
              eventKey="active" 
              title={`未完了 (${todos.filter(t => !t.completed).length})`}
            />
            <Tab 
              eventKey="completed" 
              title={`完了済み (${todos.filter(t => t.completed).length})`}
            />
          </Tabs>
          
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">読み込み中...</span>
              </Spinner>
            </div>
          ) : filteredTodos.length > 0 ? (
            <ListGroup>
              {filteredTodos.map((todo) => (
                <ListGroup.Item key={todo.id} className="p-0 border-0">
                  <TodoItem
                    todo={todo}
                    onToggle={handleToggle}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <Alert variant="info">
              {activeTab === "all" 
                ? "タスクがありません。新しいタスクを追加してください。"
                : activeTab === "active"
                  ? "未完了のタスクはありません。"
                  : "完了済みのタスクはありません。"}
            </Alert>
          )}
        </Col>
      </Row>

      {/* 新規追加モーダル */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>新しいタスクを追加</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TodoForm
            onSubmit={handleAddTodo}
            buttonText="追加"
          />
        </Modal.Body>
      </Modal>

      {/* 編集モーダル */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>タスクを編集</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentTodo && (
            <TodoForm
              initialData={currentTodo}
              onSubmit={handleEditTodo}
              buttonText="保存"
            />
          )}
        </Modal.Body>
      </Modal>

      {/* 削除確認モーダル */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>削除の確認</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>以下のタスクを削除してよろしいですか？</p>
          <p><strong>{currentTodo?.title}</strong></p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            キャンセル
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            削除
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TodoList;
