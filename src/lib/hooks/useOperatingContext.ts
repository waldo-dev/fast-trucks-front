"use client";

import { useEffect, useState } from 'react';
import { OperatingContext, readOperatingContext, watchOperatingContext } from '../operatingContext';

export const useOperatingContext = () => {
  const [context, setContext] = useState<OperatingContext>(() => readOperatingContext());

  useEffect(() => {
    const unsubscribe = watchOperatingContext(setContext);
    return unsubscribe;
  }, []);

  return context;
};
