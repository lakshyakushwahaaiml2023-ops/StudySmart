// lib/animations.ts

/**
 * Stream text character by character with smooth typing effect
 * Perfect for chatbot responses
 */
export async function* streamText(text: string, delayMs: number = 30): AsyncGenerator<string> {
  for (const char of text) {
    yield char;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

/**
 * Stream text word by word (faster, looks more natural)
 */
export async function* streamTextByWord(text: string, delayMs: number = 50): AsyncGenerator<string> {
  const words = text.split(/(\s+)/);
  for (const word of words) {
    yield word;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

/**
 * Stream text in chunks (best for longer responses)
 */
export async function* streamTextInChunks(text: string, chunkSize: number = 10, delayMs: number = 40): AsyncGenerator<string> {
  for (let i = 0; i < text.length; i += chunkSize) {
    yield text.substring(i, i + chunkSize);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

/**
 * Create confetti particles for celebration
 */
export function createConfetti() {
  const confettiCount = 50;
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
  `;
  document.body.appendChild(container);

  const colors = ['#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 10 + 5;
    const delay = Math.random() * 0.2;
    const duration = Math.random() * 2 + 2;

    confetti.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      left: ${Math.random() * 100}vw;
      top: -10px;
      opacity: 0.8;
      animation: confettiFall ${duration}s linear ${delay}s forwards;
    `;

    container.appendChild(confetti);
  }

  setTimeout(() => container.remove(), 5000);
}

/**
 * Create particle burst effect
 */
export function createParticleBurst(x: number, y: number, color: string = '#06b6d4') {
  const particleCount = 20;
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 9999;
  `;
  document.body.appendChild(container);

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    const angle = (i / particleCount) * Math.PI * 2;
    const velocity = 3 + Math.random() * 2;
    const tx = Math.cos(angle) * velocity * 50;
    const ty = Math.sin(angle) * velocity * 50;
    const duration = 0.6 + Math.random() * 0.4;

    particle.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      background: ${color};
      border-radius: 50%;
      left: ${x}px;
      top: ${y}px;
      animation: particleBurst ${duration}s ease-out forwards;
      --tx: ${tx}px;
      --ty: ${ty}px;
    `;

    container.appendChild(particle);
  }

  // Add keyframes dynamically if not already present
  if (!document.querySelector('style[data-particle-burst]')) {
    const style = document.createElement('style');
    style.setAttribute('data-particle-burst', 'true');
    style.textContent = `
      @keyframes particleBurst {
        0% {
          transform: translate(0, 0);
          opacity: 1;
        }
        100% {
          transform: translate(var(--tx), var(--ty));
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => container.remove(), 1500);
}

/**
 * Create shimmer loading effect
 */
export function createShimmerLoading(element: HTMLElement) {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }
  `;
  document.head.appendChild(style);

  element.style.background = 'linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%)';
  element.style.backgroundSize = '1000px 100%';
  element.style.animation = 'shimmer 2s infinite';

  return () => {
    element.style.animation = 'none';
    element.style.background = '';
  };
}

/**
 * Smooth scroll to element
 */
export function smoothScrollToElement(element: HTMLElement, offset: number = 80) {
  const targetY = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({
    top: targetY,
    behavior: 'smooth',
  });
}

/**
 * Bounce animation trigger
 */
export function triggerBounce(element: HTMLElement) {
  element.classList.remove('animate-bounce-gentle');
  void element.offsetWidth; // Trigger reflow to restart animation
  element.classList.add('animate-bounce-gentle');
}

/**
 * Pulse glow effect
 */
export function triggerGlowPulse(element: HTMLElement, duration: number = 2000) {
  element.classList.add('animate-glowPulse');
  setTimeout(() => {
    element.classList.remove('animate-glowPulse');
  }, duration);
}

/**
 * Stagger animation for multiple elements
 */
export function staggerElements(elements: HTMLElement[], delayMs: number = 100) {
  elements.forEach((el, index) => {
    el.style.animation = `fadeInUp 0.6s ease-out ${index * delayMs}ms both`;
  });
}

/**
 * Smooth height transition
 */
export function smoothHeightTransition(element: HTMLElement, targetHeight: number, duration: number = 300) {
  element.style.overflow = 'hidden';
  element.style.transition = `height ${duration}ms ease-out`;
  element.style.height = targetHeight + 'px';
}

/**
 * Fade in element with delay
 */
export function fadeInWithDelay(element: HTMLElement, delayMs: number = 0) {
  element.style.opacity = '0';
  element.style.transition = 'opacity 0.5s ease-out';
  setTimeout(() => {
    element.style.opacity = '1';
  }, delayMs);
}

/**
 * Check if element is in viewport
 */
export function isElementInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.left <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Observe element and trigger animation when visible
 */
export function observeElement(element: HTMLElement, callback: () => void, options: IntersectionObserverInit = {}) {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      callback();
      observer.unobserve(element);
    }
  }, {
    threshold: 0.1,
    ...options,
  });

  observer.observe(element);
  return observer;
}

/**
 * Typewriter effect for headings
 */
export async function typewriterEffect(
  element: HTMLElement,
  text: string,
  speed: number = 50
): Promise<void> {
  element.textContent = '';
  for (const char of text) {
    element.textContent += char;
    await new Promise((resolve) => setTimeout(resolve, speed));
  }
}

/**
 * Draw checkmark SVG
 */
export function createCheckmark(container: HTMLElement, size: number = 100) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('width', size.toString());
  svg.setAttribute('height', size.toString());
  svg.style.cssText = `
    stroke: #10b981;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.5));
  `;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${size * 0.3} ${size * 0.55} L ${size * 0.45} ${size * 0.7} L ${size * 0.75} ${size * 0.35}`);
  path.style.cssText = `
    stroke-dasharray: ${size * 1.5};
    stroke-dashoffset: ${size * 1.5};
    animation: drawCheck 0.6s ease-out forwards;
  `;

  svg.appendChild(path);
  container.appendChild(svg);

  return svg;
}

/**
 * Ripple effect on click
 */
export function createRipple(event: MouseEvent, element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const radius = Math.max(rect.width, rect.height);
  const diameter = radius * 2;

  const ripple = document.createElement('span');
  ripple.style.cssText = `
    position: absolute;
    width: ${diameter}px;
    height: ${diameter}px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    transform: scale(0);
    animation: ripple 0.6s ease-out;
    pointer-events: none;
  `;

  const x = event.clientX - rect.left - radius;
  const y = event.clientY - rect.top - radius;
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';

  // Add keyframes if not present
  if (!document.querySelector('style[data-ripple]')) {
    const style = document.createElement('style');
    style.setAttribute('data-ripple', 'true');
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
