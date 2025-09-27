import axios from "axios";
import { Todo } from "../types/Todo";
// import dotenv from "dotenv";

// dotenv.config();

// APIのベースURLを環境変数から取得
// const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";
const API_URL = `https://d3gfssw5pky79.cloudfront.net/api`;

export const TodoService = {
  getAll: async (): Promise<Todo[]> => {
    const response = await axios.get(`${API_URL}/todos`);
    return response.data;
  },

  getById: async (id: number): Promise<Todo> => {
    const response = await axios.get(`${API_URL}/todos/${id}`);
    return response.data;
  },

  create: async (todo: Todo): Promise<Todo> => {
    const response = await axios.post(`${API_URL}/todos`, todo);
    return response.data;
  },

  update: async (id: number, todo: Todo): Promise<Todo> => {
    const response = await axios.put(`${API_URL}/todos/${id}`, todo);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/todos/${id}`);
  },

  toggleCompleted: async (id: number): Promise<Todo> => {
    const response = await axios.patch(`${API_URL}/todos/${id}/toggle`);
    return response.data;
  },
};
