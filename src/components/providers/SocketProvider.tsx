'use client';

import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function SocketProvider({ children }: Props) {
  return <>{children}</>;
}