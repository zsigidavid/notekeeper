import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const fetchNotes = async (token: string) => {
  const response = await axios.get(`${API_URL}/notes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createNote = async (note: { title: string; content: string }, token: string) => {
  const response = await axios.post(`${API_URL}/notes`, note, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateNote = async (id: string, note: { title: string; content: string }, token: string) => {
  const response = await axios.put(`${API_URL}/notes/${id}`, note, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteNote = async (id: string, token: string) => {
  const response = await axios.delete(`${API_URL}/notes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};