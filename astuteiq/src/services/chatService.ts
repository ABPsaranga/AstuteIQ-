import api from '../lib/api'
import type { ChatResponse } from '../types/chat'

export async function sendMessage(message: string): Promise<ChatResponse> {
  const response = await api.post<ChatResponse>('/assistant/chat', { message })
  return response.data
}