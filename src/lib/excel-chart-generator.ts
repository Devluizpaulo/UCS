// Função para criar gráfico de pizza usando Canvas nativo (compatível com Next.js)
export async function createPieChartImage(
  data: { label: string; value: number; color: string }[],
  title: string,
  width: number = 400,
  height: number = 300
): Promise<string> {
  try {
    // Verificar se estamos no browser
    if (typeof window === 'undefined') {
      console.warn('Canvas não disponível no servidor, usando fallback');
      return '';
    }

    // Criar canvas temporário
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Canvas context not available');

    // Configurar cores padrão
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];

    // Limpar canvas com fundo branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Desenhar título
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 30);

    // Calcular total
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return '';

    // Desenhar gráfico de pizza
    const centerX = width / 2;
    const centerY = height / 2 + 20;
    const radius = Math.min(width, height) / 3;

    let currentAngle = 0;

    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const color = item.color || colors[index % colors.length];

      // Desenhar fatia da pizza
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Desenhar borda branca
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Desenhar legenda
      const legendX = width - 150;
      const legendY = 60 + index * 25;
      
      // Quadrado colorido da legenda
      ctx.fillStyle = color;
      ctx.fillRect(legendX, legendY - 10, 15, 15);
      
      // Texto da legenda
      ctx.fillStyle = '#333333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      const percentage = ((item.value / total) * 100).toFixed(1);
      ctx.fillText(`${item.label}: ${percentage}%`, legendX + 20, legendY);

      currentAngle += sliceAngle;
    });

    // Converter para base64
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Erro ao criar gráfico de pizza:', error);
    return '';
  }
}

// Função para criar gráfico de barras usando Canvas nativo (compatível com Next.js)
export async function createBarChartImage(
  data: { label: string; value: number; color: string }[],
  title: string,
  width: number = 500,
  height: number = 300
): Promise<string> {
  try {
    // Verificar se estamos no browser
    if (typeof window === 'undefined') {
      console.warn('Canvas não disponível no servidor, usando fallback');
      return '';
    }

    // Criar canvas temporário
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Canvas context not available');

    // Limpar canvas com fundo branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Desenhar título
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 30);

    // Calcular valores
    const maxValue = Math.max(...data.map(item => item.value));
    if (maxValue === 0) return '';

    // Desenhar gráfico de barras
    const barWidth = (width - 100) / data.length;
    const chartHeight = height - 100;

    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = 50 + index * barWidth;
      const y = height - 50 - barHeight;
      const color = item.color || '#36A2EB';

      // Desenhar barra
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth - 10, barHeight);

      // Desenhar borda branca
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth - 10, barHeight);

      // Desenhar label do eixo X
      ctx.fillStyle = '#333333';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barWidth / 2, height - 30);
      
      // Desenhar valor no topo da barra
      ctx.font = '9px Arial';
      ctx.fillText(item.value.toLocaleString('pt-BR'), x + barWidth / 2, y - 5);
    });

    // Desenhar eixo Y
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, height - 50);
    ctx.lineTo(50, 50);
    ctx.stroke();

    // Converter para base64
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Erro ao criar gráfico de barras:', error);
    return '';
  }
}

// Função para adicionar imagem ao Excel
export async function addImageToExcelWorksheet(
  worksheet: any,
  imageDataUrl: string,
  position: { row: number; col: number },
  size: { width: number; height: number }
) {
  try {
    if (!imageDataUrl) return;
    
    // Converter base64 para buffer
    const base64Data = imageDataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Adicionar imagem ao worksheet
    const imageId = worksheet.addImage({
      buffer: buffer,
      extension: 'png',
    });

    // Posicionar imagem
    worksheet.addImage(imageId, {
      tl: { col: position.col, row: position.row },
      br: { col: position.col + 1, row: position.row + 1 }
    });
  } catch (error) {
    console.warn('Erro ao adicionar imagem ao Excel:', error);
  }
}
