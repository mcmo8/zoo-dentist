/* 24 CSS-animated confetti pieces — cheap on old Androids, loops forever. */

const COLORS = ['#ff7bac', '#ffe066', '#6fc9ec', '#9be37c', '#cba8f5', '#ff9f5a', '#fff'];

export function Confetti() {
  return (
    <div className="zd-confetti" aria-hidden>
      {Array.from({ length: 24 }).map((_, i) => {
        const left = (i * 41) % 100;
        const delay = (i * 0.37) % 2.4;
        const dur = 2.6 + ((i * 13) % 10) / 7;
        const color = COLORS[i % COLORS.length];
        const round = i % 3 === 0;
        return (
          <span
            key={i}
            className="zd-confetti-piece"
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
              background: color,
              borderRadius: round ? '50%' : '2px',
            }}
          />
        );
      })}
    </div>
  );
}
