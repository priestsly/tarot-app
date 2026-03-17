export interface ActivityLog {
    id: string;
    message: string;
    timestamp: string;
    userId: string;
}

export interface CursorData {
    x: number;
    y: number;
}

export interface ChatMessage {
    id: string;
    sender: string;
    text?: string;
    audioUrl?: string;
    timestamp: string;
}
