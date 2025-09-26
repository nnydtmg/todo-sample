package com.example.todo.repository;

import com.example.todo.model.Todo;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
public class TodoRepositoryTest {

    @Autowired
    private TodoRepository todoRepository;

    @Test
    void shouldSaveTodo() {
        // Given
        Todo todo = Todo.builder()
                .title("テストタスク")
                .description("これはテスト用のタスクです")
                .completed(false)
                .build();

        // When
        Todo savedTodo = todoRepository.save(todo);

        // Then
        assertThat(savedTodo).isNotNull();
        assertThat(savedTodo.getId()).isNotNull();
        assertThat(savedTodo.getTitle()).isEqualTo("テストタスク");
        assertThat(savedTodo.getDescription()).isEqualTo("これはテスト用のタスクです");
        assertThat(savedTodo.isCompleted()).isFalse();
    }

    @Test
    void shouldFindByCompletedOrderByUpdatedAtDesc() {
        // Given
        Todo completedTodo1 = Todo.builder()
                .title("完了タスク1")
                .description("これは完了したタスクです")
                .completed(true)
                .build();

        Todo completedTodo2 = Todo.builder()
                .title("完了タスク2")
                .description("これは完了したタスクです")
                .completed(true)
                .build();

        Todo incompleteTodo = Todo.builder()
                .title("未完了タスク")
                .description("これは未完了のタスクです")
                .completed(false)
                .build();

        todoRepository.save(completedTodo1);
        todoRepository.save(completedTodo2);
        todoRepository.save(incompleteTodo);

        // When
        List<Todo> completedTodos = todoRepository.findByCompletedOrderByUpdatedAtDesc(true);
        List<Todo> incompleteTodos = todoRepository.findByCompletedOrderByUpdatedAtDesc(false);

        // Then
        assertThat(completedTodos).hasSize(2);
        assertThat(incompleteTodos).hasSize(1);
    }

    @Test
    void shouldFindAllByOrderByUpdatedAtDesc() {
        // Given
        todoRepository.deleteAll();
        Todo todo1 = Todo.builder().title("タスク1").completed(false).build();
        Todo todo2 = Todo.builder().title("タスク2").completed(true).build();
        Todo todo3 = Todo.builder().title("タスク3").completed(false).build();
        
        todoRepository.save(todo1);
        todoRepository.save(todo2);
        todoRepository.save(todo3);

        // When
        List<Todo> allTodos = todoRepository.findAllByOrderByUpdatedAtDesc();

        // Then
        assertThat(allTodos).hasSize(3);
    }
}