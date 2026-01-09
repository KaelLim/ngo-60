import { createContext } from '@lit/context';
import type { DataStore } from '../stores/data-store.js';

export const dataContext = createContext<DataStore>('data-store');
