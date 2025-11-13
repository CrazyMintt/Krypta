export function toBase64(arr) {
  return btoa(String.fromCharCode(...arr));
}