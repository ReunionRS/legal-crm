export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to convert file to Base64'))
    reader.readAsDataURL(file)
  })
}
