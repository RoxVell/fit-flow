const activeRows = [
  [2, 8, 14, 22, 28, 35, 41, 48, 53],
  [5, 12, 18, 25, 31, 38, 44, 50, 55],
  [0, 7, 15, 21, 29, 36, 42, 47, 52],
  [4, 11, 17, 24, 32, 39, 46, 51, 54],
  [1, 9, 13, 20, 27, 34, 40, 49, 53],
  [6, 10, 19, 26, 30, 37, 43, 48, 55],
  [3, 8, 16, 23, 28, 35, 45, 50, 52],
  [0, 14, 21, 25, 32, 38, 44, 47, 54],
  [5, 11, 18, 27, 31, 36, 42, 49, 53],
  [2, 9, 15, 22, 29, 34, 41, 48, 51],
  [7, 13, 20, 26, 30, 39, 46, 50, 55],
  [4, 10, 17, 24, 28, 37, 43, 47, 52],
  [1, 8, 16, 23, 31, 35, 40, 49, 54],
  [6, 12, 19, 25, 32, 38, 45, 51, 55],
  [3, 9, 14, 21, 27, 36, 44, 48, 53],
  [0, 11, 18, 22, 29, 34, 42, 47, 52],
  [5, 13, 20, 26, 33, 39, 45, 50, 54],
];

// The original flex grid had 17 equal columns and rows measuring 6vw.
const cells = activeRows.flatMap((rows, column) =>
  rows.map((row) => `M${column * 100},${row * 102}h100v102h-100z`)
).join(" ");

export default function BlockOne() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white opacity-20 dark:bg-black before:absolute before:inset-0 before:z-1 before:bg-linear-to-t before:from-[#dbdbdb] dark:before:from-[#070707]">
      <div
        className="absolute inset-0 text-[#9ba1a131] dark:text-[#131212]"
        style={{
          backgroundImage: "linear-gradient(to right, currentColor 2px, transparent 2px), linear-gradient(to bottom, currentColor 2px, transparent 2px)",
          backgroundSize: "calc(100% / 17) 6vw",
        }}
      />
      <svg viewBox="0 0 1700 5712" className="absolute inset-x-0 top-0 h-auto w-full fill-[#9ba1a131] dark:fill-[#131212]">
        <path d={cells} />
      </svg>
    </div>
  );
}
