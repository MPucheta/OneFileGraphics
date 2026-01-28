import { useCallback, useEffect, useState } from "react";

const useCode = (cacheKey: string, filePath: string) => {
  const [code, setCodeLocal] = useState(() => localStorage.getItem(cacheKey) || '');

  const setCode = useCallback((code: string) => {
    localStorage.setItem(cacheKey, code);
    setCodeLocal(code);
  }, []);

  useEffect(() => {
    const existingCode = localStorage.getItem(cacheKey);

    if (existingCode) {
      setCode(existingCode);
    } else {
      fetch(filePath)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch code');
          }
          return response.text();
        })
        .then((fileContents) => {
          setCode(fileContents);
        })
        .catch((error) => {
          console.error('Error fetching the file:', error);
        });
    }
  }, []);

  return {
    code,
    setCode,
  }
}

export default useCode;