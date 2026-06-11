import { useCallback, useEffect, useState } from 'react';
import { isDev } from '../featureFlag/isDEV';

const useCode = (cacheKey: string, filePath: string) => {
  const [code, setCodeLocal] = useState(
    () => localStorage.getItem(cacheKey) || ''
  );

  const setCode = useCallback(
    (code: string) => {
      localStorage.setItem(cacheKey, code);
      setCodeLocal(code);
    },
    [cacheKey]
  );

  useEffect(() => {
    const existingCode = !isDev ? localStorage.getItem(cacheKey) : null;

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
  }, [cacheKey, filePath, setCode]);

  return {
    code,
    setCode,
  };
};

export default useCode;
