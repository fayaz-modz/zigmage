import { create } from 'zustand';

interface StatusState {
	isVisible: boolean;
	label: string;
	value: string;
	showStatus: (label: string, value: string) => void;
	hideStatus: () => void;
}

export const useStatusPill = create<StatusState>((set) => ({
	isVisible: false,
	label: '',
	value: '',
	showStatus: (label, value) => set({ isVisible: true, label, value }),
	hideStatus: () => set({ isVisible: false }),
}));
