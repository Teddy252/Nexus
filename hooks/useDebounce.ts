import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Atualiza o valor debounced após o delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancela o timeout se o valor mudar (isso evita que o valor antigo seja setado)
    // ou se o componente for desmontado.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Apenas re-executa o efeito se o valor ou o delay mudar

  return debouncedValue;
}