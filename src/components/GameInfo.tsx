/**
 * Khôi phục GameInfo theo đúng giao diện ban đầu của sinh viên.
 * Dùng lại giao diện Player 1/Player 2 tĩnh.
 */
"use client";

interface GameInfoProps {
  playerName: string;
  isActive: boolean;
  pieces: number;
  color: string;
  timeLeft?: number; // Phase 2: Add timer prop
  score?: number; // Phase 2: Overall win counts
}

export default function GameInfo({
  playerName,
  isActive,
  pieces,
  color,
  timeLeft,
  score = 0,
}: GameInfoProps) {
  // =========================================================================
  // [UC-5 & UC-1: Bảng Thông Kê & Timer]
  // Chức năng: Component hiển thị thông tin bảng thống kê (Sidebar).
  // Đóng vai hiển thị các dữ liệu từ Model đẩy ra (Số lượng quân còn lại).
  // Mới (GĐ2): Bổ sung đồng hồ đếm ngược.
  // =========================================================================
  return (
    <div
      className={`
      bg-card border-2 rounded-lg p-6 shadow-lg transition-all relative overflow-hidden
      ${isActive ? `${color} ring-2 ring-offset-2 ring-primary` : "border-border"}
    `}
    >
      <div className="space-y-4 relative z-10">
        <h3 className="text-xl font-serif font-bold text-primary text-center">
          {playerName}
        </h3>

        <div
          className={`
          p-4 rounded-lg
          ${playerName.includes("1") ? "bg-primary/10" : "bg-secondary/10"}
        `}
        >
          <p className="text-center text-2xl font-serif font-bold text-primary">
            {playerName.includes("1") ? "●" : "○"}
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Trạng thái:</span>{" "}
            {isActive ? (
              <span className="text-accent font-semibold">Đến lượt</span>
            ) : (
              <span className="text-muted-foreground">Đang chờ</span>
            )}
          </p>
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Số quân:</span>{" "}
            {pieces}/16
          </p>
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">
              Thắng chung cuộc:
            </span>{" "}
            <span className="font-bold text-lg text-primary">{score} ván</span>
          </p>

          {/* Đếm ngược thời gian ở GĐ 2 */}
          {isActive && timeLeft !== undefined && (
            <p className="text-muted-foreground items-center text-[#a94438]">
              <span className="font-semibold text-[#a94438]">Thời gian:</span>{" "}
              <span className="text-base font-bold animate-pulse">
                {timeLeft}s
              </span>
            </p>
          )}
        </div>

        {isActive && (
          <div className="animate-pulse">
            <div className="h-2 bg-accent rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}
