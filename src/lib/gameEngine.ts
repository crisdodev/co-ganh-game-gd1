// src/lib/gameEngine.ts
import {
  Piece,
  BoardState,
  GameMove,
  Player,
  PieceColor,
  GamePhase,
} from "./types";
import { BoardTopology } from "./boardTopology";
import {
  getCapturedByGanh,
  getCapturedByChet,
  getCapturedByVay,
} from "./captureRules";

// Export các type cần thiết cho các chỗ khác dùng
export * from "./types";
export * from "./boardTopology";
export * from "./captureRules";

export const BOARD_SIZE = 5;
export const TOTAL_PIECES = 16;
export const MAX_DRAW_MOVES = 50;

// =========================================================================
// [UC-1: Khởi tạo và Thiết lập ván cờ]
// Chức năng: Khởi tạo dữ liệu
// =========================================================================
export function initializeBoard(): BoardState {
  const pieces: Piece[] = [];
  let id = 0;
  const matchId = Math.random().toString(36).slice(2, 6);

  // Player 1 (Bottom)
  for (let x = 0; x < 5; x++) {
    pieces.push({ id: `p1-${matchId}-${id++}`, x, y: 4, owner: "player1" });
  }
  pieces.push({ id: `p1-${matchId}-${id++}`, x: 0, y: 3, owner: "player1" });
  pieces.push({ id: `p1-${matchId}-${id++}`, x: 4, y: 3, owner: "player1" });
  pieces.push({ id: `p1-${matchId}-${id++}`, x: 0, y: 2, owner: "player1" });

  id = 0;
  // Player 2 (Top)
  for (let x = 0; x < 5; x++) {
    pieces.push({ id: `p2-${matchId}-${id++}`, x, y: 0, owner: "player2" });
  }
  pieces.push({ id: `p2-${matchId}-${id++}`, x: 0, y: 1, owner: "player2" });
  pieces.push({ id: `p2-${matchId}-${id++}`, x: 4, y: 1, owner: "player2" });
  pieces.push({ id: `p2-${matchId}-${id++}`, x: 4, y: 2, owner: "player2" });

  return {
    pieces,
    currentPlayer: "player1",
    gameOver: false,
    winner: null,
    phase: "playing",
    movesWithoutCapture: 0,
    message: "Đến lượt Người chơi 1",
  };
}

// =========================================================================
// [UC-3: Lấy danh sách nước đi hợp lệ]
// Sử dụng BoardTopology để tìm đường đi chính xác (ngang, dọc, chéo được phép)
// =========================================================================
export function getValidMoves(
  pieceId: string,
  state: BoardState,
): Array<{ x: number; y: number }> {
  const piece = state.pieces.find((p) => p.id === pieceId);
  if (!piece || piece.owner !== state.currentPlayer) return [];

  const neighbors = BoardTopology.getAvailableNeighbors(piece.x, piece.y);

  // Lọc bỏ những ô đã có quân chăng ngang
  return neighbors.filter(
    (n) => !state.pieces.some((p) => p.x === n.x && p.y === n.y),
  );
}

// Helper: Kiểm tra xem người chơi có bước đi hợp lệ nào không? (Check để xử Endgame do bí)
export function hasAnyValidMoves(state: BoardState, player: Player): boolean {
  const myPieces = state.pieces.filter((p) => p.owner === player);
  for (const p of myPieces) {
    if (getValidMoves(p.id, state).length > 0) return true;
  }
  return false;
}

