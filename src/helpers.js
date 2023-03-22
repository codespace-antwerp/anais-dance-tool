export function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export function frameToTime(frame, fps) {
  return frame / fps;
}

export function timeToFrame(time, fps) {
  return time * fps;
}
