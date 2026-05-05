import { useState, useCallback } from 'react';
import { initializeBoard, executeMove, type BoardState, type GameMove } from '@/lib/gameEngine';

export function useGameState() {
  const [boardState, setBoardState] = useState<BoardState | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  // =========================================================================
  // [UC-1: Khởi động và Thiết lập ván cờ] - Đảm nhận: Phúc
  // Chức năng: Controller gọi Model để khởi tạo/reset mảng game
  // Dùng chung cho khi mới tải trang và khi bấm nút "Chơi lại ván mới"
  // =========================================================================
  const initGame = useCallback(() => {
    setBoardState(initializeBoard());
    setSelectedPiece(null);
  }, []);

  const handlePieceSelect = useCallback((pieceId: string) => {
    setSelectedPiece(prev => (prev === pieceId ? null : pieceId));
  }, []);

  const handleMove = useCallback((toX: number, toY: number) => {
    if (!boardState || !selectedPiece) return;

    const piece = boardState.pieces.find(p => p.id === selectedPiece);
    if (!piece) return;

    const move: GameMove = {
      pieceId: selectedPiece,
      fromX: piece.x,
      fromY: piece.y,
      toX,
      toY,
    };

    const newState = executeMove(move, boardState);
    setBoardState(newState);
    setSelectedPiece(null);
  }, [boardState, selectedPiece]);

  return {
    boardState,
    selectedPiece,
    initGame,
    handlePieceSelect,
    handleMove,
  };
}
