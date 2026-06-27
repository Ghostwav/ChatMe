export function TypingIndicator() {
  return (
    <span className="inline-flex items-center text-[#00a884] font-medium text-xs">
      typing
      <span className="ml-0.5 animate-[pulse_1.5s_ease-in-out_infinite] delay-0">.</span>
      <span className="animate-[pulse_1.5s_ease-in-out_infinite] delay-150">.</span>
      <span className="animate-[pulse_1.5s_ease-in-out_infinite] delay-300">.</span>
    </span>
  );
}
