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

export interface CardState {
    id: string;
    name: string;
    x: number;
    y: number;
    rotation: number;
    isFlipped: boolean;
    zIndex: number;
    imageUrl?: string;
}
