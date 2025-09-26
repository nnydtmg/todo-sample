package com.example.todo.controller;

import com.example.todo.model.Todo;
import com.example.todo.service.TodoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TodoController.class)
public class TodoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TodoService todoService;

    @Autowired
    private ObjectMapper objectMapper;

    private Todo todo1;
    private Todo todo2;

    @BeforeEach
    void setUp() {
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
    void shouldGetAllTodos() throws Exception {
        // Given
        List<Todo> todos = Arrays.asList(todo1, todo2);
        when(todoService.getAllTodos()).thenReturn(todos);

        // When & Then
        mockMvc.perform(get("/api/todos"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].title", is("テストタスク1")))
                .andExpect(jsonPath("$[0].completed", is(false)))
                .andExpect(jsonPath("$[1].id", is(2)))
                .andExpect(jsonPath("$[1].title", is("テストタスク2")))
                .andExpect(jsonPath("$[1].completed", is(true)));
    }

    @Test
    void shouldGetTodosByCompleted() throws Exception {
        // Given
        when(todoService.getTodosByCompleted(true)).thenReturn(List.of(todo2));

        // When & Then
        mockMvc.perform(get("/api/todos?completed=true"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(2)))
                .andExpect(jsonPath("$[0].completed", is(true)));
    }

    @Test
    void shouldGetTodoById() throws Exception {
        // Given
        when(todoService.getTodoById(1L)).thenReturn(Optional.of(todo1));

        // When & Then
        mockMvc.perform(get("/api/todos/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.title", is("テストタスク1")));
    }

    @Test
    void shouldReturn404WhenTodoNotFound() throws Exception {
        // Given
        when(todoService.getTodoById(999L)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/todos/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldCreateTodo() throws Exception {
        // Given
        Todo newTodo = Todo.builder()
                .title("新しいタスク")
                .description("これは新しいタスクです")
                .build();

        Todo savedTodo = Todo.builder()
                .id(3L)
                .title("新しいタスク")
                .description("これは新しいタスクです")
                .completed(false)
                .build();

        when(todoService.createTodo(any(Todo.class))).thenReturn(savedTodo);

        // When & Then
        mockMvc.perform(post("/api/todos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newTodo)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(3)))
                .andExpect(jsonPath("$.title", is("新しいタスク")))
                .andExpect(jsonPath("$.description", is("これは新しいタスクです")))
                .andExpect(jsonPath("$.completed", is(false)));
    }

    @Test
    void shouldUpdateTodo() throws Exception {
        // Given
        Todo updatedTodo = Todo.builder()
                .title("更新されたタスク")
                .description("これは更新されたタスクです")
                .completed(true)
                .build();

        Todo savedTodo = Todo.builder()
                .id(1L)
                .title("更新されたタスク")
                .description("これは更新されたタスクです")
                .completed(true)
                .build();

        when(todoService.updateTodo(eq(1L), any(Todo.class))).thenReturn(Optional.of(savedTodo));

        // When & Then
        mockMvc.perform(put("/api/todos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedTodo)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.title", is("更新されたタスク")))
                .andExpect(jsonPath("$.completed", is(true)));
    }

    @Test
    void shouldToggleTodoCompleted() throws Exception {
        // Given
        Todo toggledTodo = Todo.builder()
                .id(1L)
                .title("テストタスク1")
                .description("これはテスト用のタスク1です")
                .completed(true) // falseからtrueに変更
                .build();

        when(todoService.toggleTodoCompleted(1L)).thenReturn(Optional.of(toggledTodo));

        // When & Then
        mockMvc.perform(patch("/api/todos/1/toggle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.completed", is(true)));
    }

    @Test
    void shouldDeleteTodo() throws Exception {
        // Given
        when(todoService.deleteTodo(1L)).thenReturn(true);

        // When & Then
        mockMvc.perform(delete("/api/todos/1"))
                .andExpect(status().isNoContent());

        verify(todoService).deleteTodo(1L);
    }

    @Test
    void shouldReturn404WhenDeletingNonExistingTodo() throws Exception {
        // Given
        when(todoService.deleteTodo(anyLong())).thenReturn(false);

        // When & Then
        mockMvc.perform(delete("/api/todos/999"))
                .andExpect(status().isNotFound());
    }
}