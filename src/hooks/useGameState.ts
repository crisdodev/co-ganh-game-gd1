// src/hooks/useGameState.ts
import { useState, useCallback, useEffect } from "react";
import {
  initializeBoard,
  executeMove,
  passTurn,
  type BoardState,
  type GameMove,
} from "@/lib/gameEngine";

const TURN_TIME_LIMIT = 30; // 30 seconds per turn

export function useGameState() {
  const [boardState, setBoardState] = useState<BoardState | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  // Nâng cấp: Theo dõi tổng tỷ số Thắng - Thua chung cuộc
  const [scores, setScores] = useState({
    player1: 0,
    player2: 0,
    initialized: false,
  });

  // State phục vụ Timer
  const [timeLeft, setTimeLeft] = useState<number>(TURN_TIME_LIMIT);

  // =========================================================================
  // [UC-1: Khởi tạo và Thiết lập ván cờ]
  // =========================================================================
  const initGame = useCallback(() => {
    setBoardState(initializeBoard());
    setSelectedPiece(null);
    setTimeLeft(TURN_TIME_LIMIT); // Reset timer
  }, []);

  // =========================================================================
  // [UC-1: Quản lý Timer đếm ngược]
  // Chức năng: Observer pattern - Chạy đếm ngược mỗi giây. Nếu hết giờ đổi lượt.
  // =========================================================================

  // 1. Interval đếm giảm thời gian (Chỉ chạy khi đang playing)
  useEffect(() => {
    if (!boardState || boardState.phase !== "playing") return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [boardState?.currentPlayer, boardState?.phase]);

  // 2. Chuyển lượt khi hết giờ
  useEffect(() => {
    if (timeLeft <= 0 && boardState?.phase === "playing") {
      setBoardState((currentState) => {
        if (currentState) return passTurn(currentState);
        return currentState;
      });
      setSelectedPiece(null);
      setTimeLeft(TURN_TIME_LIMIT);
    }
  }, [timeLeft, boardState?.phase]);

  // 3. Reset thời gian ngay khi lượt thay đổi (ai đó vừa đi xong)
  useEffect(() => {
    if (boardState?.phase === "playing") {
      setTimeLeft(TURN_TIME_LIMIT);
    }
  }, [boardState?.currentPlayer, boardState?.phase]);

  // 4. Cập nhật tỷ số khi kết thúc ván
  useEffect(() => {
    if (
      boardState?.phase === "game_over" &&
      boardState.winner &&
      !scores.initialized
    ) {
      const winnerKey = boardState.winner as "player1" | "player2";
      setScores((prev) => ({
        ...prev,
        [winnerKey]: prev[winnerKey] + 1,
        initialized: true,
      }));
    } else if (boardState?.phase === "playing" && scores.initialized) {
      setScores((prev) => ({ ...prev, initialized: false }));
    }
  }, [boardState?.phase, boardState?.winner]);

  // =========================================================================
  // [UC-2: Di chuyển quân cờ]
  // =========================================================================
  const handlePieceSelect = useCallback((pieceId: string) => {
    setSelectedPiece((prev) => (prev === pieceId ? null : pieceId));
  }, []);

  const handleMove = useCallback(
    (toX: number, toY: number) => {
      if (!boardState || !selectedPiece) return;

      const piece = boardState.pieces.find((p) => p.id === selectedPiece);
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
      setTimeLeft(TURN_TIME_LIMIT); // Đánh xong reset timer
    },
    [boardState, selectedPiece],
  );

  return {
    boardState,
    selectedPiece,
    timeLeft,
    scores,
    initGame,
    handlePieceSelect,
    handleMove,
  };
}
