'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Fish, Scale, Plus, Check, X, Eye, Clock } from 'lucide-react';
import HourlyDataEntry from './HourlyDataEntry';

export default function JudgeWorkspace() {
  const t = useTranslations('common');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Espace Juge</CardTitle>
        </CardHeader>
        <CardContent>
          <HourlyDataEntry />
        </CardContent>
      </Card>
    </div>
  );
}