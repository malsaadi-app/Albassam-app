// Chart.js configuration utilities for RTL Arabic charts

export const chartColors = {
  purple: {
    primary: '#8B5CF6',
    light: '#A78BFA',
    dark: '#7C3AED'
  },
  gold: {
    primary: '#D4A574',
    light: '#E5C29F',
    dark: '#B8935F'
  },
  orange: '#E67E22',
  green: '#10B981',
  red: '#EF4444',
  blue: '#3B82F6',
  yellow: '#F59E0B'
};

export const chartOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      rtl: true,
      textDirection: 'rtl',
      labels: {
        font: {
          family: 'Arial, sans-serif',
          size: 12
        },
        color: '#E5E7EB',
        padding: 15,
        usePointStyle: true
      }
    },
    tooltip: {
      rtl: true,
      textDirection: 'rtl',
      backgroundColor: 'rgba(45, 27, 78, 0.95)',
      titleColor: '#D4A574',
      bodyColor: '#F3F4F6',
      borderColor: 'rgba(212, 165, 116, 0.3)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: {
        size: 14,
        weight: 'bold' as const
      },
      bodyFont: {
        size: 13
      }
    }
  }
};

export const createDonutChartData = (labels: string[], data: number[], colors: string[]) => ({
  labels,
  datasets: [{
    data,
    backgroundColor: colors,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    hoverOffset: 10
  }]
});

export const createLineChartData = (labels: string[], datasets: Array<{ label: string; data: number[]; color: string }>) => ({
  labels,
  datasets: datasets.map(ds => ({
    label: ds.label,
    data: ds.data,
    borderColor: ds.color,
    backgroundColor: `${ds.color}33`,
    tension: 0.4,
    fill: true,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBackgroundColor: ds.color,
    pointBorderColor: '#fff',
    pointBorderWidth: 2
  }))
});

export const createBarChartData = (labels: string[], data: number[], color: string) => ({
  labels,
  datasets: [{
    data,
    backgroundColor: color,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 8
  }]
});

export const lineChartOptions = {
  ...chartOptions,
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
        drawBorder: false
      },
      ticks: {
        color: '#9CA3AF',
        font: {
          size: 11
        }
      },
      reverse: true // RTL
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
        drawBorder: false
      },
      ticks: {
        color: '#9CA3AF',
        font: {
          size: 11
        }
      },
      beginAtZero: true
    }
  }
};

export const barChartOptions = {
  ...chartOptions,
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#9CA3AF',
        font: {
          size: 11
        }
      }
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
        drawBorder: false
      },
      ticks: {
        color: '#9CA3AF',
        font: {
          size: 11
        }
      },
      beginAtZero: true
    }
  },
  indexAxis: 'y' as const // Horizontal bars work better for RTL
};
