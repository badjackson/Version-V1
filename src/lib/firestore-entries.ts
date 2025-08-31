import { db } from './firebase';
import {
  doc, setDoc, serverTimestamp, onSnapshot,
  collection
} from 'firebase/firestore';

export async function upsertHourlyEntry(p: {
  sector: string; hour: number; competitorId: string;
  boxNumber: number; fishCount: number; totalWeight: number;
  status: string; source: 'Judge'|'Admin'; updatedBy: string;
}) {
  const id = `${p.sector}-${p.hour}-${p.competitorId}`;
  await setDoc(doc(db, 'hourly_entries', id), { ...p, timestamp: serverTimestamp() }, { merge: true });
}

export function subscribeHourlyAll(
  onNext: (rows: any[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, 'hourly_entries'),
    (snap) => onNext(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => onError?.(err)
  );
}

export async function upsertBigCatch(p: {
  sector: string; competitorId: string; boxNumber: number;
  biggestCatch: number; status: string; source: 'Judge'|'Admin'; updatedBy: string;
}) {
  const id = `${p.sector}-${p.competitorId}`;
  await setDoc(doc(db, 'big_catches', id), { ...p, timestamp: serverTimestamp() }, { merge: true });
}

export function subscribeBigCatchAll(
  onNext: (rows: any[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, 'big_catches'),
    (snap) => onNext(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => onError?.(err)
  );
}