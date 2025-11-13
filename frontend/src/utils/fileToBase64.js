export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]); // só o base64
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
