export const config = {
  tags: {
    Environment: "Development",
    Project: "TodoApp",
  },
  database: {
    dbName: "todo_db",
    username: "admin",
    port: 3306,
  },
  backend: {
    container_port: 8080,
    desired_count: 1,
    task_cpu: 256,
    task_memory: 512,
    service_name: "todo-backend-service",
  },
};
