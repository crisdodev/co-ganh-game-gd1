"use client";

import { useEffect, useState } from "react";
import { getValidMoves, type BoardState } from "@/lib/gameEngine";
import { motion, AnimatePresence } from "framer-motion";

interface GameBoardProps {
  boardState: BoardState;
  selectedPiece: string | null;
  onPieceSelect: (pieceId: string) => void;
  onMove: (toX: number, toY: number) => void;
  gameOver: boolean;
}

const BOARD_SIZE = 5;
const CELL_SIZE = 64; // w-16 = 4rem = 64px

export default function GameBoard({
  boardState,
  selectedPiece,
  onPieceSelect,
  onMove,
  gameOver,
}: GameBoardProps) {
  const [validMoves, setValidMoves] = useState<Array<{ x: number; y: number }>>(
    [],
  );

  useEffect(() => {
    if (selectedPiece) {
      const moves = getValidMoves(selectedPiece, boardState);
      setValidMoves(moves);
    } else {
      setValidMoves([]);
    }
  }, [selectedPiece, boardState]);

  const getPieceAt = (x: number, y: number) => {
    return boardState.pieces.find((p) => p.x === x && p.y === y);
  };

  const handleSquareClick = (x: number, y: number) => {
    if (gameOver) return;

    const clickedPiece = getPieceAt(x, y);

    // If clicking on own piece, select it
    if (clickedPiece && clickedPiece.owner === boardState.currentPlayer) {
      onPieceSelect(clickedPiece.id);
      return;
    }

    // If a piece is selected and clicking on valid move
    if (selectedPiece && validMoves.some((m) => m.x === x && m.y === y)) {
      onMove(x, y);
      return;
    }

    // Deselect if clicking elsewhere
    if (!clickedPiece) {
      onPieceSelect("");
    }
  };

  return (
    <div className="flex items-center justify-center relative">
      {/* Box ngoài cùng nguyên bản */}
      <div className="bg-card border-8 border-primary shadow-2xl rounded-lg p-4 relative overflow-hidden">
        {/* Lớp Đồ Thị Topology (Node Graph) vẽ các đường line */}
        <div className="absolute inset-0 p-4 pointer-events-none z-0">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 320 320"
            className="stroke-muted-foreground/40"
            strokeWidth="3"
            strokeLinecap="round"
          >
            {/* Đường ngang */}
            {Array.from({ length: 5 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={32}
                y1={32 + i * 64}
                x2={288}
                y2={32 + i * 64}
              />
            ))}
            {/* Đường dọc */}
            {Array.from({ length: 5 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={32 + i * 64}
                y1={32}
                x2={32 + i * 64}
                y2={288}
              />
            ))}
            {/* Đường chéo chính */}
            <line x1={32} y1={32} x2={288} y2={288} />
            <line x1={288} y1={32} x2={32} y2={288} />
            {/* Đường chéo phụ */}
            <line x1={160} y1={32} x2={288} y2={160} />
            <line x1={32} y1={160} x2={160} y2={288} />
            <line x1={32} y1={160} x2={160} y2={32} />
            <line x1={160} y1={288} x2={288} y2={160} />
          </svg>
        </div>

        {/* Lưới grid tàng hình để làm điểm neo hitbox */}
        <div
          className="grid gap-0 relative z-10"
          style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
        >
          {Array.from({ length: BOARD_SIZE }).map((_, y) =>
            Array.from({ length: BOARD_SIZE }).map((_, x) => {
              const piece = getPieceAt(x, y);
              const isValid = validMoves.some((m) => m.x === x && m.y === y);
              const isSelected =
                selectedPiece &&
                boardState.pieces.find((p) => p.id === selectedPiece)?.x ===
                  x &&
                boardState.pieces.find((p) => p.id === selectedPiece)?.y === y;

              return (
                <button
                  key={`${x}-${y}`}
                  onClick={() => handleSquareClick(x, y)}
                  disabled={gameOver}
                  className={`
                    w-16 h-16 transition-all bg-transparent
                    hover:bg-accent/10 cursor-pointer rounded-full scale-90
                    relative flex items-center justify-center
                    ${isSelected ? "ring-2 ring-accent ring-offset-2 ring-offset-card" : ""}
                    ${gameOver ? "cursor-not-allowed" : ""}
                  `}
                >
                  {/* Chấm gợi ý điểm đến ở chính giữa ngã tư */}
                  {isValid && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 bg-accent rounded-full"></div>
                    </div>
                  )}

                  {/* [UC-2 & UC-4]: Framer Motion Animation cho hiệu ứng dịch chuyển */}
                  <AnimatePresence>
                    {piece && (
                      <motion.div
                        layoutId={piece.id}
                        initial={false}
                        animate={
                          boardState.lastCapturedIds?.includes(piece.id)
                            ? {
                                scale: [1, 1.3, 1],
                                filter: [
                                  "brightness(1)",
                                  "brightness(2)",
                                  "brightness(1)",
                                ],
                              }
                            : {
                                scale: 1,
                                filter: "brightness(1)",
                              }
                        }
                        transition={
                          boardState.lastCapturedIds?.includes(piece.id)
                            ? {
                                type: "keyframes",
                                duration: 0.5,
                                ease: "easeInOut",
                              }
                            : { type: "spring", stiffness: 350, damping: 25 }
                        }
                        className={`
                          absolute inset-2 rounded-full shadow-lg 
                          flex items-center justify-center font-serif font-bold text-lg
                          hover:scale-110 z-10
                          ${
                            piece.owner === "player1"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }
                        `}
                      >
                        {piece.owner === "player1" ? "●" : "○"}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
