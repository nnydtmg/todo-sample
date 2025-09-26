package com.example.todo.service;

import com.example.todo.model.Todo;
import com.example.todo.repository.TodoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TodoService {
    
    private final TodoRepository todoRepository;
    
    @Autowired
    public TodoService(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
    }
    
    public List<Todo> getAllTodos() {
        return todoRepository.findAllByOrderByUpdatedAtDesc();
    }
    
    public List<Todo> getTodosByCompleted(boolean completed) {
        return todoRepository.findByCompletedOrderByUpdatedAtDesc(completed);
    }
    
    public Optional<Todo> getTodoById(Long id) {
        return todoRepository.findById(id);
    }
    
    public Todo createTodo(Todo todo) {
        return todoRepository.save(todo);
    }
    
    public Optional<Todo> updateTodo(Long id, Todo updatedTodo) {
        return todoRepository.findById(id)
                .map(existingTodo -> {
                    existingTodo.setTitle(updatedTodo.getTitle());
                    existingTodo.setDescription(updatedTodo.getDescription());
                    existingTodo.setCompleted(updatedTodo.isCompleted());
                    return todoRepository.save(existingTodo);
                });
    }
    
    public Optional<Todo> toggleTodoCompleted(Long id) {
        return todoRepository.findById(id)
                .map(existingTodo -> {
                    existingTodo.setCompleted(!existingTodo.isCompleted());
                    return todoRepository.save(existingTodo);
                });
    }
    
    public boolean deleteTodo(Long id) {
        return todoRepository.findById(id)
                .map(todo -> {
                    todoRepository.delete(todo);
                    return true;
                })
                .orElse(false);
    }
}