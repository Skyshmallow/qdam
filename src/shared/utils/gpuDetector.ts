/**
 * GPU Tier Detection for Adaptive Quality
 * 
 * Определяет уровень GPU устройства и возвращает оптимальные настройки
 * для 3D рендеринга (количество травы, эффекты, тени и т.д.)
 */

export type GPUTier = 'high' | 'medium' | 'low';

export interface GPUInfo {
  tier: GPUTier;
  renderer: string;
  vendor: string;
  isMobile: boolean;
  deviceMemory?: number;
  hardwareConcurrency: number;
}

export interface QualitySettings {
  grassInstanceCount: number;
  enableShaders: boolean;
  enableSphereEffects: boolean;
  shadowQuality: 'high' | 'medium' | 'low' | 'off';
  textureQuality: 'high' | 'medium' | 'low';
  antialias: boolean;
  maxLights: number;
}

/**
 * Определяет уровень GPU устройства
 */
export function detectGPU(): GPUInfo {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl || !(gl instanceof WebGLRenderingContext)) {
    console.warn('[GPUDetector] WebGL not supported, defaulting to low tier');
    return {
      tier: 'low',
      renderer: 'Unknown',
      vendor: 'Unknown',
      isMobile: isMobileDevice(),
      hardwareConcurrency: navigator.hardwareConcurrency || 2,
    };
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo 
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) 
    : 'Unknown';
  const vendor = debugInfo 
    ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) 
    : 'Unknown';

  // @ts-ignore - DeviceMemory API (experimental)
  const deviceMemory = navigator.deviceMemory;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const isMobile = isMobileDevice();

  // Определяем tier на основе характеристик
  const tier = calculateGPUTier({
    renderer,
    vendor,
    isMobile,
    deviceMemory,
    hardwareConcurrency,
  });

  const info: GPUInfo = {
    tier,
    renderer,
    vendor,
    isMobile,
    deviceMemory,
    hardwareConcurrency,
  };

  console.log('[GPUDetector] Detected GPU:', info);
  
  return info;
}

/**
 * Проверка на мобильное устройство
 */
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Расчет tier GPU на основе характеристик
 */
function calculateGPUTier(info: {
  renderer: string;
  vendor: string;
  isMobile: boolean;
  deviceMemory?: number;
  hardwareConcurrency: number;
}): GPUTier {
  const { renderer, isMobile, deviceMemory, hardwareConcurrency } = info;
  
  const rendererLower = renderer.toLowerCase();
  
  // High-end GPUs
  const highEndPatterns = [
    'nvidia',
    'geforce rtx',
    'geforce gtx 16',
    'geforce gtx 20',
    'geforce gtx 30',
    'geforce gtx 40',
    'radeon rx 6',
    'radeon rx 7',
    'apple m1',
    'apple m2',
    'apple m3',
  ];
  
  // Low-end indicators
  const lowEndPatterns = [
    'intel hd',
    'intel uhd',
    'swiftshader',
    'mesa',
    'software',
  ];
  
  // Проверка на high-end
  if (highEndPatterns.some(pattern => rendererLower.includes(pattern))) {
    // Но если мобильное устройство - макс medium
    return isMobile ? 'medium' : 'high';
  }
  
  // Проверка на low-end
  if (lowEndPatterns.some(pattern => rendererLower.includes(pattern))) {
    return 'low';
  }
  
  // Проверка по памяти устройства
  if (deviceMemory !== undefined) {
    if (deviceMemory >= 8) return isMobile ? 'medium' : 'high';
    if (deviceMemory >= 4) return 'medium';
    return 'low';
  }
  
  // Проверка по количеству ядер
  if (hardwareConcurrency >= 8) return isMobile ? 'medium' : 'high';
  if (hardwareConcurrency >= 4) return 'medium';
  
  // Default: mobile = low, desktop = medium
  return isMobile ? 'low' : 'medium';
}

/**
 * Получить оптимальные настройки качества для данного tier
 */
export function getOptimalSettings(tier: GPUTier): QualitySettings {
  switch (tier) {
    case 'high':
      return {
        grassInstanceCount: 15000,
        enableShaders: true,
        enableSphereEffects: true,
        shadowQuality: 'high',
        textureQuality: 'high',
        antialias: true,
        maxLights: 4,
      };
    
    case 'medium':
      return {
        grassInstanceCount: 5000,
        enableShaders: true,
        enableSphereEffects: true,
        shadowQuality: 'medium',
        textureQuality: 'medium',
        antialias: true,
        maxLights: 2,
      };
    
    case 'low':
      return {
        grassInstanceCount: 2000,
        enableShaders: false,
        enableSphereEffects: false,
        shadowQuality: 'off',
        textureQuality: 'low',
        antialias: false,
        maxLights: 1,
      };
  }
}

/**
 * Хук для использования в React компонентах
 */
export function useGPUDetection() {
  // Мемоизируем результат (определяем только один раз)
  const gpuInfo = detectGPU();
  const settings = getOptimalSettings(gpuInfo.tier);
  
  return {
    gpuInfo,
    settings,
  };
}

/**
 * Singleton для глобального доступа
 */
class GPUDetectorSingleton {
  private static instance: GPUDetectorSingleton;
  private _gpuInfo: GPUInfo | null = null;
  private _settings: QualitySettings | null = null;
  
  static getInstance(): GPUDetectorSingleton {
    if (!this.instance) {
      this.instance = new GPUDetectorSingleton();
    }
    return this.instance;
  }
  
  get gpuInfo(): GPUInfo {
    if (!this._gpuInfo) {
      this._gpuInfo = detectGPU();
      this._settings = getOptimalSettings(this._gpuInfo.tier);
    }
    return this._gpuInfo;
  }
  
  get settings(): QualitySettings {
    if (!this._settings) {
      this.gpuInfo; // Trigger detection
    }
    return this._settings!;
  }
}

export const gpuDetector = GPUDetectorSingleton.getInstance();