// =========================================================================
// [UC-2, UC-4, UC-5: Thực thi nước đi & Gộp luồng Capture]
// Chức năng: Aggregator gom logic từ mọi nguồn tạo ra State Immutable mới
// =========================================================================
export function executeMove(move: GameMove, state: BoardState): BoardState {
  if (state.phase !== "playing") return state;

  // 1. Phân giải Immutable State (Copy array)
  let newPieces = state.pieces.map((p) => ({ ...p }));
  const movedPiece = newPieces.find((p) => p.id === move.pieceId);
  if (!movedPiece) return state;

  // Cập nhật vị trí quân di chuyển
  movedPiece.x = move.toX;
  movedPiece.y = move.toY;

  const myOwner = movedPiece.owner;
  const opponent = myOwner === "player1" ? "player2" : "player1";

  // 2. Chạy Pipeline Capture Rules [UC-4] (Gánh -> Chẹt -> Vây)
  const capturedByGanh = getCapturedByGanh(
    move.toX,
    move.toY,
    myOwner,
    newPieces,
  );
  const capturedByChet = getCapturedByChet(
    move.toX,
    move.toY,
    myOwner,
    newPieces,
  );

  let totalCaptured = [...capturedByGanh, ...capturedByChet];
  let isCaptureHappen = totalCaptured.length > 0;
  let lastCapturedIds: string[] = [];

  // Đổi màu quân bị ăn tức thì trước khi rà soát Vây (Vì Gánh/Chẹt dọn đường rồi mới tính Vây)
  for (const piece of totalCaptured) {
    const target = newPieces.find((p) => p.id === piece.id);
    if (target) {
      target.owner = myOwner;
      lastCapturedIds.push(piece.id);
    }
  }

  // Chạy tiếp Vây trên dữ liệu đã biến động
  const capturedByVay = getCapturedByVay(newPieces, opponent);
  if (capturedByVay.length > 0) {
    isCaptureHappen = true;
    for (const piece of capturedByVay) {
      const target = newPieces.find((p) => p.id === piece.id);
      if (target) {
        target.owner = myOwner;
        lastCapturedIds.push(piece.id);
      }
    }
  }

  // 3. Tính toán đếm nước đi (Draw Rule) [UC-5]
  let newMovesWithoutCapture = isCaptureHappen
    ? 0
    : state.movesWithoutCapture + 1;

  // 4. Kiểm tra điều kiện End Game [UC-5]
  const p1Count = newPieces.filter((p) => p.owner === "player1").length;
  const p2Count = newPieces.filter((p) => p.owner === "player2").length;
  let nextPlayer: Player = opponent;
  let phase: GamePhase = "playing";
  let winner: Player | null = null;
  let message = `Đến lượt ${nextPlayer === "player1" ? "Người chơi 1" : "Người chơi 2"}`;

  // Kiểm tra diệt sạch
  if (p1Count === 0 || p2Count === 0) {
    phase = "game_over";
    winner = p1Count === 0 ? "player2" : "player1";
    message = `${winner === "player1" ? "Người chơi 1" : "Người chơi 2"} chiến thắng! Đã ăn toàn bộ quân đối phương.`;
  }
  // Kiểm tra thế bí (nextPlayer không có đường đi)
  else if (
    !hasAnyValidMoves(
      { ...state, pieces: newPieces, currentPlayer: nextPlayer },
      nextPlayer,
    )
  ) {
    phase = "game_over";
    winner = myOwner; // Người vừa đánh (mình) đã chặn đường chết đối phương
    const loserName =
      nextPlayer === "player1" ? "Người chơi 1" : "Người chơi 2";
    const winnerName = winner === "player1" ? "Người chơi 1" : "Người chơi 2";
    message = `${loserName} hết nước đi. ${winnerName} chiến thắng!`;
  }
  // Kiểm tra hòa
  else if (newMovesWithoutCapture >= MAX_DRAW_MOVES) {
    phase = "draw";
    message = "Hai người chơi HÒA nhau! (Sau 50 lượt không ăn quân).";
  }

  return {
    pieces: newPieces,
    currentPlayer: nextPlayer,
    gameOver: phase !== "playing",
    winner,
    phase,
    movesWithoutCapture: newMovesWithoutCapture,
    message,
    lastCapturedIds,
  };
}

// =========================================================================
// [UC-1: Đếm ngược thời gian]
// Chức năng: Helper để cưỡng chế đổi lượt nếu người chơi bị Timeout
// =========================================================================
export function passTurn(state: BoardState): BoardState {
  if (state.phase !== "playing") return state;
  const nextPlayer = state.currentPlayer === "player1" ? "player2" : "player1";

  return {
    ...state,
    currentPlayer: nextPlayer,
    message: `Đến lượt ${nextPlayer === "player1" ? "Người chơi 1" : "Người chơi 2"}`,
  };
}
