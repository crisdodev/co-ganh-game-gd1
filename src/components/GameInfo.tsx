"use client";

interface GameInfoProps {
  playerName: string;
  isActive: boolean;
  pieces: number;
  color: string;
}

export default function GameInfo({
  playerName,
  isActive,
  pieces,
  color,
}: GameInfoProps) {
  // =========================================================================
  // [UC-5: Theo dõi diễn biến và kết thúc ván cờ] - Đảm nhận: Chí
  // Chức năng: View - Component hiển thị thông tin bảng thống kê (Sidebar).
  // Đóng vai hiển thị các dữ liệu từ Model đẩy ra: Số lượng quân còn lại,
  // Đổi trạng thái hiển thị: "Đến lượt" / "Đang chờ".
  // =========================================================================
  return (
    <div
      className={`
      bg-card border-2 rounded-lg p-6 shadow-lg transition-all
      ${isActive ? `${color} ring-2 ring-offset-2 ring-primary` : "border-border"}
    `}
    >
      <div className="space-y-4">
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
