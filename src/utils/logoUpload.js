export function createLogoPreviewDataUrl(file, maxSize = 160) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('Nao foi possivel ler o arquivo do logo.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('Arquivo de logo invalido.'))
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
        const width = Math.max(1, Math.round(image.width * scale))
        const height = Math.max(1, Math.round(image.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Nao foi possivel gerar a miniatura do logo.'))
          return
        }

        context.clearRect(0, 0, width, height)
        context.drawImage(image, 0, 0, width, height)
        resolve(canvas.toDataURL('image/png', 0.92))
      }

      image.src = String(reader.result)
    }

    reader.readAsDataURL(file)
  })
}
