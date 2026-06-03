function arrayBufferToBase64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

export function readFileAsDataUrl(file) {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onerror = () => reject(new Error('Nao foi possivel ler o arquivo do logo.'))
      reader.onload = () => resolve(String(reader.result || ''))
      reader.readAsDataURL(file)
    })
  }

  if (typeof file?.arrayBuffer === 'function') {
    return file.arrayBuffer().then((buffer) => {
      const mimeType = file.type || 'application/octet-stream'
      return `data:${mimeType};base64,${arrayBufferToBase64(buffer)}`
    })
  }

  return Promise.reject(new Error('Leitura de arquivo nao suportada neste navegador.'))
}

export async function createLogoPreviewDataUrl(file, maxSize = 160) {
  const sourceDataUrl = await readFileAsDataUrl(file)

  return new Promise((resolve, reject) => {
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

    image.src = sourceDataUrl
  })
}
