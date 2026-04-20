'use client';

import { useState } from 'react';
import type { ScoutMode } from '../lib/types';

export function useMode() {
  const [mode, setMode] = useState<ScoutMode>('here-now');
  return { mode, setMode };
}
