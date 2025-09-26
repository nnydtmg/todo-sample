package com.example.todo.service;

import com.example.todo.model.Todo;
import com.example.todo.repository.TodoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TodoServiceTest {

    @Mock
    private TodoRepository todoRepository;

    @InjectMocks
    private TodoService todoService;

    private Todo todo1;
    private Todo todo2;

    @BeforeEach
    void setup() {
        todo1 = Todo.builder()
                .id(1L)
                .title("テストタスク1")
                .description("これはテスト用のタスク1です")
                .completed(false)
                .build();

        todo2 = Todo.builder()
                .id(2L)
                .title("テストタスク2")
                .description("これはテスト用のタスク2です")
                .completed(true)
                .build();
    }

    @Test
    void shouldGetAllTodos() {
        // Given
        when(todoRepository.findAllByOrderByUpdatedAtDesc()).thenReturn(Arrays.asList(todo1, todo2));

        // When
        List<Todo> result = todoService.getAllTodos();

        // Then
        assertThat(result).hasSize(2);
        verify(todoRepository).findAllByOrderByUpdatedAtDesc();
    }

    @Test
    void shouldGetTodosByCompleted() {
        // Given
        when(todoRepository.findByCompletedOrderByUpdatedAtDesc(true)).thenReturn(List.of(todo2));

        // When
        List<Todo> result = todoService.getTodosByCompleted(true);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).isCompleted()).isTrue();
        verify(todoRepository).findByCompletedOrderByUpdatedAtDesc(true);
    }

    @Test
    void shouldGetTodoById() {
        // Given
        when(todoRepository.findById(1L)).thenReturn(Optional.of(todo1));

        // When
        Optional<Todo> result = todoService.getTodoById(1L);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(1L);
        verify(todoRepository).findById(1L);
    }

    @Test
    void shouldCreateTodo() {
        // Given
        Todo newTodo = Todo.builder()
                .title("新しいタスク")
                .description("これは新しいタスクです")
                .build();

        when(todoRepository.save(any(Todo.class))).thenReturn(
                Todo.builder()
                        .id(3L)
                        .title("新しいタスク")
                        .description("これは新しいタスクです")
                        .completed(false)
                        .build()
        );

        // When
        Todo result = todoService.createTodo(newTodo);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(3L);
        verify(todoRepository).save(any(Todo.class));
    }

    @Test
    void shouldUpdateTodo() {
        // Given
        Todo updatedTodo = Todo.builder()
                .title("更新されたタスク")
                .description("これは更新されたタスクです")
                .completed(true)
                .build();

        when(todoRepository.findById(1L)).thenReturn(Optional.of(todo1));
        when(todoRepository.save(any(Todo.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Optional<Todo> result = todoService.updateTodo(1L, updatedTodo);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getTitle()).isEqualTo("更新されたタスク");
        assertThat(result.get().getDescription()).isEqualTo("これは更新されたタスクです");
        assertThat(result.get().isCompleted()).isTrue();
        verify(todoRepository).findById(1L);
        verify(todoRepository).save(any(Todo.class));
    }

    @Test
    void shouldToggleTodoCompleted() {
        // Given
        when(todoRepository.findById(1L)).thenReturn(Optional.of(todo1));
        when(todoRepository.save(any(Todo.class))).thenAnswer(invocation -> {
            Todo savedTodo = invocation.getArgument(0);
            savedTodo.setCompleted(true); // 完了状態を変更
            return savedTodo;
        });

        // When
        Optional<Todo> result = todoService.toggleTodoCompleted(1L);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().isCompleted()).isTrue(); // falseからtrueに変更されたことを確認
        verify(todoRepository).findById(1L);
        verify(todoRepository).save(any(Todo.class));
    }

    @Test
    void shouldDeleteTodo() {
        // Given
        when(todoRepository.findById(1L)).thenReturn(Optional.of(todo1));
        doNothing().when(todoRepository).delete(any(Todo.class));

        // When
        boolean result = todoService.deleteTodo(1L);

        // Then
        assertThat(result).isTrue();
        verify(todoRepository).findById(1L);
        verify(todoRepository).delete(any(Todo.class));
    }

    @Test
    void shouldReturnFalseWhenDeleteNonExistingTodo() {
        // Given
        when(todoRepository.findById(anyLong())).thenReturn(Optional.empty());

        // When
        boolean result = todoService.deleteTodo(999L);

        // Then
        assertThat(result).isFalse();
        verify(todoRepository).findById(999L);
        verify(todoRepository, never()).delete(any(Todo.class));
    }
}